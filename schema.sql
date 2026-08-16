-- MySQL Schema for Affiliate Content Studio (AFS)
-- You can import this file directly into Hostinger via phpMyAdmin

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) DEFAULT '*OTP*',
  role VARCHAR(50) DEFAULT 'user',
  assistant_name VARCHAR(255) DEFAULT 'Assistant',
  assistant_avatar TEXT,
  otp_code VARCHAR(10),
  otp_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  product_link TEXT,
  caption TEXT,
  image_url TEXT,
  platform VARCHAR(50),
  scheduled_for DATETIME,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oauth_credentials (
  user_id VARCHAR(255),
  platform VARCHAR(50),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform_credentials (
  user_id VARCHAR(255),
  platform VARCHAR(50),
  is_connected BOOLEAN,
  PRIMARY KEY (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_configs (
  user_id VARCHAR(255),
  platform VARCHAR(50),
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  post_id INT,
  platform VARCHAR(50),
  likes INT,
  clicks INT,
  comments INT,
  date DATE,
  category VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS short_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  short_code VARCHAR(255) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'inactive',
  current_period_end DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
