const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3005;

// Database connection
const pool = new Pool(config.database);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Helper to get user ID from header
const getUserId = (req) => {
  return req.headers['x-user-id'];
};

// Routes
app.get('/leaderboards', async (req, res) => {
  const { type = 'portfolio_value', timeframe = 'all_time', limit = 10 } = req.query;
  
  try {
    let query;
    const queryParams = [limit];
    
    // Build query based on leaderboard type
    if (type === 'portfolio_value') {
      query = `
        SELECT u.user_id, u.first_name, u.last_name, p.total_value,
               RANK() OVER (ORDER BY p.total_value DESC) as rank
        FROM portfolios p
        JOIN users u ON p.user_id = u.user_id
        ORDER BY p.total_value DESC
        LIMIT $1
      `;
    } else if (type === 'trading_activity') {
      // For trading activity, we count the number of transactions
      query = `
        SELECT u.user_id, u.first_name, u.last_name, COUNT(t.transaction_id) as trade_count,
               RANK() OVER (ORDER BY COUNT(t.transaction_id) DESC) as rank
        FROM users u
        JOIN transactions t ON u.user_id = t.user_id
        ${timeframe === 'month' ? 'WHERE t.executed_at >= NOW() - INTERVAL \'30 days\'' : ''}
        ${timeframe === 'week' ? 'WHERE t.executed_at >= NOW() - INTERVAL \'7 days\'' : ''}
        GROUP BY u.user_id, u.first_name, u.last_name
        ORDER BY trade_count DESC
        LIMIT $1
      `;
    } else if (type === 'returns') {
      // For returns, we calculate the percentage gain
      query = `
        SELECT u.user_id, u.first_name, u.last_name, 
               ((p.total_value - p.total_invested) / NULLIF(p.total_invested, 0)) * 100 as return_percentage,
               RANK() OVER (ORDER BY ((p.total_value - p.total_invested) / NULLIF(p.total_invested, 0)) DESC) as rank
        FROM portfolios p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.total_invested > 0
        ORDER BY return_percentage DESC
        LIMIT $1
      `;
    } else if (type === 'team_holders') {
      // For team holders, we need the team ID
      const { teamId } = req.query;
      if (!teamId) {
        return res.status(400).json({
          code: 'INVALID_INPUT',
          message: 'Team ID is required for team holders leaderboard'
        });
      }
      
      query = `
        SELECT u.user_id, u.first_name, u.last_name, ph.shares,
               RANK() OVER (ORDER BY ph.shares DESC) as rank
        FROM portfolio_holdings ph
        JOIN portfolios p ON ph.portfolio_id = p.portfolio_id
        JOIN users u ON p.user_id = u.user_id
        WHERE ph.team_id = $2
        ORDER BY ph.shares DESC
        LIMIT $1
      `;
      queryParams.push(teamId);
    }
    
    const result = await pool.query(query, queryParams);
    
    res.status(200).json({
      leaderboard: {
        type,
        timeframe,
        entries: result.rows.map(row => ({
          userId: row.user_id,
          name: `${row.first_name} ${row.last_name}`,
          rank: row.rank,
          value: type === 'portfolio_value' ? parseFloat(row.total_value) :
                 type === 'trading_activity' ? parseInt(row.trade_count) :
                 type === 'returns' ? parseFloat(row.return_percentage) :
                 type === 'team_holders' ? parseFloat(row.shares) : null
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching leaderboard data'
    });
  }
});

app.get('/community/discussions', async (req, res) => {
  const { teamId, page = 1, limit = 20 } = req.query;
  
  try {
    if (!teamId) {
      return res.status(400).json({
        code: 'INVALID_INPUT',
        message: 'Team ID is required'
      });
    }
    
    const offset = (page - 1) * limit;
    
    // Get discussions for a team
    const query = `
      SELECT d.*, u.first_name, u.last_name,
             (SELECT COUNT(*) FROM discussion_comments WHERE discussion_id = d.discussion_id) as comment_count
      FROM discussions d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.team_id = $1
      ORDER BY d.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [teamId, limit, offset]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM discussions
      WHERE team_id = $1
    `;
    
    const countResult = await pool.query(countQuery, [teamId]);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      discussions: result.rows.map(discussion => ({
        discussionId: discussion.discussion_id,
        title: discussion.title,
        content: discussion.content,
        author: {
          userId: discussion.user_id,
          name: `${discussion.first_name} ${discussion.last_name}`
        },
        commentCount: parseInt(discussion.comment_count),
        createdAt: discussion.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching discussions'
    });
  }
});

app.post('/community/discussions', async (req, res) => {
  const userId = getUserId(req);
  const { teamId, title, content } = req.body;
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  if (!teamId || !title || !content) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Team ID, title, and content are required'
    });
  }
  
  try {
    // Create new discussion
    const discussionId = uuidv4();
    const query = `
      INSERT INTO discussions (discussion_id, team_id, user_id, title, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING discussion_id, created_at
    `;
    
    const result = await pool.query(query, [discussionId, teamId, userId, title, content]);
    
    res.status(201).json({
      discussionId: result.rows[0].discussion_id,
      title,
      content,
      createdAt: result.rows[0].created_at,
      message: 'Discussion created successfully'
    });
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while creating discussion'
    });
  }
});

app.get('/community/discussions/:discussionId/comments', async (req, res) => {
  const { discussionId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  try {
    const offset = (page - 1) * limit;
    
    // Get comments for a discussion
    const query = `
      SELECT c.*, u.first_name, u.last_name
      FROM discussion_comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.discussion_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [discussionId, limit, offset]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM discussion_comments
      WHERE discussion_id = $1
    `;
    
    const countResult = await pool.query(countQuery, [discussionId]);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      comments: result.rows.map(comment => ({
        commentId: comment.comment_id,
        content: comment.content,
        author: {
          userId: comment.user_id,
          name: `${comment.first_name} ${comment.last_name}`
        },
        createdAt: comment.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching comments'
    });
  }
});

app.post('/community/discussions/:discussionId/comments', async (req, res) => {
  const userId = getUserId(req);
  const { discussionId } = req.params;
  const { content } = req.body;
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  if (!content) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Comment content is required'
    });
  }
  
  try {
    // Create new comment
    const commentId = uuidv4();
    const query = `
      INSERT INTO discussion_comments (comment_id, discussion_id, user_id, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING comment_id, created_at
    `;
    
    const result = await pool.query(query, [commentId, discussionId, userId, content]);
    
    res.status(201).json({
      commentId: result.rows[0].comment_id,
      content,
      createdAt: result.rows[0].created_at,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while creating comment'
    });
  }
});

app.get('/community/activity', async (req, res) => {
  const userId = getUserId(req);
  const { page = 1, limit = 20 } = req.query;
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  try {
    const offset = (page - 1) * limit;
    
    // Get user activity feed
    const query = `
      SELECT ua.*, u.first_name, u.last_name
      FROM user_activities ua
      JOIN users u ON ua.user_id = u.user_id
      WHERE ua.user_id = $1 OR ua.user_id IN (
        SELECT followed_id FROM user_follows WHERE follower_id = $1
      )
      ORDER BY ua.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM user_activities ua
      WHERE ua.user_id = $1 OR ua.user_id IN (
        SELECT followed_id FROM user_follows WHERE follower_id = $1
      )
    `;
    
    const countResult = await pool.query(countQuery, [userId]);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      activities: result.rows.map(activity => ({
        activityId: activity.activity_id,
        activityType: activity.activity_type,
        user: {
          userId: activity.user_id,
          name: `${activity.first_name} ${activity.last_name}`
        },
        referenceId: activity.reference_id,
        metadata: activity.metadata,
        createdAt: activity.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching activity feed'
    });
  }
});

app.get('/community/achievements', async (req, res) => {
  const userId = getUserId(req);
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  try {
    // Get user achievements
    const query = `
      SELECT a.*, ua.earned_at, ua.progress
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = $1
      ORDER BY a.category, a.difficulty
    `;
    
    const result = await pool.query(query, [userId]);
    
    // Group achievements by category
    const achievementsByCategory = {};
    
    result.rows.forEach(achievement => {
      if (!achievementsByCategory[achievement.category]) {
        achievementsByCategory[achievement.category] = [];
      }
      
      achievementsByCategory[achievement.category].push({
        achievementId: achievement.achievement_id,
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.icon_url,
        difficulty: achievement.difficulty,
        requirement: achievement.requirement,
        rewardType: achievement.reward_type,
        rewardAmount: parseFloat(achievement.reward_amount),
        isEarned: !!achievement.earned_at,
        earnedAt: achievement.earned_at,
        progress: achievement.progress ? parseFloat(achievement.progress) : 0
      });
    });
    
    res.status(200).json({
      achievements: achievementsByCategory
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching achievements'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Community Service running on port ${PORT}`);
});

module.exports = app;
