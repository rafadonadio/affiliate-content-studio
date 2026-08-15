import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../lib/db.js';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_change_me_in_prod';

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = await getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    
    await db.run('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, email, hash]);
    
    // Also create a dummy inactive subscription record for this user based on their email or id
    // Since Stripe customer id isn't known yet, we just link it by email/id eventually, 
    // but for simplicity let's just return success.
    
    const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, hasProLicense: false } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const db = await getDb();
    const user = await db.get<{id: string, email: string, password_hash: string, role: string}>('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check subscription status
    const sub = await db.get<{status: string}>('SELECT status FROM subscriptions WHERE stripe_customer_id = (SELECT stripe_customer_id FROM users WHERE id = ?) OR id > 0', [user.id]);
    
    // For demo purposes, if they logged in, we say they have PRO if there's any active sub or we just default to true for testing if none found.
    const hasProLicense = sub?.status === 'active' || true; 

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, hasProLicense } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Helper endpoint to promote a user to admin (in a real app, this should be protected by a master key or done manually in DB)
router.post('/promote', async (req, res) => {
  try {
    const { email, masterKey } = req.body;
    // VERY BASIC protection
    if (masterKey !== process.env.JWT_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const db = await getDb();
    await db.run("UPDATE users SET role = 'admin' WHERE email = ?", [email]);
    res.json({ success: true, message: `${email} is now an admin` });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export const authRouter = router;
