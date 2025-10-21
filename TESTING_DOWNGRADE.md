# Testing Subscription Downgrade

This guide shows how to test that users lose access to premium features when downgraded.

## 🧪 Quick Test Methods

### Method 1: Cancel via Customer Portal (Recommended)

**Most realistic user flow:**

1. **Sign in** to your app with a premium subscription
2. Go to **http://localhost:3001/account**
3. Click **"Manage Billing"**
4. In Stripe Customer Portal, click **"Cancel subscription"**
5. Choose **"Cancel immediately"**
6. Return to `/account` and verify:
   - ✅ Current Plan shows "Free"
   - ✅ Status shows "No active subscription"
   - ✅ "Manage Billing" button is hidden
   - ✅ Premium features are disabled

---

### Method 2: Cancel via Stripe Dashboard

**Manual cancellation for testing:**

1. Go to: https://dashboard.stripe.com/test/subscriptions
2. Find your active subscription
3. Click on it
4. Click **"Cancel subscription"**
5. Choose **"Cancel immediately"**
6. Webhook fires → User downgraded to Free
7. Refresh `/account` to see changes

---

### Method 3: Trigger Test Webhook (Fast)

**Simulate cancellation without affecting real subscriptions:**

```bash
# Trigger a subscription deletion event
./stripe-cli/stripe.exe trigger customer.subscription.deleted
```

**Note**: This creates a test customer, not your real user. To test with your actual account, use Method 1 or 2.

---

## ✅ Verification Checklist

After downgrading, verify these changes:

### UI Changes
- [ ] `/account` page shows "Free" tier
- [ ] Subscription status shows "No active subscription"
- [ ] "Manage Billing" button is hidden
- [ ] Premium badges/indicators removed
- [ ] Upgrade prompts visible

### Feature Access
- [ ] Premium features show "Upgrade required" message
- [ ] API endpoints return 403 for premium features
- [ ] Export/download features are disabled
- [ ] Analytics/trends features are locked

### Database
- [ ] `subscriptionTier` = `"free"`
- [ ] `subscriptionStatus` = `"canceled"`
- [ ] `stripeSubscriptionId` retained (for reactivation)
- [ ] `subscriptionEndDate` shows cancellation date

---

## 🔍 Feature Access Matrix

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

## 🧰 Testing with Code

### Check Feature Access Programmatically

```typescript
import { checkFeatureAccess } from '@/lib/services/subscription';

// Test if user has access to a feature
const result = await checkFeatureAccess(userId, 'export');

console.log(`Has access: ${result.hasAccess}`);
console.log(`Tier: ${result.tier}`);
console.log(`Message: ${result.message}`);
```

### Available Features to Test

```typescript
const features = [
  'basic_map',      // Free tier
  'filters',        // Free tier
  'ad_free',        // Supporter tier
  'early_access',   // Supporter tier
  'priority_support', // Supporter tier
  'export',         // Pro tier
  'alerts',         // Pro tier
  'api_access',     // Pro tier
  'trends',         // Pro tier
  'reports',        // Pro tier
];
```

---

## 🔄 Test Re-upgrade

After downgrading, test upgrading again:

1. Go to `/pricing`
2. Click **"Subscribe Now"** on any tier
3. Complete checkout with test card `4242 4242 4242 4242`
4. Verify subscription is reactivated
5. Check premium features are accessible again

---

## 📊 Monitor Webhooks

Watch the webhook listener output for these events:

```bash
# Downgrade events
customer.subscription.updated    # Status change
customer.subscription.deleted    # Subscription canceled

# Re-upgrade events
customer.subscription.created    # New subscription
checkout.session.completed       # Payment succeeded
```

---

## 🐛 Common Issues

### Issue: Tier not updating after cancellation

**Cause**: Webhook not received or processed

**Fix**:
1. Check webhook listener is running
2. Verify webhook secret is correct
3. Check server logs for webhook errors
4. Re-send webhook from Stripe Dashboard

### Issue: Premium features still accessible

**Cause**: Feature access checks not implemented

**Fix**:
1. Add `checkFeatureAccess()` to protected routes
2. Update UI to hide premium features for free users
3. Add middleware to API endpoints

### Issue: "Manage Billing" button still visible

**Cause**: UI not checking subscription status

**Fix**:
```tsx
{user.subscriptionTier !== 'free' && (
  <Button onClick={handleManageBilling}>
    Manage Billing
  </Button>
)}
```

---

## 🚀 Automated Testing

Run the automated tests:

```bash
# Run subscription tests
npx playwright test tests/subscription-downgrade.spec.ts
```

---

## 📝 Test Script

Quick test script to verify downgrade:

```bash
#!/bin/bash

echo "Testing Subscription Downgrade..."
echo ""

# 1. Trigger downgrade
echo "1. Triggering subscription deletion..."
./stripe-cli/stripe.exe trigger customer.subscription.deleted

# 2. Wait for webhook
sleep 2

echo ""
echo "2. Verification steps:"
echo "   - Refresh /account page"
echo "   - Verify tier shows 'Free'"
echo "   - Try accessing premium feature"
echo "   - Should see 'Upgrade required' message"
echo ""
echo "✅ Downgrade test complete!"
```

---

## 💡 Tips

1. **Use test mode**: Always test with Stripe test keys
2. **Keep webhook listener running**: Essential for real-time updates
3. **Check both UI and API**: Ensure restrictions work on all levels
4. **Test edge cases**:
   - Downgrade during trial
   - Downgrade with pending invoice
   - Reactivate after cancellation
5. **Monitor logs**: Watch for webhook processing errors

---

## 🔗 Useful Links

- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Webhook Events**: https://dashboard.stripe.com/test/webhooks
- **Test Subscriptions**: https://dashboard.stripe.com/test/subscriptions
- **Test Cards**: https://stripe.com/docs/testing

---

## Next Steps

After verifying downgrade works:

1. ✅ Implement feature access controls in API routes
2. ✅ Add UI indicators for locked features
3. ✅ Create upgrade prompts throughout the app
4. ✅ Add analytics to track upgrade/downgrade patterns
5. ✅ Set up email notifications for subscription changes
