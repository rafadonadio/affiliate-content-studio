import { Router } from 'express';
import Stripe from 'stripe';
import { getDb } from '../lib/db';

const router = Router();

// Initialize Stripe (uses a test key if no env var is provided)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_development', {
  apiVersion: '2024-06-20',
});

const PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO || 'price_mock_pro';

// 1. Create Checkout Session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const db = await getDb();
    
    // In a real multi-tenant app, we'd get the user ID from the auth token.
    // For this local app, we assume a single local user.
    let subscription = await db.get("SELECT * FROM subscriptions LIMIT 1");
    
    let customerId = subscription?.stripe_customer_id;
    
    if (!customerId) {
      // Create a new customer if none exists
      const customer = await stripe.customers.create({
        description: 'Local App User',
      });
      customerId = customer.id;
      
      if (!subscription) {
        await db.run("INSERT INTO subscriptions (stripe_customer_id) VALUES (?)", [customerId]);
      } else {
        await db.run("UPDATE subscriptions SET stripe_customer_id = ? WHERE id = ?", [customerId, subscription.id]);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID_PRO, // Replace with your actual Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `http://localhost:3000/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/settings`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Create Customer Portal Session
router.post('/create-portal-session', async (req, res) => {
  try {
    const db = await getDb();
    const subscription = await db.get("SELECT * FROM subscriptions LIMIT 1");
    
    if (!subscription || !subscription.stripe_customer_id) {
      return res.status(400).json({ error: 'No customer found. Please subscribe first.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `http://localhost:3000/settings`,
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Subscription Status
router.get('/status', async (req, res) => {
  try {
    const db = await getDb();
    const subscription = await db.get("SELECT * FROM subscriptions LIMIT 1");
    
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
