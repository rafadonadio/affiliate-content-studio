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

    // Send Email via Titan Email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.titan.email',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'afs@maper.tech',
        pass: process.env.SMTP_PASS || 'Regent@LakeNona',
      },
    });

    const mailOptions = {
      from: `"Affiliate Content Studio" <${process.env.SMTP_USER || 'afs@maper.tech'}>`,
      to: email,
      subject: 'Tu Código de Acceso / Your Access Code',
      text: `Tu código de acceso es: ${otpCode}\n\nEste código expirará en 15 minutos.\n\nYour access code is: ${otpCode}\n\nThis code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #f9fafb; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Affiliate Content Studio</h2>
          <p style="color: #374151; font-size: 16px;">Aquí tienes tu código de acceso para iniciar sesión:</p>
          <div style="background-color: #e0e7ff; color: #4338ca; font-size: 32px; font-weight: bold; letter-spacing: 0.25em; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este código expirará en 15 minutos. Si no solicitaste este acceso, puedes ignorar este mensaje.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Correo OTP enviado a ${email}`);
    } catch (mailError) {
      console.error('Error enviando correo:', mailError);
      // Fallback a consola en caso de error
      console.log(`\n\n========================================`);
      console.log(`🔐 OTP CODE FOR ${email}: ${otpCode}`);
      console.log(`========================================\n\n`);
    }

    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Server error requesting OTP' });
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
