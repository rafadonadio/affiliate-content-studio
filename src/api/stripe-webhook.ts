import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { getDb } from '../lib/db';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-06-20',
});

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

router.post('/', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    // In production, we verify the signature. 
    // If endpointSecret is 'whsec_mock', we skip verification for easy local dev testing.
    if (endpointSecret === 'whsec_mock') {
       event = JSON.parse(request.body.toString());
    } else {
       event = stripe.webhooks.constructEvent(request.body, sig as string, endpointSecret);
    }
  } catch (err: any) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = await getDb();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Update DB
      await db.run(
        `UPDATE subscriptions SET 
         stripe_subscription_id = ?, 
         status = 'active'
         WHERE stripe_customer_id = ?`,
        [session.subscription, session.customer]
      );
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await db.run(
        `UPDATE subscriptions SET 
         status = ?, 
         plan_id = ?,
         current_period_end = ?
         WHERE stripe_subscription_id = ?`,
        [
          subscription.status, 
          subscription.items.data[0].price.id,
          new Date(subscription.current_period_end * 1000).toISOString(),
          subscription.id
        ]
      );
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

export const stripeWebhookRouter = router;
