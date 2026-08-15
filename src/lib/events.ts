import { EventEmitter } from 'events';

// Global Event Emitter for bridging internal processes (like BullMQ) with HTTP (like SSE)
class AppEventEmitter extends EventEmitter {}

export const appEvents = new AppEventEmitter();

// Event Constants for Assistant
export const ASSISTANT_EVENTS = {
    ON_VOICE_COMMAND: 'ON_VOICE_COMMAND',
    ASSISTANT_RESPONSE: 'ASSISTANT_RESPONSE',
    EXECUTE_ACTION: 'EXECUTE_ACTION'
};
