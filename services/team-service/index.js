// services/team-service/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3002;

// Database connection
const pool = new Pool(config.database);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Routes
app.get('/teams', async (req, res) => {
  const { 
    league, 
    status = 'active', 
    page = 1, 
    limit = 20,
    sortBy = 'name',
    sortDirection = 'asc'
  } = req.query;
  
  try {
    const offset = (page - 1) * limit;
    
    // Build query
    let query = `
      SELECT t.team_id, t.name, t.city, t.abbreviation, t.logo_url,
             l.league_id, l.name as league_name, l.abbreviation as league_abbreviation,
             t.current_share_price, t.market_cap, t.dividend_yield, t.trading_status
      FROM teams t
      JOIN leagues l ON t.league_id = l.league_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters
    if (league) {
      queryParams.push(league);
      query += ` AND l.league_id = $${queryParams.length}`;
    }
    
    if (status !== 'all') {
      queryParams.push(status);
      query += ` AND t.trading_status = $${queryParams.length}`;
    }
    
    // Add sorting
    query += ` ORDER BY ${
      sortBy === 'name' ? 't.name' :
      sortBy === 'price' ? 't.current_share_price' :
      sortBy === 'marketCap' ? 't.market_cap' :
      sortBy === 'dividendYield' ? 't.dividend_yield' :
      sortBy === 'priceChange' ? 't.current_share_price' : 't.name'
    } ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
    
    // Add pagination
    queryParams.push(limit);
    queryParams.push(offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    // Execute query
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM teams t
      JOIN leagues l ON t.league_id = l.league_id
      WHERE 1=1
      ${league ? ' AND l.league_id = $1' : ''}
      ${status !== 'all' ? ` AND t.trading_status = $${league ? 2 : 1}` : ''}
    `;
    
    const countParams = [];
    if (league) countParams.push(league);
    if (status !== 'all') countParams.push(status);
    
    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      teams: result.rows.map(team => ({
        teamId: team.team_id,
        name: team.name,
        city: team.city,
        abbreviation: team.abbreviation,
        logoUrl: team.logo_url,
        league: {
          leagueId: team.league_id,
          name: team.league_name,
          abbreviation: team.league_abbreviation
        },
        currentSharePrice: parseFloat(team.current_share_price),
        marketCap: parseFloat(team.market_cap),
        dividendYield: parseFloat(team.dividend_yield),
        tradingStatus: team.trading_status
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching teams'
    });
  }
});

app.get('/teams/:teamId', async (req, res) => {
  const { teamId } = req.params;
  
  try {
    // Get team details
    const teamQuery = `
      SELECT t.*, l.name as league_name, l.abbreviation as league_abbreviation
      FROM teams t
      JOIN leagues l ON t.league_id = l.league_id
      WHERE t.team_id = $1
    `;
    
    const teamResult = await pool.query(teamQuery, [teamId]);
    
    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        code: 'TEAM_NOT_FOUND',
        message: 'Team not found'
      });
    }
    
    const team = teamResult.rows[0];
    
    // Get team performance
    const performanceQuery = `
      SELECT *
      FROM team_performance
      WHERE team_id = $1
      ORDER BY season DESC
      LIMIT 1
    `;
    
    const performanceResult = await pool.query(performanceQuery, [teamId]);
    const performance = performanceResult.rows[0] || null;
    
    res.status(200).json({
      teamId: team.team_id,
      name: team.name,
      city: team.city,
      abbreviation: team.abbreviation,
      logoUrl: team.logo_url,
      primaryColor: team.primary_color,
      secondaryColor: team.secondary_color,
      stadiumName: team.stadium_name,
      foundedYear: team.founded_year,
      description: team.description,
      websiteUrl: team.website_url,
      league: {
        leagueId: team.league_id,
        name: team.league_name,
        abbreviation: team.league_abbreviation
      },
      financials: {
        totalShares: parseInt(team.total_shares),
        availableShares: parseInt(team.available_shares),
        initialSharePrice: parseFloat(team.initial_share_price),
        currentSharePrice: parseFloat(team.current_share_price),
        marketCap: parseFloat(team.market_cap),
        dividendYield: parseFloat(team.dividend_yield),
        dayRange: {
          low: parseFloat(team.current_share_price) * 0.98, // Example calculation
          high: parseFloat(team.current_share_price) * 1.02
        },
        yearRange: {
          low: parseFloat(team.current_share_price) * 0.8, // Example calculation
          high: parseFloat(team.current_share_price) * 1.2
        }
      },
      performance: performance ? {
        currentSeason: performance.season,
        wins: performance.wins,
        losses: performance.losses,
        ties: performance.ties,
        pointsFor: performance.points_for,
        pointsAgainst: performance.points_against,
        playoffAppearance: performance.playoff_appearance,
        championshipWin: performance.championship_win
      } : null,
      tradingStatus: team.trading_status
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching team details'
    });
  }
});

app.get('/teams/:teamId/price-history', async (req, res) => {
  const { teamId } = req.params;
  const { period = '1m', interval = '1d' } = req.query;
  
  try {
    // Validate team exists
    const teamCheck = await pool.query(
      'SELECT team_id FROM teams WHERE team_id = $1',
      [teamId]
    );
    
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({
        code: 'TEAM_NOT_FOUND',
        message: 'Team not found'
      });
    }
    
    // Calculate date range based on period
    let startDate;
    const now = new Date();
    
    switch (period) {
      case '1d':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case '1w':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '1m':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3m':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6m':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }
    
    // Determine query interval
    let intervalClause;
    switch (interval) {
      case '1m':
        intervalClause = "date_trunc('minute', timestamp)";
        break;
      case '5m':
        intervalClause = "date_trunc('hour', timestamp) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / 5)";
        break;
      case '15m':
        intervalClause = "date_trunc('hour', timestamp) + INTERVAL '15 min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / 15)";
        break;
      case '30m':
        intervalClause = "date_trunc('hour', timestamp) + INTERVAL '30 min' * FLOOR(EXTRACT(MINUTE FROM timestamp) / 30)";
        break;
      case '1h':
        intervalClause = "date_trunc('hour', timestamp)";
        break;
      case '4h':
        intervalClause = "date_trunc('day', timestamp) + INTERVAL '4 hour' * FLOOR(EXTRACT(HOUR FROM timestamp) / 4)";
        break;
      case '1d':
        intervalClause = "date_trunc('day', timestamp)";
        break;
      case '1w':
        intervalClause = "date_trunc('week', timestamp)";
        break;
      default:
        intervalClause = "date_trunc('day', timestamp)";
    }
    
    // Get price history
    const query = `
      SELECT 
        ${intervalClause} as timestamp,
        AVG(price) as price,
        SUM(volume) as volume,
        MIN(price) as low,
        MAX(price) as high,
        FIRST_VALUE(price) OVER (PARTITION BY ${intervalClause} ORDER BY timestamp) as open,
        LAST_VALUE(price) OVER (PARTITION BY ${intervalClause} ORDER BY timestamp) as close
      FROM share_price_history
      WHERE team_id = $1 AND timestamp >= $2
      GROUP BY ${intervalClause}
      ORDER BY timestamp
    `;
    
    const result = await pool.query(query, [teamId, startDate]);
    
    res.status(200).json({
      teamId,
      period,
      interval,
      data: result.rows.map(row => ({
        timestamp: row.timestamp,
        price: parseFloat(row.price),
        volume: parseInt(row.volume),
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close)
      }))
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching price history'
    });
  }
});

app.get('/teams/:teamId/news', async (req, res) => {
  const { teamId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  try {
    // Validate team exists
    const teamCheck = await pool.query(
      'SELECT team_id FROM teams WHERE team_id = $1',
      [teamId]
    );
    
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({
        code: 'TEAM_NOT_FOUND',
        message: 'Team not found'
      });
    }
    
    const offset = (page - 1) * limit;
    
    // Get news articles
    const query = `
      SELECT *
      FROM team_news
      WHERE team_id = $1
      ORDER BY published_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [teamId, limit, offset]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM team_news
      WHERE team_id = $1
    `;
    
    const countResult = await pool.query(countQuery, [teamId]);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.status(200).json({
      teamId,
      news: result.rows.map(news => ({
        newsId: news.news_id,
        title: news.title,
        content: news.content,
        source: news.source,
        imageUrl: news.image_url,
        publishedAt: news.published_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching team news:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching team news'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Team Service running on port ${PORT}`);
});

module.exports = app;