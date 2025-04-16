// services/rewards-service/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3004;

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
app.get('/rewards', async (req, res) => {
  const userId = getUserId(req);
  const { teamId, type = 'all', status = 'active', page = 1, limit = 20 } = req.query;
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  try {
    const offset = (page - 1) * limit;
    
    // Build query
    let query = `
      SELECT r.*, t.name as team_name, t.logo_url as team_logo_url,
        (
          SELECT COUNT(*)
          FROM user_rewards ur
          WHERE ur.reward_id = r.reward_id AND ur.user_id = $1
        ) > 0 as already_redeemed,
        (
          CASE WHEN r.required_shares IS NOT NULL THEN
            (
              SELECT COALESCE(SUM(ph.shares), 0) >= r.required_shares
              FROM portfolio_holdings ph
              JOIN portfolios p ON ph.portfolio_id = p.portfolio_id
              WHERE p.user_id = $1 AND ph.team_id = r.team_id
            )
          WHEN r.required_hold_days IS NOT NULL THEN
            (
              SELECT EXISTS (
                SELECT 1
                FROM portfolio_holdings ph
                JOIN portfolios p ON ph.portfolio_id = p.portfolio_id
                WHERE p.user_id = $1 
                  AND ph.team_id = r.team_id
                  AND ph.created_at <= NOW() - INTERVAL '1 day' * r.required_hold_days
              )
            )
          ELSE true
          END
        ) as is_eligible
      FROM rewards r
      JOIN teams t ON r.team_id = t.team_id
      WHERE 1=1
    `;
    
    const queryParams = [userId];
    
    // Add filters
    if (teamId) {
      queryParams.push(teamId);
      query += ` AND r.team_id = $${queryParams.length}`;
    }
    
    if (type !== 'all') {
      queryParams.push(type);
      query += ` AND r.reward_type = $${queryParams.length}`;
    }
    
    if (status === 'active') {
      query += ` AND r.is_active = true AND r.start_date <= NOW() AND (r.end_date IS NULL OR r.end_date >= NOW()) AND r.remaining > 0`;
    } else if (status === 'upcoming') {
      query += ` AND r.is_active = true AND r.start_date > NOW()`;
    }
    
    // Add sorting
    query += ` ORDER BY r.start_date DESC`;
    
    // Add pagination
    queryParams.push(limit);
    queryParams.push(offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    // Execute query
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*)
      FROM rewards r
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (teamId) {
      countParams.push(teamId);
      countQuery += ` AND r.team_id = $${countParams.length}`;
    }
    
    if (type !== 'all') {
      countParams.push(type);
      countQuery += ` AND r.reward_type = $${countParams.length}`;
    }
    
    if (status === 'active') {
      countQuery += ` AND r.is_active = true AND r.start_date <= NOW() AND (r.end_date IS NULL OR r.end_date >= NOW()) AND r.remaining > 0`;
    } else if (status === 'upcoming') {
      countQuery += ` AND r.is_active = true AND r.start_date > NOW()`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      rewards: result.rows.map(reward => ({
        rewardId: reward.reward_id,
        name: reward.name,
        description: reward.description,
        rewardType: reward.reward_type,
        valueAmount: parseFloat(reward.value_amount),
        imageUrl: reward.image_url,
        team: {
          teamId: reward.team_id,
          name: reward.team_name,
          logoUrl: reward.team_logo_url
        },
        requiredShares: parseFloat(reward.required_shares || 0),
        requiredHoldDays: parseInt(reward.required_hold_days || 0),
        startDate: reward.start_date,
        endDate: reward.end_date,
        remaining: parseInt(reward.remaining),
        isActive: reward.is_active,
        isEligible: reward.is_eligible,
        alreadyRedeemed: reward.already_redeemed
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching rewards'
    });
  }
});

app.post('/rewards/:rewardId/redeem', async (req, res) => {
  const userId = getUserId(req);
  const { rewardId } = req.params;
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get reward details
      const rewardQuery = `
        SELECT r.*, t.name as team_name
        FROM rewards r
        JOIN teams t ON r.team_id = t.team_id
        WHERE r.reward_id = $1
      `;
      
      const rewardResult = await client.query(rewardQuery, [rewardId]);
      
      if (rewardResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          code: 'REWARD_NOT_FOUND',
          message: 'Reward not found'
        });
      }
      
      const reward = rewardResult.rows[0];
      
      // Check if reward is active and available
      if (!reward.is_active) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          code: 'REWARD_INACTIVE',
          message: 'This reward is not currently active'
        });
      }
      
      if (reward.start_date > new Date()) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          code: 'REWARD_NOT_STARTED',
          message: 'This reward is not yet available'
        });
      }
      
      if (reward.end_date && reward.end_date < new Date()) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          code: 'REWARD_EXPIRED',
          message: 'This reward has expired'
        });
      }
      
      if (reward.remaining <= 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          code: 'REWARD_OUT_OF_STOCK',
          message: 'This reward is no longer available'
        });
      }
      
      // Check if user already redeemed this reward
      const alreadyRedeemedQuery = `
        SELECT user_reward_id
        FROM user_rewards
        WHERE user_id = $1 AND reward_id = $2
      `;
      
      const alreadyRedeemedResult = await client.query(alreadyRedeemedQuery, [userId, rewardId]);
      
      if (alreadyRedeemedResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          code: 'REWARD_ALREADY_REDEEMED',
          message: 'You have already redeemed this reward'
        });
      }
      
      // Check eligibility based on shareholding requirements
      let isEligible = true;
      
      if (reward.required_shares) {
        const sharesQuery = `
          SELECT COALESCE(SUM(ph.shares), 0) as total_shares
          FROM portfolio_holdings ph
          JOIN portfolios p ON ph.portfolio_id = p.portfolio_id
          WHERE p.user_id = $1 AND ph.team_id = $2
        `;
        
        const sharesResult = await client.query(sharesQuery, [userId, reward.team_id]);
        const totalShares = parseFloat(sharesResult.rows[0].total_shares);
        
        if (totalShares < parseFloat(reward.required_shares)) {
          isEligible = false;
        }
      }
      
      if (reward.required_hold_days) {
        const holdDaysQuery = `
          SELECT EXISTS (
            SELECT 1
            FROM portfolio_holdings ph
            JOIN portfolios p ON ph.portfolio_id = p.portfolio_id
            WHERE p.user_id = $1 
              AND ph.team_id = $2
              AND ph.created_at <= NOW() - INTERVAL '1 day' * $3
          ) as meets_hold_requirement
        `;
        
        const holdDaysResult = await client.query(holdDaysQuery, [
          userId, reward.team_id, reward.required_hold_days
        ]);
        
        if (!holdDaysResult.rows[0].meets_hold_requirement) {
          isEligible = false;
        }
      }
      
      if (!isEligible) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          code: 'NOT_ELIGIBLE',
          message: 'You do not meet the requirements for this reward'
        });
      }
      
      // Create redemption code
      const redemptionCode = `${reward.team_name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Calculate expiry (30 days from now, or reward end date if sooner)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      let expiresAt = thirtyDaysFromNow;
      if (reward.end_date && reward.end_date < thirtyDaysFromNow) {
        expiresAt = reward.end_date;
      }
      
      // Create user reward record
      const userRewardId = uuidv4();
      const userRewardQuery = `
        INSERT INTO user_rewards (
          user_reward_id, user_id, reward_id, status, redemption_code,
          redeemed_at, expires_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())
        RETURNING user_reward_id, redemption_code, expires_at
      `;
      
      const userRewardResult = await client.query(userRewardQuery, [
        userRewardId, userId, rewardId, 'redeemed', redemptionCode, expiresAt
      ]);
      
      // Update reward remaining count
      await client.query(
        'UPDATE rewards SET remaining = remaining - 1, updated_at = NOW() WHERE reward_id = $1',
        [rewardId]
      );
      
      // Record activity
      const activityId = uuidv4();
      await client.query(
        `INSERT INTO user_activities (
           activity_id, user_id, activity_type, reference_id, metadata, created_at
         )
         VALUES ($1, $2, 'reward_redemption', $3, $4, NOW())`,
        [activityId, userId, userRewardId, JSON.stringify({ rewardId, rewardName: reward.name })]
      );
      
      await client.query('COMMIT');
      
      const userReward = userRewardResult.rows[0];
      
      res.status(200).json({
        userRewardId: userReward.user_reward_id,
        redemptionCode: userReward.redemption_code,
        redeemInstructions: reward.description,
        expiresAt: userReward.expires_at,
        message: `You have successfully redeemed: ${reward.name}`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while redeeming the reward'
    });
  }
});

app.get('/rewards/redeemed', async (req, res) => {
  const userId = getUserId(req);
  const { status = 'active', page = 1, limit = 20 } = req.query;
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  try {
    const offset = (page - 1) * limit;
    
    // Build query
    let query = `
      SELECT ur.*, r.name as reward_name, r.description as reward_description, 
             r.reward_type, r.value_amount, r.image_url,
             t.team_id, t.name as team_name, t.logo_url as team_logo
      FROM user_rewards ur
      JOIN rewards r ON ur.reward_id = r.reward_id
      JOIN teams t ON r.team_id = t.team_id
      WHERE ur.user_id = $1
    `;
    
    const queryParams = [userId];
    
    // Add status filter
    if (status !== 'all') {
      if (status === 'active') {
        query += ` AND ur.status = 'redeemed' AND ur.expires_at > NOW()`;
      } else if (status === 'expired') {
        query += ` AND (ur.status = 'expired' OR (ur.status = 'redeemed' AND ur.expires_at <= NOW()))`;
      }
    }
    
    // Add sorting and pagination
    query += ` ORDER BY ur.redeemed_at DESC LIMIT $2 OFFSET $3`;
    queryParams.push(limit);
    queryParams.push(offset);
    
    // Execute query
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*)
      FROM user_rewards ur
      WHERE ur.user_id = $1
    `;
    
    if (status !== 'all') {
      if (status === 'active') {
        countQuery += ` AND ur.status = 'redeemed' AND ur.expires_at > NOW()`;
      } else if (status === 'expired') {
        countQuery += ` AND (ur.status = 'expired' OR (ur.status = 'redeemed' AND ur.expires_at <= NOW()))`;
      }
    }
    
    const countResult = await pool.query(countQuery, [userId]);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      redeemedRewards: result.rows.map(row => ({
        userRewardId: row.user_reward_id,
        reward: {
          rewardId: row.reward_id,
          name: row.reward_name,
          description: row.reward_description,
          rewardType: row.reward_type,
          valueAmount: parseFloat(row.value_amount),
          imageUrl: row.image_url,
          team: {
            teamId: row.team_id,
            teamName: row.team_name,
            logoUrl: row.team_logo
          }
        },
        status: row.expires_at <= new Date() ? 'expired' : row.status,
        redemptionCode: row.redemption_code,
        redeemedAt: row.redeemed_at,
        expiresAt: row.expires_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching redeemed rewards:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching redeemed rewards'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Rewards Service running on port ${PORT}`);
});

module.exports = app;