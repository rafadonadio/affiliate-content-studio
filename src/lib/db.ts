import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'database.sqlite'),
      driver: sqlite3.Database
    });

    // Initialize schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scheduled_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_link TEXT,
        caption TEXT,
        image_url TEXT,
        platform TEXT,
        scheduled_for DATETIME,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS oauth_credentials (
        platform TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_configs (
        platform TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        client_secret TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        platform TEXT,
        likes INTEGER,
        clicks INTEGER,
        comments INTEGER,
        date DATE,
        category TEXT
      );

      CREATE TABLE IF NOT EXISTS short_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        clicks INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed mock data for analytics if empty
    const count = await db.get("SELECT COUNT(*) as count FROM analytics");
    if (count.count === 0) {
      const mockData = [
        { platform: 'instagram', likes: 120, clicks: 45, comments: 12, date: '2026-08-01', category: 'Tech' },
        { platform: 'pinterest', likes: 85, clicks: 60, comments: 4, date: '2026-08-02', category: 'Home' },
        { platform: 'youtube', likes: 300, clicks: 150, comments: 40, date: '2026-08-03', category: 'Tech' },
        { platform: 'instagram', likes: 150, clicks: 55, comments: 18, date: '2026-08-05', category: 'Fashion' },
        { platform: 'pinterest', likes: 110, clicks: 80, comments: 8, date: '2026-08-07', category: 'Home' },
        { platform: 'youtube', likes: 450, clicks: 220, comments: 65, date: '2026-08-10', category: 'Tech' },
        { platform: 'instagram', likes: 180, clicks: 70, comments: 25, date: '2026-08-12', category: 'Tech' }
      ];
      
      const stmt = await db.prepare("INSERT INTO analytics (post_id, platform, likes, clicks, comments, date, category) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (let i = 0; i < mockData.length; i++) {
        const item = mockData[i];
        await stmt.run([i + 1, item.platform, item.likes, item.clicks, item.comments, item.date, item.category]);
      }
      await stmt.finalize();
    }
  }
  return db;
}
