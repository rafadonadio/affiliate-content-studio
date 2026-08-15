import { getDb } from './db.js';
import { getAiClient } from './gemini.js';
import { appEvents } from './events.js';

let intervalId: NodeJS.Timeout | null = null;
let isGenerating = false;

async function fetchTopAmazonProducts(category: string, count: number, affiliateTag: string) {
  console.log(`[Automation] Searching Amazon for top 1% BSR products in ${category} for tag ${affiliateTag}...`);
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1500));
  
  const mockProducts = [];
  for (let i = 0; i < count; i++) {
    const bsr = Math.floor(Math.random() * 5000) + 1; // Top 5000 BSR
    mockProducts.push({
      title: `Bestselling ${category} Product ${Math.floor(Math.random() * 1000)}`,
      link: `https://www.amazon.com/dp/B00${Math.floor(Math.random() * 90000)}?tag=${affiliateTag}`,
      imageUrl: `https://picsum.photos/seed/${Math.random()}/600/600`,
      price: `$${(Math.random() * 100).toFixed(2)}`,
      bsr: bsr
    });
  }
  return mockProducts;
}

export async function runDailyAutomation() {
  if (isGenerating) return;
  isGenerating = true;

  try {
    const db = await getDb();
    
    // Check if we already generated today
    const today = new Date().toISOString().split('T')[0];
    const generatedToday = await db.get("SELECT COUNT(*) as count FROM scheduled_posts WHERE status = 'draft' AND date(created_at) = ?", [today]);
    
    // Get target from settings
    const config = await db.get("SELECT * FROM app_configs WHERE platform = 'amazon'");
    const affiliateTag = config?.client_id || 'default-tag-20';
    const category = config?.client_secret || 'Electronics';
    const dailyTarget = 3;

    if (generatedToday && generatedToday.count >= dailyTarget) {
      console.log(`[Automation] Daily target of ${dailyTarget} drafts already met for today.`);
      isGenerating = false;
      return;
    }

    const needed = dailyTarget - (generatedToday ? generatedToday.count : 0);
    console.log(`[Automation] Generating ${needed} new drafts for category: ${category}`);
    appEvents.emit('notification', { type: 'success', message: `Amazon Engine: Discovering ${needed} Top 1% BSR products...` });

    const products = await fetchTopAmazonProducts(category, needed, affiliateTag);

    for (const prod of products) {
      console.log(`[Automation] Generating content for BSR #${prod.bsr}: ${prod.title}`);
      
      const prompt = `Act as an expert affiliate marketer for the US market. Create a highly engaging, SEO and AIO optimized social media caption in English for this Amazon affiliate product: ${prod.title}. Keep it under 300 characters. Add 3 hashtags. Respond ONLY with a JSON object containing a "caption" property. Example: {"caption": "Your text here"}`;
      
      let caption = `Check out this amazing ${category} deal! Link in bio. #amazonfinds`;
      try {
        const ai = await getAiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-low",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(response.text);
        if (parsed.caption) caption = parsed.caption;
      } catch (e) {
        console.error("[Automation] Gemini caption failed, using fallback.");
      }

      // We assign random upcoming scheduled times for these drafts
      const scheduledFor = new Date(Date.now() + Math.random() * 86400000).toISOString();
      const platform = Math.random() > 0.5 ? 'instagram' : 'pinterest';

      // Generate short code
      const shortCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      await db.run(
        "INSERT INTO short_links (short_code, original_url) VALUES (?, ?)",
        [shortCode, prod.link]
      );
      const cloakedLink = `http://localhost:3000/go/${shortCode}`;

      await db.run(
        "INSERT INTO scheduled_posts (product_link, caption, image_url, platform, scheduled_for, status) VALUES (?, ?, ?, ?, ?, ?)",
        [cloakedLink, caption, prod.imageUrl, platform, scheduledFor, 'draft']
      );
      
      console.log(`[Automation] Draft created for ${prod.title}`);
    }
    
    appEvents.emit('notification', { type: 'success', message: `Amazon Engine: Successfully generated ${needed} new drafts awaiting your approval!` });

  } catch (error) {
    console.error("[Automation] Error in automation run:", error);
  } finally {
    isGenerating = false;
  }
}

export function initAutomationEngine() {
  if (intervalId) return;
  // Run check every minute (in a real app, maybe every hour)
  intervalId = setInterval(runDailyAutomation, 60000);
  console.log('[Automation] Amazon BSR Automation Engine initialized.');
  
  // Also run immediately on boot
  setTimeout(runDailyAutomation, 5000);
}
