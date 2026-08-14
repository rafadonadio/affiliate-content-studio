import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5199;

  // API routes
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate-caption", async (req, res) => {
    try {
      const { productLink } = req.body;
      if (!productLink) {
        return res.status(400).json({ error: "Product link is required" });
      }

      const { ai } = await import("./src/lib/gemini.ts");
      const { getDb } = await import("./src/lib/db.ts");
      const db = await getDb();
      
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Create an SEO-optimized Instagram caption for this Amazon affiliate product link: ${productLink}. Keep it engaging and add relevant hashtags.`,
      });

      await db.run(
        "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
        ["Generate Caption", `Product: ${productLink}`, "Success"]
      );

      res.json({ caption: response.text });
    } catch (error) {
      console.error("Error generating caption:", error);
      const { getDb } = await import("./src/lib/db.ts");
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

      const { ai } = await import("./src/lib/gemini.ts");
      const { getDb } = await import("./src/lib/db.ts");
      const db = await getDb();
      
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
      const { getDb } = await import("./src/lib/db.ts");
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
      const { getDb } = await import("./src/lib/db.ts");
      const db = await getDb();
      const logs = await db.all("SELECT * FROM execution_logs ORDER BY created_at DESC LIMIT 50");
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
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
