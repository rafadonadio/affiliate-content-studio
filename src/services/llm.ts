import { getAiClient } from "../lib/gemini.js";

// Define the structure of an Action
export interface AssistantAction {
  action: "AUTHORIZE_DRAFTS" | "GENERATE_CAPTION" | "NAVIGATE" | "UNKNOWN";
  payload?: any;
  reply: string;
}

export async function processAssistantCommand(command: string, context?: any): Promise<AssistantAction> {
  const ai = await getAiClient();
  
  const systemInstruction = `
You are Jarvis, the virtual assistant for Affiliate Content Studio.
Your job is to interpret the user's command and map it to one of the available system actions.
The user might speak to you in English or Spanish. Always reply in the same language they used.
Available Actions:
1. AUTHORIZE_DRAFTS: Approves all pending drafts.
2. GENERATE_CAPTION: Generates a caption for a provided product link. Requires "productLink" in payload.
3. NAVIGATE: Navigates to a specific section. Requires "route" in payload (e.g., "/analytics", "/settings", "/", "/calendar").
4. UNKNOWN: Use this if you don't understand the command.

Respond ONLY with a JSON object containing:
- "action": The string identifier of the action.
- "payload": An optional object with required parameters.
- "reply": A short, friendly voice-friendly response to the user confirming what you are doing.

Context of the user: ${JSON.stringify(context || {})}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-low",
    contents: `Command: ${command}`,
    systemInstruction,
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const text = response.text || "{}";
    const parsed = JSON.parse(text) as AssistantAction;
    return parsed;
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    return {
      action: "UNKNOWN",
      reply: "Lo siento, no pude entender ese comando."
    };
  }
}
