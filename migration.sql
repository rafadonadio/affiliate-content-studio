-- MIGRATION SCRIPT: Multi-Tenant Architecture & TikTok Preparation
-- IMPORTANT: Before running this script in your Hostinger database, ensure you have backed up your data.
-- Since this script modifies primary keys and adds foreign keys, it assumes that existing rows 
-- will either be truncated or assigned a valid user_id.

-- 1. Modify execution_logs
ALTER TABLE execution_logs ADD COLUMN user_id VARCHAR(255) AFTER id;
ALTER TABLE execution_logs ADD CONSTRAINT fk_execution_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. Modify scheduled_posts
ALTER TABLE scheduled_posts ADD COLUMN user_id VARCHAR(255) AFTER id;
ALTER TABLE scheduled_posts ADD CONSTRAINT fk_scheduled_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Modify oauth_credentials
-- First, drop the existing primary key (which was just 'platform')
ALTER TABLE oauth_credentials DROP PRIMARY KEY;
ALTER TABLE oauth_credentials ADD COLUMN user_id VARCHAR(255) FIRST;
ALTER TABLE oauth_credentials ADD CONSTRAINT fk_oauth_credentials_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- Add the new composite primary key
ALTER TABLE oauth_credentials ADD PRIMARY KEY (user_id, platform);

-- 4. Modify app_configs
ALTER TABLE app_configs DROP PRIMARY KEY;
ALTER TABLE app_configs ADD COLUMN user_id VARCHAR(255) FIRST;
ALTER TABLE app_configs ADD CONSTRAINT fk_app_configs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE app_configs ADD PRIMARY KEY (user_id, platform);

-- 5. Modify analytics
ALTER TABLE analytics ADD COLUMN user_id VARCHAR(255) AFTER id;
ALTER TABLE analytics ADD CONSTRAINT fk_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. Modify short_links
ALTER TABLE short_links ADD COLUMN user_id VARCHAR(255) AFTER id;
ALTER TABLE short_links ADD CONSTRAINT fk_short_links_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Platform Credentials (if not created yet, create it)
CREATE TABLE IF NOT EXISTS platform_credentials (
  user_id VARCHAR(255),
  platform VARCHAR(50),
  is_connected BOOLEAN,
  PRIMARY KEY (user_id, platform),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NOTE ON TIKTOK:
-- El módulo de TikTok utilizará las tablas existentes de 'app_configs' y 'oauth_credentials' 
-- guardando la información bajo la columna platform = 'tiktok'. No se requieren tablas adicionales
-- exclusivas para TikTok gracias a esta arquitectura modular.
