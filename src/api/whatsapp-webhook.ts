import express from "express";
import { processAssistantCommand } from "../services/llm.js";
import { sendWhatsAppMessage } from "../services/whatsapp.js";

export const whatsappRouter = express.Router();

import { getDb } from "../lib/db.js";

// Basic webhook verification for WhatsApp Cloud API (or Twilio)
whatsappRouter.get("/webhook", async (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const db = await getDb();
    const config = await db.get("SELECT client_id FROM app_configs WHERE platform = 'whatsapp'");

    const verifyToken = config?.client_id || "YOUR_VERIFY_TOKEN";

    if (mode && token) {
      if (mode === "subscribe" && token === verifyToken) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
        res.sendStatus(200);
    }
  } catch (error) {
    console.error("Error verifying webhook:", error);
    res.sendStatus(500);
  }
});

whatsappRouter.post("/webhook", async (req, res) => {
  try {
    // Process incoming WhatsApp message
    // Structure depends on Twilio vs WhatsApp Cloud API.
    // Assuming simple generic structure for demonstration.
    const body = req.body;
    
    let command = "";
    let senderId = "";

    // Example parsing for WhatsApp Cloud API
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const message = body.entry[0].changes[0].value.messages[0];
      if (message.type === "text") {
        command = message.text.body;
        senderId = message.from;
      }
    }

    if (command && senderId) {
      const action = await processAssistantCommand(command, { platform: "whatsapp", senderId });
      
      console.log(`WhatsApp Command mapped to: ${action.action}`);
      
      // Enviar la respuesta usando Meta Cloud API
      if (action.reply) {
        const success = await sendWhatsAppMessage(senderId, action.reply);
        
        // Registrar en logs de base de datos
        const db = await getDb();
        await db.run(
          "INSERT INTO execution_logs (action, details, status) VALUES (?, ?, ?)",
          ["WhatsApp Chatbot", `A: ${senderId} | Msj: ${action.reply.substring(0, 50)}...`, success ? "Success" : "Failed"]
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing whatsapp webhook:", error);
    res.sendStatus(500);
  }
});
