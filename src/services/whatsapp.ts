import { whatsappManager } from '../lib/whatsapp-manager.js';
import { getAiClient } from '../lib/gemini.js';
import { getDb } from '../lib/db.js';

export async function sendWhatsAppMessage(userId: string, to: string, message: string): Promise<boolean> {
  try {
    await whatsappManager.sendMessage(userId, to, message);
    return true;
  } catch (error) {
    console.error(`Failed to send WhatsApp message for user ${userId}:`, error);
    return false;
  }
}

export async function processIncomingMessage(userId: string, fromNumber: string, text: string): Promise<void> {
  try {
    const ai = await getAiClient();
    
    // Simplistic logic for responding. In a real app, you would retrieve the user's specific context,
    // active campaigns, previous chat history from DB, etc.
    const prompt = `
    You are an AI assistant managing the WhatsApp account for a user on Affiliate Content Studio.
    You received a message from ${fromNumber}. 
    Message: "${text}"
    
    Respond helpfully and concisely.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-low",
      contents: prompt
    });

    const reply = response.text || "Lo siento, no pude procesar tu mensaje.";
    
    await sendWhatsAppMessage(userId, fromNumber, reply);
    
    // Log the interaction
    const db = await getDb();
    await db.run(
      "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
      ["WhatsApp Auto-Reply", `To: ${fromNumber}`, "Success"]
    );
    
  } catch (error) {
    console.error("Error processing incoming WhatsApp message:", error);
  }
}
