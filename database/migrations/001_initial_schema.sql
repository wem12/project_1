-- Community and Social Features
CREATE TABLE discussions (
  discussion_id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(team_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE discussion_comments (
  comment_id UUID PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES discussions(discussion_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE user_follows (
  follow_id UUID PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(user_id),
  followed_id UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP NOT NULL,
  UNIQUE(follower_id, followed_id)
);

CREATE TABLE achievements (
  achievement_id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  icon_url VARCHAR(255),
  requirement JSONB NOT NULL,
  reward_type VARCHAR(50),
  reward_amount DECIMAL(12,2),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE user_achievements (
  user_achievement_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  achievement_id UUID NOT NULL REFERENCES achievements(achievement_id),
  progress DECIMAL(12,2),
  earned_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, achievement_id)
);
