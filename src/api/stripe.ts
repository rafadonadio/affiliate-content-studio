import { Router } from 'express';
import Stripe from 'stripe';
import { getDb } from '../lib/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Initialize Stripe (uses a test key if no env var is provided)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_development', {
  apiVersion: '2024-06-20',
});

const PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || 'price_mock_pro';

// 1. Create Checkout Session
router.post('/create-checkout-session', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const db = await getDb();
    let subscription = await db.get("SELECT * FROM subscriptions WHERE user_id = ?", [userId]);
    
    let customerId = subscription?.stripe_customer_id;
    
    if (!customerId) {
      // Create a new customer if none exists
      const customer = await stripe.customers.create({
        description: 'Local App User',
      });
      customerId = customer.id;
      
      if (!subscription) {
        await db.run("INSERT INTO subscriptions (user_id, stripe_customer_id) VALUES (?, ?)", [userId, customerId]);
      } else {
        await db.run("UPDATE subscriptions SET stripe_customer_id = ? WHERE user_id = ?", [customerId, userId]);
      }
    }

    const FRONTEND_URL = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5199';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID_PRO, // Replace with your actual Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true, // Habilita el campo de cupones en la pasarela de pago
      success_url: `${FRONTEND_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/settings`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Create Customer Portal Session
router.post('/create-portal-session', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const db = await getDb();
    const subscription = await db.get("SELECT * FROM subscriptions WHERE user_id = ?", [userId]);
    
    if (!subscription || !subscription.stripe_customer_id) {
      return res.status(400).json({ error: 'No customer found. Please subscribe first.' });
    }

    const FRONTEND_URL = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5199';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${FRONTEND_URL}/settings`,
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Subscription Status
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const db = await getDb();
    const subscription = await db.get("SELECT * FROM subscriptions WHERE user_id = ?", [userId]);
    
    if (!subscription) {
      return res.json({ status: 'inactive' });
    }

    res.json({ 
      status: subscription.status, 
      plan: subscription.plan_id,
      current_period_end: subscription.current_period_end 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const stripeRouter = router;
