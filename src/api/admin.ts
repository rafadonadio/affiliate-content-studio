import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Secure all routes in this router
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
    const subsCount = await db.get('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"');
    const logsCount = await db.get('SELECT COUNT(*) as count FROM execution_logs');
    
    // Check if Stripe is configured securely without revealing the key
    const stripeConnected = !!process.env.STRIPE_SECRET_KEY;

    res.json({
      totalUsers: usersCount.count,
      activeSubscriptions: subsCount.count,
      totalExecutionLogs: logsCount.count,
      stripeConnected
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const db = await getDb();
    // Use MySQL JOIN to get users and their subscription status
    const query = `
      SELECT u.id, u.email, u.role, u.created_at, s.status as subscription_status, s.plan_id 
      FROM users u 
      LEFT JOIN subscriptions s ON u.id = s.stripe_customer_id
      ORDER BY u.created_at DESC
    `;
    const usersList = await db.all(query);
    res.json({ users: usersList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

export const adminRouter = router;
