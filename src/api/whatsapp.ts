import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { whatsappManager } from '../lib/whatsapp-manager.js';

const router = Router();

// Middleware to check if user is authenticated (should ideally use JWT, but using simple header for now to match other endpoints if needed, or we just pass userId)
// In a real app we would use JWT verification middleware. For this endpoint we assume the frontend passes the user ID or auth token.
// Let's assume the frontend passes `Authorization: Bearer <token>` and we verify it, or passes `x-user-id` for simplicity.
// Wait, looking at `auth.ts`, the `JWT_SECRET` is used. We'll just expect `x-user-id` from the frontend for this specific internal demo, OR we can decode the JWT.
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_change_me_in_prod';

const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/status', requireAuth, async (req: any, res) => {
  const userId = req.userId;
  const session = whatsappManager.getSession(userId);

  if (!session) {
    return res.json({ status: 'DISCONNECTED', qr: null });
  }

  res.json({
    status: session.status,
    qr: session.qrCodeDataUrl
  });
});

router.post('/connect', requireAuth, async (req: any, res) => {
  const userId = req.userId;
  const session = await whatsappManager.initializeClient(userId);

  res.json({
    status: session.status,
    qr: session.qrCodeDataUrl
  });
});

router.post('/logout', requireAuth, async (req: any, res) => {
  const userId = req.userId;
  await whatsappManager.logoutClient(userId);
  res.json({ success: true, message: 'WhatsApp disconnected' });
});

export const whatsappRouter = router;
