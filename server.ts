import express from "express";
import path from "path";
import cors from "cors";
import { getDb } from "./src/lib/db.js";
import { initQueue } from "./src/lib/queue.js";
import { initAutomationEngine } from "./src/lib/automation.js";
import { initEngagementBot } from "./src/lib/engagement.js";
import { assistantRouter } from "./src/api/assistant.js";
import { whatsappRouter } from "./src/api/whatsapp.js";
import { stripeRouter } from "./src/api/stripe.js";
import { stripeWebhookRouter } from "./src/api/stripe-webhook.js";
import { authRouter } from "./src/api/auth.js";
import { adminRouter } from "./src/api/admin.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5199;

  app.use(cors());
  app.use(express.json());

  // Initialize background queue
  initQueue();
  // Initialize Amazon Automation Engine
  initAutomationEngine();
  // Initialize Engagement Bot
  initEngagementBot();

  app.use("/api/assistant", assistantRouter);
  app.use("/api/whatsapp", whatsappRouter);
  app.use("/api/stripe", stripeRouter);
  app.use("/api/stripe/webhook", stripeWebhookRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate-caption", async (req, res) => {
    try {
      const { productLink } = req.body;
      if (!productLink) {
        return res.status(400).json({ error: "Product link is required" });
      }

      const { getAiClient } = await import("./src/lib/gemini.js");
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      
      const ai = await getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-low",
        contents: `Act as an expert affiliate marketer for the US market. Create a single SEO and AIO (Artificial Intelligence Optimization) focused Instagram caption in English for this Amazon affiliate product link: ${productLink}. Keep it engaging and add highly relevant keywords and hashtags. Respond ONLY with a JSON object containing a "caption" property. Example: {"caption": "Your text here"}`,
        config: {
          responseMimeType: "application/json",
        }
      });

      await db.run(
        "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
        ["Generate Caption", `Product: ${productLink}`, "Success"]
      );

      let caption = "";
      try {
        const parsed = JSON.parse(response.text);
        caption = parsed.caption || response.text;
      } catch (e) {
        caption = response.text;
      }

      res.json({ captions: [caption] });
    } catch (error) {
      console.error("Error generating caption:", error);
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      await db.run(
        "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
        ["Generate Caption", `Error`, "Failed"]
      );
      res.status(500).json({ error: "Failed to generate caption" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const { getAiClient } = await import("./src/lib/gemini.js");
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      
      const ai = await getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });
      
      let imageBase64 = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }

      if (!imageBase64) {
        throw new Error("No image generated");
      }

      await db.run(
        "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
        ["Generate Image", `Prompt: ${prompt.substring(0, 50)}...`, "Success"]
      );

      res.json({ image: `data:image/png;base64,${imageBase64}` });
    } catch (error) {
      console.error("Error generating image:", error);
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      await db.run(
        "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
        ["Generate Image", `Error`, "Failed"]
      );
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      const logs = await db.all("SELECT * FROM execution_logs ORDER BY created_at DESC LIMIT 50");
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Scheduled posts API
  app.get("/api/scheduled", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      const posts = await db.all("SELECT * FROM scheduled_posts ORDER BY scheduled_for ASC");
      res.json(posts);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      res.status(500).json({ error: "Failed to fetch scheduled posts" });
    }
  });

  app.post("/api/scheduled", async (req, res) => {
    try {
      const { productLink, caption, imageUrl, platform, scheduledFor } = req.body;
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();

      const result = await db.run(
        "INSERT INTO scheduled_posts (product_link, caption, image_url, platform, scheduled_for) VALUES (?, ?, ?, ?, ?)",
        [productLink, caption, imageUrl, platform, scheduledFor]
      );

      res.status(201).json({ id: result.lastID, message: "Post scheduled" });
    } catch (error) {
      console.error("Error scheduling post:", error);
      res.status(500).json({ error: "Failed to schedule post" });
    }
  });

  app.patch("/api/scheduled/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduledFor } = req.body;
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();

      await db.run(
        "UPDATE scheduled_posts SET scheduled_for = ? WHERE id = ?",
        [scheduledFor, id]
      );

      // Note: In a real app we'd need to remove the old job and add a new one in BullMQ.
      // For simplicity here, we assume the worker handles verifying the time.

      res.json({ message: "Scheduled time updated" });
    } catch (error) {
      console.error("Error updating scheduled post:", error);
      res.status(500).json({ error: "Failed to update scheduled post" });
    }
  });

  app.delete("/api/scheduled/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();

      await db.run("DELETE FROM scheduled_posts WHERE id = ?", [id]);
      res.json({ message: "Scheduled post deleted" });
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      res.status(500).json({ error: "Failed to delete scheduled post" });
    }
  });

  // Drafts Approval API
  app.get("/api/drafts", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      const posts = await db.all("SELECT * FROM scheduled_posts WHERE status = 'draft' ORDER BY created_at DESC");
      res.json(posts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  app.post("/api/drafts/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      
      await db.run("UPDATE scheduled_posts SET status = 'pending' WHERE id = ?", [id]);
      res.json({ message: "Draft approved and scheduled for publishing" });
    } catch (error) {
      console.error("Error approving draft:", error);
      res.status(500).json({ error: "Failed to approve draft" });
    }
  });

  // Link Cloaking Redirect Endpoint
  app.get("/go/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      
      const link = await db.get("SELECT * FROM short_links WHERE short_code = ?", [code]);
      
      if (link) {
        // Increment clicks
        await db.run("UPDATE short_links SET clicks = clicks + 1 WHERE id = ?", [link.id]);
        return res.redirect(link.original_url);
      } else {
        return res.status(404).send("Link not found");
      }
    } catch (error) {
      console.error("Redirect error:", error);
      res.status(500).send("Server Error");
    }
  });

  // OAuth endpoints
  app.get("/auth/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { getClient } = await import("./src/lib/oauth.js");
      const client = await getClient(platform);
      
      let scope = '';
      if (platform === 'youtube') scope = 'https://www.googleapis.com/auth/youtube.force-ssl';
      else if (platform === 'instagram') scope = 'instagram_basic,instagram_content_publish';
      else if (platform === 'pinterest') scope = 'boards:read,pins:write';

      const authorizationUri = client.authorizeURL({
        redirect_uri: `http://localhost:${PORT}/auth/${platform}/callback`,
        scope,
        state: '3(#0/!~',
        ...(platform === 'youtube' ? { access_type: 'offline', prompt: 'consent' } : {})
      });

      res.redirect(authorizationUri);
    } catch (error) {
      console.error(error);
      res.status(500).send("Authentication initialization failed");
    }
  });

  app.get("/auth/:platform/callback", async (req, res) => {
    try {
      const { platform } = req.params;
      const { code } = req.query;
      const { getClient, saveCredentials } = await import("./src/lib/oauth.js");
      const client = await getClient(platform);

      const tokenParams = {
        code: code as string,
        redirect_uri: `http://localhost:${PORT}/auth/${platform}/callback`,
      };

      const accessToken = await client.getToken(tokenParams);
      await saveCredentials(platform, accessToken.token);

      res.send(`<h1>Successfully authenticated with ${platform}!</h1><p>You can close this window and return to the app.</p><script>window.close();</script>`);
    } catch (error: any) {
      console.error("Access Token Error", error.message);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/platforms/status", async (req, res) => {
    try {
      // In a real app we'd use the user ID from auth middleware
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      const rows = await db.all("SELECT platform FROM oauth_credentials");
      let connected = rows.map((r: any) => r.platform);
      
      const configRows = await db.all("SELECT platform FROM app_configs");
      let configured = configRows.map((r: any) => r.platform);

      // Check whatsapp manager in-memory directly for testing, or check DB
      try {
        const platRows = await db.all("SELECT platform FROM platform_credentials WHERE is_connected = 1");
        connected = [...connected, ...platRows.map((r: any) => r.platform)];
      } catch (e) {
        // Table might not exist yet
      }

      // WhatsApp doesn't need app config anymore
      if (!configured.includes('whatsapp')) {
        configured.push('whatsapp');
      }
      
      res.json({ connected, configured });
    } catch (error) {
      console.error("Error fetching platform status:", error);
      res.status(500).json({ error: "Failed to fetch platform status" });
    }
  });

  app.post("/api/platforms/config", async (req, res) => {
    try {
      const { platform, client_id, client_secret } = req.body;
      if (!platform || !client_id || !client_secret) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      await db.run(
        "INSERT INTO app_configs (platform, client_id, client_secret) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE client_id = VALUES(client_id), client_secret = VALUES(client_secret)",
        [platform.toLowerCase(), client_id, client_secret]
      );
      res.json({ message: "App configuration saved successfully" });
    } catch (error) {
      console.error("Error saving app config:", error);
      res.status(500).json({ error: "Failed to save app configuration" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const { getDb } = await import("./src/lib/db.js");
      const db = await getDb();
      
      // Fetch historical data
      const data = await db.all("SELECT * FROM analytics ORDER BY date ASC");
      
      // Calculate totals
      let totalLikes = 0;
      let totalClicks = 0;
      let totalComments = 0;
      
      data.forEach(item => {
        totalLikes += item.likes;
        totalClicks += item.clicks;
        totalComments += item.comments;
      });

      // Generate AI Insights using Gemini
      const { getAiClient } = await import("./src/lib/gemini.js");
      const prompt = `
You are an expert Social Media & Affiliate Marketing Analyst. 
Analyze the following recent performance data for my Amazon affiliate posts across different platforms and categories.
Data: ${JSON.stringify(data)}

Provide a concise, highly actionable 2-3 sentence insight predicting what type of content (category/platform) I should focus on next for maximum ROI, and why based on the trends. Do not use markdown formatting like asterisks or bullet points, just plain text.
`;

      let aiInsight = "Gathering more data to provide accurate predictions...";
      try {
        const ai = await getAiClient();
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-low",
          contents: prompt
        });
        aiInsight = response.text || aiInsight;
      } catch (aiError) {
        console.error("Error generating AI insight:", aiError);
      }

      res.json({
        metrics: {
          totalLikes,
          totalClicks,
          totalComments,
          totalPosts: data.length
        },
        chartData: data,
        aiInsight
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // SSE Notifications endpoint
  app.get("/api/notifications", async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { appEvents } = await import("./src/lib/events.js");

    const onNotification = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    appEvents.on('notification', onNotification);

    req.on('close', () => {
      appEvents.off('notification', onNotification);
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
