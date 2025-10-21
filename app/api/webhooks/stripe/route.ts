import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { updateUserSubscription, getUserByStripeCustomerId } from '@/lib/services/users';
import { SubscriptionStatus, SubscriptionTier } from '@/types/user';
import { handleTierDowngrade } from '@/lib/services/locations';

// Disable body parsing for webhooks
export const runtime = 'nodejs';

/**
 * Map Stripe price ID to subscription tier
 */
function getPriceIdTier(priceId: string): SubscriptionTier {
  if (priceId === process.env.STRIPE_SUPPORTER_PRICE_ID) {
    return 'supporter';
  }
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro';
  }
  return 'free';
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
  };

  return statusMap[stripeStatus] || 'canceled';
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getPriceIdTier(priceId);

  await updateUserSubscription(user._id!, {
    stripeSubscriptionId: subscription.id,
    tier: tier,
    status: mapStripeStatus(subscription.status),
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
  });

  console.log(`Subscription created for user ${user._id}: ${tier}`);
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getPriceIdTier(priceId);
  const status = mapStripeStatus(subscription.status);

  // If subscription is canceled or expired, downgrade to free
  const finalTier = ['canceled', 'incomplete'].includes(status) ? 'free' : tier;

  // Check if tier is being downgraded
  const previousTier = user.subscriptionTier || 'free';
  const isDowngrade =
    (previousTier === 'pro' && finalTier !== 'pro') ||
    (previousTier === 'supporter' && finalTier === 'free');

  await updateUserSubscription(user._id!, {
    stripeSubscriptionId: subscription.id,
    tier: finalTier,
    status: status,
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
  });

  // Handle location limits on downgrade
  if (isDowngrade) {
    const result = await handleTierDowngrade(user._id!, finalTier);
    console.log(
      `Tier downgrade: disabled ${result.disabledCount} locations, kept ${result.keptCount}`
    );
  }

  console.log(`Subscription updated for user ${user._id}: ${tier} (${status})`);
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  await updateUserSubscription(user._id!, {
    tier: 'free',
    status: 'canceled',
    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
  });

  // Handle location limits when downgrading to free
  const result = await handleTierDowngrade(user._id!, 'free');
  console.log(
    `Subscription deleted: disabled ${result.disabledCount} locations, kept ${result.keptCount}`
  );

  console.log(`Subscription deleted for user ${user._id}`);
}

/**
 * Handle checkout session completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.log('No subscription in checkout session');
    return;
  }

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  // Fetch the full subscription object
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionCreated(subscription);

  console.log(`Checkout completed for user ${user._id}`);
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  await updateUserSubscription(user._id!, {
    tier: user.subscriptionTier || 'free',
    status: 'past_due',
  });

  console.log(`Payment failed for user ${user._id}`);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
