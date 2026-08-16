import { getDb } from './db.js';
import { appEvents } from './events.js';

let intervalId: NodeJS.Timeout | null = null;
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const db = await getDb();
    const now = new Date().toISOString();
    
    // Find pending posts that are due to be published
    const posts = await db.all(
      "SELECT * FROM scheduled_posts WHERE status = 'pending' AND scheduled_for <= ?",
      [now]
    );

    for (const post of posts) {
      console.log(`[Queue] Processing scheduled post ${post.id} for ${post.platform}`);
      
      // Mark as processing
      await db.run("UPDATE scheduled_posts SET status = 'processing' WHERE id = ?", [post.id]);
      
      try {
        const { getValidToken } = await import('./oauth.js');
        const token = await getValidToken(post.user_id, post.platform);
        
        console.log(`[Queue] Retrieved OAuth token for ${post.platform}: ${token.substring(0, 10)}...`);
        // Simulate actual publishing
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Mark as published
        await db.run("UPDATE scheduled_posts SET status = 'published' WHERE id = ?", [post.id]);
        
        await db.run(
          "INSERT INTO execution_logs (user_id, action, details, status) VALUES (?, ?, ?, ?)",
          [post.user_id, "Scheduled Publish", `Post ID: ${post.id}, Platform: ${post.platform}`, "Success"]
        );
        
        console.log(`[Queue] Post ${post.id} published successfully.`);
        appEvents.emit('notification', { type: 'success', message: `Post successfully published on ${post.platform}!` });
      } catch (err: any) {
        console.error(`[Queue] Post ${post.id} failed:`, err.message);
        await db.run("UPDATE scheduled_posts SET status = 'failed' WHERE id = ?", [post.id]);
        appEvents.emit('notification', { type: 'error', message: `Failed to publish to ${post.platform}: ${err.message}` });
      }
    }
  } catch (err) {
    console.error("[Queue] Error during queue processing:", err);
  } finally {
    isProcessing = false;
  }
}

export function initQueue() {
  if (intervalId) return;
  // Check every 10 seconds
  intervalId = setInterval(processQueue, 10000);
  console.log('[Queue] Local SQLite-based background queue initialized.');
}

export function stopQueue() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}
