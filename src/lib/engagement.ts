import { getDb } from './db.js';
import { getAiClient } from './gemini.js';
import { appEvents } from './events.js';

let intervalId: NodeJS.Timeout | null = null;
let isPolling = false;

// Mock function to simulate fetching comments from Instagram/YouTube
async function fetchRecentComments(postUrl: string) {
  // In production, this would call Instagram Graph API or YouTube Data API.
  // For now, we randomly generate a fake comment 30% of the time.
  await new Promise(r => setTimeout(r, 500));
  
  if (Math.random() < 0.3) {
    const fakeComments = [
      "Is this available in other colors?",
      "How long did shipping take?",
      "I love this so much!! 😍",
      "Does this work for international voltage?",
      "Can I get a discount code?"
    ];
    return [
      { id: Math.floor(Math.random() * 100000).toString(), text: fakeComments[Math.floor(Math.random() * fakeComments.length)], username: "user_" + Math.floor(Math.random() * 900) }
    ];
  }
  return [];
}

export async function runEngagementPoll() {
  if (isPolling) return;
  isPolling = true;

  try {
    const db = await getDb();
    
    // Get recent published posts
    const recentPosts = await db.all("SELECT * FROM scheduled_posts WHERE status = 'published' ORDER BY scheduled_for DESC LIMIT 10");
    
    if (!recentPosts || recentPosts.length === 0) {
      isPolling = false;
      return;
    }

    let repliedCount = 0;

    for (const post of recentPosts) {
      const comments = await fetchRecentComments(post.product_link);
      
      for (const comment of comments) {
        console.log(`[Engagement Bot] New comment detected on post ${post.id} from ${comment.username}: "${comment.text}"`);
        
        const prompt = `Act as an expert affiliate marketing assistant for the US market. A user commented: "${comment.text}" on your promotional post. Write a short, highly engaging, helpful, and natural reply in English. Limit your reply to one sentence. Do not use hashtags. Respond ONLY with a JSON object containing a "reply" property. Example: {"reply": "Your text here"}`;
        
        try {
          const ai = await getAiClient();
          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-low",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          
          const parsed = JSON.parse(response.text);
          const replyText = parsed.reply || response.text;
          
          console.log(`[Engagement Bot] Replied to ${comment.username}: "${replyText}"`);
          
          await db.run(
            "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
            ["Auto-Reply", `Replied to ${comment.username}: ${replyText}`, "Success"]
          );
          
          repliedCount++;
        } catch (e) {
          console.error("[Engagement Bot] Gemini reply generation failed:", e);
        }
      }
    }
    
    if (repliedCount > 0) {
      appEvents.emit('notification', { type: 'success', message: `Engagement Bot automatically replied to ${repliedCount} new comments!` });
    }

  } catch (error) {
    console.error("[Engagement Bot] Error in polling run:", error);
  } finally {
    isPolling = false;
  }
}

export function initEngagementBot() {
  if (intervalId) return;
  // Poll every 3 minutes
  intervalId = setInterval(runEngagementPoll, 180000);
  console.log('[Engagement Bot] Auto-Engagement listening initialized.');
}
