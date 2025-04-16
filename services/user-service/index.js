// services/user-service/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool(config.database);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Routes
app.post('/auth/register', async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  
  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        code: 'EMAIL_EXISTS',
        message: 'This email is already registered'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const userId = uuidv4();
    const newUser = await pool.query(
      `INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone_number, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING user_id, email, first_name, last_name, is_verified`,
      [userId, email, hashedPassword, firstName, lastName, phone]
    );
    
    // Create user profile
    const profileId = uuidv4();
    await pool.query(
      `INSERT INTO user_profiles (profile_id, user_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [profileId, userId]
    );
    
    // Create empty portfolio
    const portfolioId = uuidv4();
    await pool.query(
      `INSERT INTO portfolios (portfolio_id, user_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [portfolioId, userId]
    );
    
    // Todo: Send verification email
    
    res.status(201).json({
      userId: newUser.rows[0].user_id,
      email: newUser.rows[0].email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred during registration'
    });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      config.refreshTokenSecret,
      { expiresIn: '7d' }
    );
    
    // Update last login timestamp
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );
    
    res.status(200).json({
      token,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred during login'
    });
  }
});

// Add other routes from your API spec...

// Start server
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

module.exports = app;