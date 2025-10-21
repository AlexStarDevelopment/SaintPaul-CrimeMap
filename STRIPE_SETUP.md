# Stripe Payment Integration Setup Guide

This guide walks you through setting up Stripe for paid memberships on the Saint Paul Crime Map application.

## Overview

The application now supports three subscription tiers:
- **Free** - $0/month (basic features)
- **Supporter** - $5/month (ad-free, early access, priority support)
- **Pro** - $15/month (everything + CSV export, API access, analytics)

All paid subscriptions include a **7-day free trial**.

---

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" and create an account
3. Complete the onboarding process
4. You'll start in **Test Mode** (recommended for development)

---

## Step 2: Get Your API Keys

1. In your Stripe Dashboard, click **Developers** in the left menu
2. Click **API keys**
3. Copy the following keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
   - Keep these secure - never commit them to version control!

---

## Step 3: Create Products and Prices

### Create Supporter Tier ($5/month)

1. In Stripe Dashboard, go to **Products** > **Add product**
2. Fill in:
   - **Name**: Supporter
   - **Description**: Ad-free experience with early access and priority support
   - **Pricing**: $5.00 USD
   - **Billing period**: Monthly
   - **Recurring**
3. Click **Save product**
4. **Copy the Price ID** (starts with `price_`) - you'll need this for your environment variables

### Create Pro Tier ($15/month)

1. In Stripe Dashboard, go to **Products** > **Add product**
2. Fill in:
   - **Name**: Pro
   - **Description**: Everything in Supporter plus data export, API access, and analytics
   - **Pricing**: $15.00 USD
   - **Billing period**: Monthly
   - **Recurring**
3. Click **Save product**
4. **Copy the Price ID** (starts with `price_`) - you'll need this for your environment variables

---

## Step 4: Configure Customer Portal

The customer portal allows users to manage their subscriptions, update payment methods, and view billing history.

1. In Stripe Dashboard, go to **Settings** > **Billing** > **Customer portal**
2. Click **Activate test link** (or **Activate** for live mode)
3. Configure the portal settings:
   - **Subscription cancellation**: Enable - "Cancel immediately" or "Cancel at period end" (recommended)
   - **Subscription pausing**: Optional - enable if you want users to pause subscriptions
   - **Payment method update**: Enable
   - **Invoice history**: Enable
4. Click **Save**

---

## Step 5: Set Up Webhooks

Webhooks notify your application about subscription events (payments, cancellations, etc.).

### For Local Development (Stripe CLI)

1. **Install Stripe CLI**:
   ```bash
   # Windows
   scoop install stripe

   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) from the output

### For Production

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **Copy the Signing secret** (starts with `whsec_`)

---

## Step 6: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs
STRIPE_SUPPORTER_PRICE_ID=price_your_supporter_price_id_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
```

**Important**:
- For development, use **test** keys (pk_test_, sk_test_)
- For production, use **live** keys (pk_live_, sk_live_)
- NEVER commit these keys to version control

---

## Step 7: Test the Integration

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Start Stripe Webhook Listener (in another terminal)
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

### 3. Test the Checkout Flow

1. Navigate to `http://localhost:3001/pricing`
2. Click "Start 7-Day Free Trial" on the Supporter or Pro tier
3. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0027 6000 3184`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC
   - Any billing ZIP code

4. Complete the checkout
5. You should be redirected back to `/account` with a success message
6. Check the webhook listener terminal - you should see events being received

### 4. Test Subscription Management

1. Go to `/account`
2. Click "Manage Billing"
3. You should be redirected to the Stripe Customer Portal
4. Test updating payment method, viewing invoices, and canceling subscription

---

## Step 8: Go Live (Production)

### Before Going Live:

1. **Activate your Stripe account**:
   - Complete business verification in Stripe Dashboard
   - Add business details, bank account for payouts
   - Review and accept Stripe's terms

2. **Switch to Live Mode**:
   - Toggle from "Test mode" to "Live mode" in Stripe Dashboard
   - Create production products and prices (same as test)
   - Get production API keys and webhook secret
   - Update production environment variables

3. **Update your production `.env`**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   STRIPE_SUPPORTER_PRICE_ID=price_your_live_supporter_price
   STRIPE_PRO_PRICE_ID=price_your_live_pro_price
   ```

4. **Set up production webhooks**:
   - Add webhook endpoint in live mode: `https://yourdomain.com/api/webhooks/stripe`
   - Select the same events as test mode
   - Copy the new signing secret

5. **Test with live mode** before announcing to users

---

## Payment Flow Architecture

### User Journey

1. **User visits pricing page** (`/pricing`)
2. **Clicks "Start 7-Day Free Trial"**
3. **Redirected to Stripe Checkout** (hosted by Stripe)
4. **Enters payment details**
5. **Completes checkout**
6. **Redirected back to `/account?checkout=success`**
7. **Webhook updates user subscription in database**
8. **User gains access to premium features**

### Technical Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /api/checkout { tier: 'supporter' }
       ▼
┌─────────────────┐
│  Next.js API    │──── 2. Create Checkout Session
│  /api/checkout  │         ▼
└────────┬────────┘   ┌──────────┐
         │            │  Stripe  │
         │ 3. Session │   API    │
         │    URL     └────┬─────┘
         ▼                 │
┌─────────────┐            │ 4. Subscription Created
│   Browser   │            │    (webhook event)
│  (Stripe    │            ▼
│  Checkout)  │   ┌────────────────────┐
└──────┬──────┘   │  /api/webhooks/    │
       │          │     stripe         │
       │          └─────────┬──────────┘
       │ 5. Payment         │
       │    Success         │ 6. Update DB
       │                    ▼
       │              ┌──────────┐
       │              │ MongoDB  │
       │              │  Users   │
       │              └──────────┘
       │ 7. Redirect to /account
       ▼
┌─────────────┐
│   Account   │
│    Page     │
└─────────────┘
```

---

## Webhook Events Handled

The application listens for and processes these Stripe events:

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Activate user subscription, set tier, start trial |
| `customer.subscription.updated` | Update subscription status, handle tier changes |
| `customer.subscription.deleted` | Downgrade user to free tier |
| `checkout.session.completed` | Confirm subscription creation after checkout |
| `invoice.payment_failed` | Mark subscription as past_due |

---

## Database Schema

User subscriptions are stored in MongoDB with these fields:

```typescript
{
  _id: ObjectId,
  email: string,
  name: string,
  image: string,

  // Stripe fields
  stripeCustomerId: string,        // Stripe customer ID
  stripeSubscriptionId: string,    // Stripe subscription ID

  // Subscription details
  subscriptionTier: 'free' | 'supporter' | 'pro',
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete',
  subscriptionEndDate: Date,       // Next billing date or cancellation date
  trialEndDate: Date,              // When trial ends

  createdAt: Date,
  updatedAt: Date,
}
```

---

## Feature Access Control

Features are locked by subscription tier. Check access in your code:

```typescript
import { checkFeatureAccess } from '@/lib/services/subscription';

// In API route or component
const hasAccess = await checkFeatureAccess(userId, 'export');

if (!hasAccess) {
  return NextResponse.json({ error: 'Upgrade to Pro required' }, { status: 403 });
}
```

### Feature Matrix

| Feature | Free | Supporter | Pro |
|---------|------|-----------|-----|
| Basic map | ✅ | ✅ | ✅ |
| Filters | ✅ | ✅ | ✅ |
| Ad-free | ❌ | ✅ | ✅ |
| Early access | ❌ | ✅ | ✅ |
| Priority support | ❌ | ✅ | ✅ |
| CSV export | ❌ | ❌ | ✅ |
| Email alerts | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Trend analysis | ❌ | ❌ | ✅ |
| Custom reports | ❌ | ❌ | ✅ |

---

## Troubleshooting

### Webhook Events Not Received

1. **Check webhook URL** is correct and publicly accessible
2. **Verify webhook secret** in environment variables
3. **Check webhook signature verification** in logs
4. **Test with Stripe CLI**: `stripe trigger customer.subscription.created`

### Checkout Session Fails

1. **Verify API keys** are correct (test vs live mode)
2. **Check price IDs** match your Stripe products
3. **Ensure NEXTAUTH_URL** is set correctly for redirects
4. **Check browser console** for errors

### User Not Upgraded After Payment

1. **Check webhook was received** (logs or Stripe Dashboard)
2. **Verify user's stripeCustomerId** in database
3. **Check subscription status** in Stripe Dashboard
4. **Re-send webhook** from Stripe Dashboard > Webhooks > Events

### Customer Portal Not Working

1. **Activate customer portal** in Stripe Dashboard
2. **Verify user has stripeCustomerId**
3. **Check portal session creation** in logs

---

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Always verify webhook signatures** (already implemented)
3. **Use HTTPS in production** for webhooks
4. **Validate user authentication** before creating checkout sessions
5. **Log webhook events** for debugging but not user data
6. **Keep Stripe SDK updated** for security patches
7. **Monitor failed payments** and send notifications

---

## Useful Stripe Dashboard Links

- **Dashboard**: https://dashboard.stripe.com
- **Test Mode Toggle**: Top right corner
- **Products**: https://dashboard.stripe.com/products
- **Customers**: https://dashboard.stripe.com/customers
- **Subscriptions**: https://dashboard.stripe.com/subscriptions
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Logs**: https://dashboard.stripe.com/logs
- **API Keys**: https://dashboard.stripe.com/apikeys

---

## Support & Documentation

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Test Cards**: https://stripe.com/docs/testing
- **Webhooks Guide**: https://stripe.com/docs/webhooks
- **Customer Portal**: https://stripe.com/docs/billing/subscriptions/customer-portal

---

## Summary Checklist

- [ ] Create Stripe account
- [ ] Get API keys (publishable + secret)
- [ ] Create products for Supporter ($5) and Pro ($15)
- [ ] Copy price IDs
- [ ] Configure customer portal
- [ ] Set up webhooks (CLI for dev, endpoint for prod)
- [ ] Add all environment variables to `.env`
- [ ] Test checkout flow with test card
- [ ] Test webhook events
- [ ] Test customer portal
- [ ] Verify subscription updates in database
- [ ] Test subscription cancellation
- [ ] Switch to live mode for production
- [ ] Update production environment variables

---

## Next Steps

Once Stripe is configured:

1. **Test thoroughly** with Stripe test cards
2. **Monitor webhooks** to ensure they're processing correctly
3. **Add email notifications** for subscription events (optional)
4. **Set up subscription analytics** in Stripe Dashboard
5. **Configure tax collection** if required for your location
6. **Add billing reminders** for failed payments (optional)
7. **Create marketing materials** for the pricing page

---

**Questions or Issues?**

- Check Stripe Dashboard logs
- Review webhook event history
- Test with Stripe CLI
- Contact support@stripe.com for Stripe-specific issues
