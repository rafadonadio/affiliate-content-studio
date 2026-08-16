import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { getDb } from './db.js';
import { processIncomingMessage } from '../services/whatsapp.js';

interface WhatsAppSession {
  client: Client;
  qrCodeDataUrl: string | null;
  status: 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'READY' | 'DISCONNECTED';
}

class WhatsAppManager {
  private sessions: Map<string, WhatsAppSession> = new Map();

  /**
   * Initializes a WhatsApp client for a specific user.
   */
  public async initializeClient(userId: string): Promise<WhatsAppSession> {
    if (this.sessions.has(userId)) {
      return this.sessions.get(userId)!;
    }

    const session: WhatsAppSession = {
      client: new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
        }
      }),
      qrCodeDataUrl: null,
      status: 'INITIALIZING'
    };

    this.sessions.set(userId, session);

    const client = session.client;

    client.on('qr', async (qr) => {
      console.log(`[WhatsApp] QR Code generated for user ${userId}`);
      try {
        session.qrCodeDataUrl = await qrcode.toDataURL(qr);
        session.status = 'QR_READY';
      } catch (err) {
        console.error('Failed to generate QR code data URL', err);
      }
    });

    client.on('ready', async () => {
      console.log(`[WhatsApp] Client is READY for user ${userId}`);
      session.status = 'READY';
      session.qrCodeDataUrl = null; // Clear QR code as it's no longer needed

      // Update DB to mark whatsapp as connected
      const db = await getDb();
      await db.run(
        "INSERT INTO platform_credentials (user_id, platform, is_connected) VALUES (?, 'whatsapp', 1) ON DUPLICATE KEY UPDATE is_connected = 1",
        [userId]
      );
    });

    client.on('authenticated', () => {
      console.log(`[WhatsApp] Client AUTHENTICATED for user ${userId}`);
      session.status = 'AUTHENTICATED';
    });

    client.on('auth_failure', async msg => {
      console.error(`[WhatsApp] AUTH FAILURE for user ${userId}:`, msg);
      session.status = 'DISCONNECTED';
      await this.logoutClient(userId);
    });

    client.on('disconnected', async (reason) => {
      console.log(`[WhatsApp] Client DISCONNECTED for user ${userId}:`, reason);
      session.status = 'DISCONNECTED';
      await this.logoutClient(userId);
    });

    client.on('message', async (msg) => {
      // Ignore status updates
      if (msg.isStatus) return;
      
      // Forward to our chat logic
      const fromNumber = msg.from.replace('@c.us', '');
      const text = msg.body;
      
      if (text) {
        // We will call the AI service logic here
        await processIncomingMessage(userId, fromNumber, text);
      }
    });

    console.log(`[WhatsApp] Starting initialization for user ${userId}...`);
    client.initialize().catch(err => {
      console.error(`[WhatsApp] Error initializing client for ${userId}:`, err);
      session.status = 'DISCONNECTED';
    });

    return session;
  }

  public getSession(userId: string): WhatsAppSession | undefined {
    return this.sessions.get(userId);
  }

  public async logoutClient(userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (session) {
      try {
        await session.client.logout();
      } catch (err) {
        console.error(`[WhatsApp] Error logging out client for ${userId}:`, err);
      }
      try {
        await session.client.destroy();
      } catch (err) {
        console.error(`[WhatsApp] Error destroying client for ${userId}:`, err);
      }
      this.sessions.delete(userId);
    }

    const db = await getDb();
    await db.run(
      "UPDATE platform_credentials SET is_connected = 0 WHERE user_id = ? AND platform = 'whatsapp'",
      [userId]
    );
  }

  public async sendMessage(userId: string, toPhone: string, message: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (!session || session.status !== 'READY') {
      throw new Error(`WhatsApp client for user ${userId} is not ready.`);
    }

    const chatId = `${toPhone}@c.us`;
    await session.client.sendMessage(chatId, message);
  }
}

export const whatsappManager = new WhatsAppManager();
