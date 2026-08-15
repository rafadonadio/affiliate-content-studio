import { GoogleGenAI } from "@google/genai";
import { getDb } from "./db.js";

export async function getAiClient() {
  const db = await getDb();
  // Try to get key from user settings
  const config = await db.get("SELECT client_id FROM app_configs WHERE platform = 'gemini'");
  
  const apiKey = config?.client_id || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in settings or environment");
  }

  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}
