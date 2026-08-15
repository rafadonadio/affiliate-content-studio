import { EventEmitter } from 'events';

// Global Event Emitter for bridging internal processes (like BullMQ) with HTTP (like SSE)
class AppEventEmitter extends EventEmitter {}

export const appEvents = new AppEventEmitter();
