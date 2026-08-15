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
    const user = await db.get<{id: string, email: string, password_hash: string, role: string, assistant_name: string, assistant_avatar: string}>('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check active subscription
    const sub = await db.get('SELECT status FROM subscriptions WHERE user_id = ? AND status = "active"', [user.id]);
    
    const hasProLicense = !!sub;

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, assistantName: user.assistant_name, assistantAvatar: user.assistant_avatar }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, hasProLicense, assistantName: user.assistant_name, assistantAvatar: user.assistant_avatar } });
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

// Endpoint to update assistant settings
router.patch('/assistant', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { assistantName, assistantAvatar } = req.body;
    const db = await getDb();
    
    await db.run(
      "UPDATE users SET assistant_name = ?, assistant_avatar = ? WHERE id = ?",
      [assistantName || 'Assistant', assistantAvatar || null, decoded.id]
    );
    
    res.json({ success: true, assistantName: assistantName || 'Assistant', assistantAvatar: assistantAvatar || null });
  } catch (error) {
    console.error('Update assistant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export const authRouter = router;
