import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: mysql.Pool | null = null;

// Helper to handle SQLite-like parameter replacement ? to ? (MySQL uses ? too)
// However, MySQL uses ? for positional, but returning results is slightly different
class DBWrapper {
  private pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  // Equivalente a sqlite db.run(sql, params)
  async run(sql: string, params: any[] = []): Promise<{ lastID?: number, changes?: number }> {
    // Basic conversion for SQLite's INSERT OR REPLACE to MySQL's ON DUPLICATE KEY UPDATE
    if (sql.includes('INSERT OR REPLACE INTO')) {
       // Since full regex conversion of SQLite INSERT OR REPLACE is complex, 
       // this wrapper expects developers to write standard MySQL ON DUPLICATE KEY 
       // but logs a warning if SQLite syntax is used.
       if (!sql.includes('ON DUPLICATE KEY')) {
         console.warn('[DB] Warning: SQLite INSERT OR REPLACE used. This may fail in MySQL.');
       }
    }
    const [result] = await this.pool.execute(sql, params) as [mysql.ResultSetHeader, any];
    return {
      lastID: result.insertId,
      changes: result.affectedRows
    };
  }

  // Equivalente a sqlite db.all(sql, params)
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T[];
  }

  // Equivalente a sqlite db.get(sql, params)
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const [rows] = await this.pool.execute(sql, params);
    const result = rows as T[];
    return result.length > 0 ? result[0] : undefined;
  }
}

export async function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'afs_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const dbWrapper = new DBWrapper(pool);

    // Initialize schema using MySQL Dialect
    await dbWrapper.run(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        assistant_name VARCHAR(255) DEFAULT 'Assistant',
        assistant_avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbWrapper.run(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        status VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbWrapper.run(`
      CREATE TABLE IF NOT EXISTS scheduled_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_link TEXT,
        caption TEXT,
        image_url TEXT,
        platform VARCHAR(50),
        scheduled_for DATETIME,
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbWrapper.run(`
      CREATE TABLE IF NOT EXISTS oauth_credentials (
        platform VARCHAR(50) PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbWrapper.run(`
      CREATE TABLE IF NOT EXISTS app_configs (
        platform VARCHAR(50) PRIMARY KEY,
        client_id VARCHAR(255) NOT NULL,
        client_secret VARCHAR(255) NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await dbWrapper.run(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT,
        platform VARCHAR(50),
        likes INT,
        clicks INT,
        comments INT,
        date DATE,
        category VARCHAR(100)
      )
    `);

    await dbWrapper.run(`
      CREATE TABLE IF NOT EXISTS short_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        short_code VARCHAR(255) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        clicks INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbWrapper.run(`
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
      )
    `);

    // Seed mock data for analytics if empty
    const countRow = await dbWrapper.get<{count: number}>("SELECT COUNT(*) as count FROM analytics");
    if (countRow && countRow.count === 0) {
      const mockData = [
        { platform: 'instagram', likes: 120, clicks: 45, comments: 12, date: '2026-08-01', category: 'Tech' },
        { platform: 'pinterest', likes: 85, clicks: 60, comments: 4, date: '2026-08-02', category: 'Home' },
        { platform: 'youtube', likes: 300, clicks: 150, comments: 40, date: '2026-08-03', category: 'Tech' },
        { platform: 'instagram', likes: 150, clicks: 55, comments: 18, date: '2026-08-05', category: 'Fashion' },
        { platform: 'pinterest', likes: 110, clicks: 80, comments: 8, date: '2026-08-07', category: 'Home' },
        { platform: 'youtube', likes: 450, clicks: 220, comments: 65, date: '2026-08-10', category: 'Tech' },
        { platform: 'instagram', likes: 180, clicks: 70, comments: 25, date: '2026-08-12', category: 'Tech' }
      ];
      
      for (let i = 0; i < mockData.length; i++) {
        const item = mockData[i];
        await dbWrapper.run(
          "INSERT INTO analytics (post_id, platform, likes, clicks, comments, date, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [i + 1, item.platform, item.likes, item.clicks, item.comments, item.date, item.category]
        );
      }
    }
    
    return dbWrapper;
  }
  
  return new DBWrapper(pool);
}
