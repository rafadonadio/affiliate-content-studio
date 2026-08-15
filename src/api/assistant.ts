import express from "express";
import { processAssistantCommand } from "../services/llm.js";
import { appEvents, ASSISTANT_EVENTS } from "../lib/events.js";

export const assistantRouter = express.Router();

assistantRouter.post("/", async (req, res) => {
  try {
    const { command, context } = req.body;
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    const action = await processAssistantCommand(command, context);
    
    // Broadcast the action to the frontend via SSE if needed
    // or frontend can just handle the response directly.
    appEvents.emit('notification', {
      type: ASSISTANT_EVENTS.ASSISTANT_RESPONSE,
      payload: action
    });

    res.json(action);
  } catch (error) {
    console.error("Error processing assistant command:", error);
    res.status(500).json({ error: "Failed to process command" });
  }
});
