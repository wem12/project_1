-- Seed achievements
INSERT INTO achievements (achievement_id, name, description, category, difficulty, icon_url, requirement, reward_type, reward_amount, created_at, updated_at)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'First Investment', 'Make your first investment in a team', 'investment', 'beginner', '/images/achievements/first-investment.png', '{"type": "investment_count", "value": 1}', 'cash', 5.00, NOW(), NOW()),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Diversified Portfolio', 'Invest in at least 5 different teams', 'investment', 'intermediate', '/images/achievements/diversified.png', '{"type": "unique_team_count", "value": 5}', 'cash', 25.00, NOW(), NOW()),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Big Spender', 'Invest a total of $10,000', 'investment', 'advanced', '/images/achievements/big-spender.png', '{"type": "total_invested", "value": 10000}', 'cash', 100.00, NOW(), NOW()),
  ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Community Contributor', 'Create 10 discussion posts', 'social', 'intermediate', '/images/achievements/contributor.png', '{"type": "discussion_count", "value": 10}', 'badge', 0.00, NOW(), NOW()),
  ('e5f6a7b8-c9d0-1234-ef12-345678901234', 'Trading Expert', 'Complete 50 trades', 'trading', 'advanced', '/images/achievements/trading-expert.png', '{"type": "trade_count", "value": 50}', 'cash', 50.00, NOW(), NOW());
-- Seed discussions
INSERT INTO discussions (discussion_id, team_id, user_id, title, content, created_at, updated_at)
VALUES
  ('d1e2f3a4-b5c6-7890-abcd-ef1234567890', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Thoughts on the new quarterback?', 'What do you think about the team''s new quarterback? Will this affect their performance this season?', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('e2f3a4b5-c6d7-8901-bcde-f12345678901', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Share price prediction for end of season', 'Based on current performance, I think the share price will increase by at least 15% by the end of the season. What are your predictions?', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Seed discussion comments
INSERT INTO discussion_comments (comment_id, discussion_id, user_id, content, created_at, updated_at)
VALUES
  ('c1d2e3f4-a5b6-7890-abcd-ef1234567890', 'd1e2f3a4-b5c6-7890-abcd-ef1234567890', '33333333-3333-3333-3333-333333333333', 'I think he''s going to be a great addition to the team!', NOW() - INTERVAL '1 day 12 hours', NOW() - INTERVAL '1 day 12 hours'),
  ('d2e3f4a5-b6c7-8901-bcde-f12345678901', 'd1e2f3a4-b5c6-7890-abcd-ef1234567890', '44444444-4444-4444-4444-444444444444', 'Not sure yet, we need to see how he performs in the first few games.', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 6 hours'),
  ('e3f4a5b6-c7d8-9012-cdef-123456789012', 'e2f3a4b5-c6d7-8901-bcde-f12345678901', '22222222-2222-2222-2222-222222222222', 'I agree, especially if they make it to the playoffs!', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');

-- Seed user follows
INSERT INTO user_follows (follow_id, follower_id, followed_id, created_at)
VALUES
  ('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days'),
  ('a2b3c4d5-e6f7-8901-bcde-f12345678901', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '4 days'),
  ('b3c4d5e6-f7a8-9012-cdef-123456789012', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days');

-- Seed user achievements
INSERT INTO user_achievements (user_achievement_id, user_id, achievement_id, progress, earned_at, created_at, updated_at)
VALUES
  ('ua1b2c3-d4e5-6789-abcd-ef1234567890', '22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('ub2c3d4-e5f6-7890-bcde-f12345678901', '22222222-2222-2222-2222-222222222222', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 3, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
  ('uc3d4e5-f6a7-8901-cdef-123456789012', '33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');
