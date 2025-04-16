-- Users and Authentication
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE user_profiles (
  profile_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  avatar_url VARCHAR(255),
  bio TEXT,
  location VARCHAR(100),
  preferences JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Teams and Leagues
CREATE TABLE leagues (
  league_id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  logo_url VARCHAR(255),
  country VARCHAR(100),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE teams (
  team_id UUID PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES leagues(league_id),
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  logo_url VARCHAR(255),
  description TEXT,
  founding_year INTEGER,
  current_share_price DECIMAL(12,4) NOT NULL,
  market_cap DECIMAL(16,2) NOT NULL,
  dividend_yield DECIMAL(5,2),
  trading_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Portfolio and Trading
CREATE TABLE portfolios (
  portfolio_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  cash_balance DECIMAL(12,2) DEFAULT 0.00,
  total_value DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE portfolio_holdings (
  holding_id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(team_id),
  shares DECIMAL(12,4) NOT NULL,
  average_purchase_price DECIMAL(12,4) NOT NULL,
  current_value DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(portfolio_id, team_id)
);

CREATE TABLE orders (
  order_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  team_id UUID NOT NULL REFERENCES teams(team_id),
  order_type VARCHAR(20) NOT NULL,
  action VARCHAR(10) NOT NULL,
  shares DECIMAL(12,4) NOT NULL,
  price_per_share DECIMAL(12,4),
  total_amount DECIMAL(12,2),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Rewards System
CREATE TABLE rewards (
  reward_id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(team_id),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reward_type VARCHAR(50) NOT NULL,
  required_shares DECIMAL(12,4),
  required_hold_days INTEGER,
  quantity INTEGER,
  remaining INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE user_rewards (
  user_reward_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  reward_id UUID NOT NULL REFERENCES rewards(reward_id),
  status VARCHAR(20) NOT NULL,
  redemption_code VARCHAR(50),
  redeemed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Activity and Analytics
CREATE TABLE user_activities (
  activity_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  activity_type VARCHAR(50) NOT NULL,
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE team_news (
  news_id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(team_id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR(100),
  image_url VARCHAR(255),
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE price_history (
  history_id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(team_id),
  date DATE NOT NULL,
  open DECIMAL(12,4) NOT NULL,
  high DECIMAL(12,4) NOT NULL,
  low DECIMAL(12,4) NOT NULL,
  close DECIMAL(12,4) NOT NULL,
  volume INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE portfolio_daily_values (
  value_id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id),
  trans_date DATE NOT NULL,
  portfolio_value DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL
);
