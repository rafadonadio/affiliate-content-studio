import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../lib/db.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_change_me_in_prod';

router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const db = await getDb();
    let user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    
    // If user doesn't exist, create them
    if (!user) {
      const id = crypto.randomUUID();
      await db.run('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, email, '*OTP*']);
      user = { id };
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins from now

    // Format for MySQL DATETIME: YYYY-MM-DD HH:MM:SS
    const formattedExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    await db.run('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?', [otpCode, formattedExpiresAt, email]);

    // Send Email via Hostinger Relay (mailer.php)
    const relayUrl = 'https://afs.maper.tech/mailer.php';
    const relaySecret = 'AFS_Secret_Relay_2030';

    try {
      const response = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: relaySecret,
          email: email,
          otpCode: otpCode
        })
      });

      if (!response.ok) {
        throw new Error(`Relay devolvió status: ${response.status}`);
      }

      console.log(`✉️ Correo OTP enviado a ${email} vía Hostinger Relay`);
    } catch (mailError) {
      console.error('Error enviando correo por Relay:', mailError);
      // Fallback a consola en caso de error
      console.log(`\n\n========================================`);
      console.log(`🔐 OTP CODE FOR ${email}: ${otpCode}`);
      console.log(`========================================\n\n`);
    }

    res.json({ success: true, message: 'OTP sent' });
  } catch (error: any) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Server error requesting OTP', details: error.message || String(error) });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code required' });
    }

    const db = await getDb();
    const user = await db.get<{
      id: string, email: string, role: string, 
      otp_code: string, otp_expires_at: string,
      assistant_name: string, assistant_avatar: string
    }>('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.otp_code !== code) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    const now = new Date();
    const expiresAt = new Date(user.otp_expires_at);
    
    if (now > expiresAt) {
      return res.status(401).json({ error: 'Code expired' });
    }

    // Clear the OTP
    await db.run('UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [user.id]);

    // Check active subscription
    const sub = await db.get('SELECT status FROM subscriptions WHERE user_id = ? AND status = "active"', [user.id]);
    const hasProLicense = !!sub;

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, assistantName: user.assistant_name, assistantAvatar: user.assistant_avatar }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, hasProLicense, assistantName: user.assistant_name, assistantAvatar: user.assistant_avatar } });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error verifying OTP' });
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

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateQueryToken = (req: any, res: any, next: any) => {
  const token = req.query.token || req.query.state; // We will pass token in state parameter for OAuth callback
  if (!token) {
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const decoded = jwt.verify(token as string, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send('Invalid token');
  }
};

// Endpoint to update assistant settings
router.patch('/assistant', authenticateToken, async (req: any, res: any) => {
  try {
    const { assistantName, assistantAvatar } = req.body;
    const db = await getDb();
    
    await db.run(
      "UPDATE users SET assistant_name = ?, assistant_avatar = ? WHERE id = ?",
      [assistantName || 'Assistant', assistantAvatar || null, req.user.id]
    );
    
    res.json({ success: true, assistantName: assistantName || 'Assistant', assistantAvatar: assistantAvatar || null });
  } catch (error) {
    console.error('Update assistant error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export const authRouter = router;
