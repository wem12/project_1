// services/trading-service/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3003;

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
app.get('/portfolio', async (req, res) => {
  const userId = getUserId(req);
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  try {
    // Get portfolio summary
    const portfolioQuery = `
      SELECT *
      FROM portfolios
      WHERE user_id = $1
    `;
    
    const portfolioResult = await pool.query(portfolioQuery, [userId]);
    
    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({
        code: 'PORTFOLIO_NOT_FOUND',
        message: 'Portfolio not found'
      });
    }
    
    const portfolio = portfolioResult.rows[0];
    
    // Get portfolio holdings
    const holdingsQuery = `
      SELECT ph.*, t.name, t.logo_url, t.current_share_price
      FROM portfolio_holdings ph
      JOIN teams t ON ph.team_id = t.team_id
      WHERE ph.portfolio_id = $1
    `;
    
    const holdingsResult = await pool.query(holdingsQuery, [portfolio.portfolio_id]);
    
    // Calculate portfolio performance
    const dailyChangeQuery = `
      SELECT 
        SUM(CASE WHEN trans_date = CURRENT_DATE - INTERVAL '1 day' 
                 THEN portfolio_value ELSE 0 END) as yesterday_value,
        SUM(CASE WHEN trans_date = CURRENT_DATE
                 THEN portfolio_value ELSE 0 END) as today_value
      FROM portfolio_daily_values
      WHERE portfolio_id = $1 AND trans_date >= CURRENT_DATE - INTERVAL '1 day'
    `;
    
    const dailyChangeResult = await pool.query(dailyChangeQuery, [portfolio.portfolio_id]);
    const dailyChange = dailyChangeResult.rows[0];
    
    // Get historical portfolio values for chart
    const chartDataQuery = `
      SELECT trans_date as date, portfolio_value as value
      FROM portfolio_daily_values
      WHERE portfolio_id = $1
      ORDER BY trans_date
      LIMIT 30
    `;
    
    const chartDataResult = await pool.query(chartDataQuery, [portfolio.portfolio_id]);
    
    const totalValue = parseFloat(portfolio.total_value);
    const yesterdayValue = parseFloat(dailyChange.yesterday_value || 0);
    const dailyChangeAmount = yesterdayValue > 0 ? totalValue - yesterdayValue : 0;
    const dailyChangePercentage = yesterdayValue > 0 ? (dailyChangeAmount / yesterdayValue) * 100 : 0;
    
    res.status(200).json({
      portfolioId: portfolio.portfolio_id,
      totalValue: totalValue,
      cashBalance: parseFloat(portfolio.cash_balance),
      totalInvested: totalValue - parseFloat(portfolio.cash_balance),
      totalGainLoss: 0, // Calculate based on purchase history
      totalGainLossPercentage: 0, // Calculate based on purchase history
      holdings: holdingsResult.rows.map(holding => ({
        holdingId: holding.holding_id,
        team: {
          teamId: holding.team_id,
          name: holding.name,
          logoUrl: holding.logo_url
        },
        shares: parseFloat(holding.shares),
        averagePurchasePrice: parseFloat(holding.average_purchase_price),
        currentPrice: parseFloat(holding.current_share_price),
        currentValue: parseFloat(holding.current_value),
        unrealizedGainLoss: parseFloat(holding.unrealized_gain_loss),
        unrealizedGainLossPercentage: parseFloat(holding.unrealized_gain_loss_percentage)
      })),
      performance: {
        dailyChange: dailyChangeAmount,
        dailyChangePercentage: dailyChangePercentage,
        weeklyChange: 0, // Calculate from historical data
        weeklyChangePercentage: 0,
        monthlyChange: 0,
        monthlyChangePercentage: 0,
        yearlyChange: 0,
        yearlyChangePercentage: 0
      },
      chartData: chartDataResult.rows.map(point => ({
        date: point.date,
        value: parseFloat(point.value)
      }))
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching the portfolio'
    });
  }
});

app.post('/orders', async (req, res) => {
  const userId = getUserId(req);
  const { teamId, orderType, action, shares, price } = req.body;
  
  if (!userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'User ID is required'
    });
  }
  
  // Validate required fields
  if (!teamId || !orderType || !action || !shares) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Missing required fields'
    });
  }
  
  // Validate order type
  if (orderType !== 'market' && orderType !== 'limit') {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Invalid order type'
    });
  }
  
  // Validate action
  if (action !== 'buy' && action !== 'sell') {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Invalid action'
    });
  }
  
  // Validate shares
  if (shares <= 0) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Shares must be greater than 0'
    });
  }
  
  // For limit orders, price is required
  if (orderType === 'limit' && !price) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Price is required for limit orders'
    });
  }
  
  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get team price
      const teamQuery = `
        SELECT current_share_price, trading_status
        FROM teams
        WHERE team_id = $1
      `;
      
      const teamResult = await client.query(teamQuery, [teamId]);
      
      if (teamResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          code: 'TEAM_NOT_FOUND',
          message: 'Team not found'
        });
      }
      
      const team = teamResult.rows[0];
      
      // Check if team is available for trading
      if (team.trading_status !== 'active') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          code: 'TRADING_RESTRICTED',
          message: 'Trading is currently restricted for this team'
        });
      }
      
      // Get user portfolio
      const portfolioQuery = `
        SELECT portfolio_id, cash_balance
        FROM portfolios
        WHERE user_id = $1
      `;
      
      const portfolioResult = await client.query(portfolioQuery, [userId]);
      
      if (portfolioResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          code: 'PORTFOLIO_NOT_FOUND',
          message: 'Portfolio not found'
        });
      }
      
      const portfolio = portfolioResult.rows[0];
      
      // For sell orders, check if user has enough shares
      if (action === 'sell') {
        const holdingQuery = `
          SELECT shares
          FROM portfolio_holdings
          WHERE portfolio_id = $1 AND team_id = $2
        `;
        
        const holdingResult = await client.query(holdingQuery, [portfolio.portfolio_id, teamId]);
        
        if (holdingResult.rows.length === 0 || parseFloat(holdingResult.rows[0].shares) < shares) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            code: 'INSUFFICIENT_SHARES',
            message: 'Not enough shares to complete this sale'
          });
        }
      }
      
      // For buy orders with market price, check if user has enough funds
      if (action === 'buy' && orderType === 'market') {
        const estimatedTotal = parseFloat(team.current_share_price) * shares;
        
        if (parseFloat(portfolio.cash_balance) < estimatedTotal) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            code: 'INSUFFICIENT_FUNDS',
            message: 'Not enough funds to complete this purchase'
          });
        }
      }
      
      // Create order
      const orderId = uuidv4();
      const orderStatus = orderType === 'market' ? 'pending' : 'pending';
      const orderPrice = orderType === 'market' ? parseFloat(team.current_share_price) : price;
      const expiresAt = orderType === 'limit' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours for limit orders
      
      const orderQuery = `
        INSERT INTO orders (
          order_id, user_id, team_id, order_type, action, shares, price, 
          status, placed_at, expires_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, NOW(), NOW())
        RETURNING order_id, status, placed_at
      `;
      
      const orderResult = await client.query(orderQuery, [
        orderId, userId, teamId, orderType, action, shares, orderPrice, 
        orderStatus, expiresAt
      ]);
      
      const order = orderResult.rows[0];
      
      // For market orders, process immediately
      if (orderType === 'market') {
        // Process transaction logic would go here
        // For MVP, we'll simulate immediate execution
        
        const transactionId = uuidv4();
        const totalAmount = orderPrice * shares;
        const feeAmount = 0; // No fees for MVP
        
        // Create transaction record
        const transactionQuery = `
          INSERT INTO transactions (
            transaction_id, order_id, user_id, team_id, action, 
            shares, price_per_share, total_amount, fee_amount, executed_at, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING transaction_id, executed_at
        `;
        
        await client.query(transactionQuery, [
          transactionId, orderId, userId, teamId, action,
          shares, orderPrice, totalAmount, feeAmount
        ]);
        
        // Update order status
        await client.query(
          'UPDATE orders SET status = $1, executed_at = NOW(), updated_at = NOW() WHERE order_id = $2',
          ['executed', orderId]
        );
        
        // Update portfolio balance
        if (action === 'buy') {
          await client.query(
            'UPDATE portfolios SET cash_balance = cash_balance - $1, updated_at = NOW() WHERE portfolio_id = $2',
            [totalAmount, portfolio.portfolio_id]
          );
        } else {
          await client.query(
            'UPDATE portfolios SET cash_balance = cash_balance + $1, updated_at = NOW() WHERE portfolio_id = $2',
            [totalAmount, portfolio.portfolio_id]
          );
        }
        
        // Update portfolio holdings
        if (action === 'buy') {
          // Check if holding already exists
          const existingHoldingQuery = `
            SELECT holding_id, shares, average_purchase_price, current_value
            FROM portfolio_holdings
            WHERE portfolio_id = $1 AND team_id = $2
          `;
          
          const existingHoldingResult = await client.query(existingHoldingQuery, [
            portfolio.portfolio_id, teamId
          ]);
          
          if (existingHoldingResult.rows.length > 0) {
            // Update existing holding
            const holding = existingHoldingResult.rows[0];
            const totalShares = parseFloat(holding.shares) + shares;
            const newAvgPrice = (parseFloat(holding.average_purchase_price) * parseFloat(holding.shares) + totalAmount) / totalShares;
            const newValue = totalShares * orderPrice;
            
            await client.query(
              `UPDATE portfolio_holdings 
               SET shares = $1, average_purchase_price = $2, current_value = $3, 
                   updated_at = NOW()
               WHERE holding_id = $4`,
              [totalShares, newAvgPrice, newValue, holding.holding_id]
            );
          } else {
            // Create new holding
            const holdingId = uuidv4();
            await client.query(
              `INSERT INTO portfolio_holdings (
                 holding_id, portfolio_id, team_id, shares, average_purchase_price,
                 current_value, created_at, updated_at
               )
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
              [holdingId, portfolio.portfolio_id, teamId, shares, orderPrice, totalAmount]
            );
          }
        } else {
          // Handle sell logic
          const holdingQuery = `
            SELECT holding_id, shares, average_purchase_price
            FROM portfolio_holdings
            WHERE portfolio_id = $1 AND team_id = $2
          `;
          
          const holdingResult = await client.query(holdingQuery, [
            portfolio.portfolio_id, teamId
          ]);
          
          const holding = holdingResult.rows[0];
          const remainingShares = parseFloat(holding.shares) - shares;
          
          if (remainingShares > 0) {
            // Update holding with remaining shares
            const newValue = remainingShares * orderPrice;
            await client.query(
              `UPDATE portfolio_holdings 
               SET shares = $1, current_value = $2, updated_at = NOW()
               WHERE holding_id = $3`,
              [remainingShares, newValue, holding.holding_id]
            );
          } else {
            // Remove holding completely
            await client.query(
              'DELETE FROM portfolio_holdings WHERE holding_id = $1',
              [holding.holding_id]
            );
          }
        }
        
        // Update team share price (in a real system, this would be done by a separate price engine)
        // For MVP, we'll make a small random adjustment
        const priceChange = action === 'buy' ? 0.001 : -0.001; // 0.1% change
        await client.query(
          'UPDATE teams SET current_share_price = current_share_price * (1 + $1), updated_at = NOW() WHERE team_id = $2',
          [priceChange, teamId]
        );
      }
      
      await client.query('COMMIT');
      
      // Calculate estimated total
      const estimatedTotal = orderPrice * shares;
      
      res.status(201).json({
        orderId: order.order_id,
        status: order.status,
        estimatedTotal: estimatedTotal,
        message: orderType === 'market' 
          ? 'Market order executed successfully' 
          : 'Limit order placed successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching trading data'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Trading Service running on port ${PORT}`);
});

module.exports = app;