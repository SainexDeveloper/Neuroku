-- ╔══════════════════════════════════════════════════════════════════╗
-- ║           NEUROKU — MySQL Database Schema v1.0                  ║
-- ║   Run this file once to initialize the entire database.         ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE DATABASE IF NOT EXISTS neuroku
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE neuroku;

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  username      VARCHAR(32)      NOT NULL,
  email         VARCHAR(191)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,              -- bcrypt
  avatar_color  VARCHAR(7)       NOT NULL DEFAULT '#7c6af7', -- hex
  avatar_initials VARCHAR(2)     NOT NULL DEFAULT 'NN',
  bio           VARCHAR(160)     NOT NULL DEFAULT '',
  country       VARCHAR(64)      NOT NULL DEFAULT '',
  city          VARCHAR(64)      NOT NULL DEFAULT '',
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_verified   TINYINT(1)       NOT NULL DEFAULT 0,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_email    (email),
  UNIQUE KEY uq_username (username),
  KEY idx_created (created_at)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- REFRESH TOKENS  (JWT refresh token rotation)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  VARCHAR(64)  NOT NULL,   -- SHA-256 of the raw token
  expires_at  DATETIME     NOT NULL,
  revoked     TINYINT(1)   NOT NULL DEFAULT 0,
  ip          VARCHAR(45)  NOT NULL DEFAULT '',
  user_agent  VARCHAR(255) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_token (token_hash),
  KEY idx_user (user_id),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- DAILY CHALLENGES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_challenges (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  challenge_date DATE         NOT NULL,
  difficulty     ENUM('easy','medium','hard','expert') NOT NULL DEFAULT 'medium',
  puzzle_data    JSON         NOT NULL,    -- [[row0],[row1],...] 9x9 zeros=empty
  solution_data  JSON         NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_date (challenge_date),
  KEY idx_date (challenge_date)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- PUZZLES  (free-play games; daily games also reference this)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS puzzles (
  id           CHAR(36)     NOT NULL,   -- UUID v4
  difficulty   ENUM('easy','medium','hard','expert') NOT NULL,
  puzzle_data  JSON         NOT NULL,
  solution_data JSON        NOT NULL,
  is_daily     TINYINT(1)   NOT NULL DEFAULT 0,
  daily_date   DATE                  DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_difficulty (difficulty),
  KEY idx_daily_date (daily_date)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SCORES  (one row per completed game)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED     NOT NULL,
  puzzle_id       CHAR(36)                  DEFAULT NULL,  -- NULL = guest
  daily_challenge_id INT UNSIGNED           DEFAULT NULL,
  difficulty      ENUM('easy','medium','hard','expert') NOT NULL,
  completion_time INT UNSIGNED     NOT NULL,   -- seconds
  mistakes        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  hints_used      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_daily        TINYINT(1)       NOT NULL DEFAULT 0,
  completed_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_user        (user_id),
  KEY idx_daily       (daily_challenge_id),
  KEY idx_difficulty  (difficulty),
  KEY idx_completed   (completed_at),
  KEY idx_daily_rank  (daily_challenge_id, completion_time, mistakes),
  CONSTRAINT fk_score_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_score_daily  FOREIGN KEY (daily_challenge_id) REFERENCES daily_challenges(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- USER STATS  (denormalized counters — updated after each game)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
  user_id             INT UNSIGNED NOT NULL,
  games_played        INT UNSIGNED NOT NULL DEFAULT 0,
  games_won           INT UNSIGNED NOT NULL DEFAULT 0,
  total_time          BIGINT UNSIGNED NOT NULL DEFAULT 0,   -- seconds
  best_time           INT UNSIGNED             DEFAULT NULL, -- seconds
  best_time_difficulty ENUM('easy','medium','hard','expert') DEFAULT NULL,
  total_mistakes      INT UNSIGNED NOT NULL DEFAULT 0,
  total_hints         INT UNSIGNED NOT NULL DEFAULT 0,
  -- Per-difficulty win counts
  wins_easy           INT UNSIGNED NOT NULL DEFAULT 0,
  wins_medium         INT UNSIGNED NOT NULL DEFAULT 0,
  wins_hard           INT UNSIGNED NOT NULL DEFAULT 0,
  wins_expert         INT UNSIGNED NOT NULL DEFAULT 0,
  -- Streak
  current_streak      INT UNSIGNED NOT NULL DEFAULT 0,
  longest_streak      INT UNSIGNED NOT NULL DEFAULT 0,
  last_played_date    DATE                  DEFAULT NULL,
  -- Rating (ELO-style, used for global leaderboard)
  rating              INT          NOT NULL DEFAULT 1000,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  KEY idx_rating  (rating DESC),
  KEY idx_streak  (current_streak DESC),
  CONSTRAINT fk_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- ACTIVITY CALENDAR  (one row per user per day — for heatmap/calendar)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_calendar (
  user_id      INT UNSIGNED NOT NULL,
  activity_date DATE        NOT NULL,
  games_played SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  games_won    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  best_time    INT UNSIGNED             DEFAULT NULL,
  daily_done   TINYINT(1)   NOT NULL DEFAULT 0,  -- completed daily that day

  PRIMARY KEY (user_id, activity_date),
  KEY idx_date (activity_date),
  CONSTRAINT fk_cal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          VARCHAR(32)  NOT NULL,
  title       VARCHAR(64)  NOT NULL,
  description VARCHAR(160) NOT NULL,
  icon        VARCHAR(8)   NOT NULL,
  category    VARCHAR(32)  NOT NULL DEFAULT 'general',
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,

  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id      INT UNSIGNED NOT NULL,
  achievement_id VARCHAR(32) NOT NULL,
  unlocked_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, achievement_id),
  CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ua_ach  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- RATING HISTORY  (snapshot per week for graph)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rating_history (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  rating      INT          NOT NULL,
  snapshot_date DATE       NOT NULL,

  PRIMARY KEY (id),
  KEY idx_user_date (user_id, snapshot_date),
  CONSTRAINT fk_rh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO achievements (id, title, description, icon, category, sort_order) VALUES
('first_win',      'First Victory',    'Complete your first puzzle',            '🏆', 'general',   1),
('no_mistakes',    'Flawless',         'Solve a puzzle with zero mistakes',     '💎', 'quality',   2),
('streak_3',       'On Fire',          '3-day login streak',                    '🔥', 'streak',    3),
('streak_7',       'Week Warrior',     '7-day login streak',                    '⚡', 'streak',    4),
('streak_30',      'Monthly Master',   '30-day login streak',                   '🌟', 'streak',    5),
('speed_3min',     'Speed Demon',      'Solve any puzzle in under 3 minutes',   '🚀', 'speed',     6),
('speed_2min',     'Turbo Brain',      'Solve any puzzle in under 2 minutes',   '💨', 'speed',     7),
('plays_10',       'Dedicated',        'Play 10 puzzles',                       '🧩', 'progress',  8),
('plays_50',       'Brain Athlete',    'Play 50 puzzles',                       '🧠', 'progress',  9),
('plays_100',      'Centurion',        'Play 100 puzzles',                      '💯', 'progress', 10),
('expert_win',     'Expert Mind',      'Complete an Expert puzzle',             '💀', 'difficulty',11),
('all_diff',       'Completionist',    'Win on all 4 difficulties',             '🎯', 'difficulty',12),
('daily_7',        'Daily Devotion',   'Complete 7 daily challenges',           '📅', 'daily',    13),
('daily_30',       'Daily Legend',     'Complete 30 daily challenges',          '🗓️', 'daily',    14),
('top10_daily',    'Top 10',           'Finish in the top 10 of a daily',       '🥈', 'rank',     15),
('top3_daily',     'Podium',           'Finish in the top 3 of a daily',        '🥇', 'rank',     16),
('rating_1200',    'Silver Tier',      'Reach 1200 rating',                     '🪙', 'rating',   17),
('rating_1500',    'Gold Tier',        'Reach 1500 rating',                     '🥇', 'rating',   18),
('rating_2000',    'Grandmaster',      'Reach 2000 rating',                     '👑', 'rating',   19);

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEWS (handy for API queries)
-- ─────────────────────────────────────────────────────────────────────────────

-- Global leaderboard view
CREATE OR REPLACE VIEW v_global_leaderboard AS
SELECT
  u.id,
  u.username,
  u.avatar_color,
  u.avatar_initials,
  u.country,
  s.rating,
  s.games_won,
  s.current_streak,
  s.longest_streak,
  s.best_time,
  s.best_time_difficulty,
  RANK() OVER (ORDER BY s.rating DESC, s.games_won DESC) AS `rank`
FROM users u
JOIN user_stats s ON s.user_id = u.id
WHERE u.role = 'user'
ORDER BY s.rating DESC;

-- Daily leaderboard view (today)
CREATE OR REPLACE VIEW v_daily_leaderboard AS
SELECT
  u.id          AS user_id,
  u.username,
  u.avatar_color,
  u.avatar_initials,
  sc.completion_time,
  sc.mistakes,
  sc.hints_used,
  sc.completed_at,
  dc.challenge_date,
  RANK() OVER (
    PARTITION BY sc.daily_challenge_id
    ORDER BY sc.completion_time ASC, sc.mistakes ASC
  ) AS `rank`
FROM scores sc
JOIN users u ON u.id = sc.user_id
JOIN daily_challenges dc ON dc.id = sc.daily_challenge_id
WHERE sc.is_daily = 1;