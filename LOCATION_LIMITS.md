# Location Limits by Subscription Tier

This document explains how location limits work when users upgrade or downgrade their subscription.

## Tier Limits

| Tier | Max Locations |
|------|---------------|
| Free | 2 |
| Supporter | 5 |
| Pro | Unlimited |

## How It Works

### When Creating New Locations

The system checks the user's current tier and prevents them from exceeding their limit:

```typescript
// Example: Free tier user tries to add 3rd location
POST /api/locations
// Returns: 400 - "Location limit reached for free tier (2 locations)"
```

### When Viewing Locations

Users only see locations within their current tier limit:

- **Free tier**: Sees only their first 2 locations (oldest first)
- **Supporter tier**: Sees only their first 5 locations (oldest first)
- **Pro tier**: Sees all locations

### When Downgrading

**Automatic Location Management:**

When a user downgrades (Pro → Supporter, Supporter → Free, Pro → Free):

1. ✅ **Keep** the oldest locations (by creation date) up to the new limit
2. 🔒 **Disable** all locations beyond the new limit
3. 📊 **Log** the action for tracking

**Example Scenario:**

```
User has 8 locations as Pro tier:
1. Home (created Jan 1)
2. Work (created Jan 5)
3. Gym (created Jan 10)
4. School (created Jan 15)
5. Park (created Jan 20)
6. Mall (created Jan 25)
7. Friend's House (created Jan 30)
8. Restaurant (created Feb 1)

User downgrades to Supporter (limit: 5)
→ Keeps: #1-5 (oldest 5)
→ Disables: #6-8 (marked isActive: false)

User downgrades further to Free (limit: 2)
→ Keeps: #1-2 (oldest 2)
→ Disables: #3-8 (marked isActive: false)
```

## Technical Implementation

### 1. Location Retrieval with Tier Enforcement

```typescript
// lib/services/locations.ts
export const getUserLocations = async (
  userId: string,
  userTier?: SubscriptionTier
): Promise<SavedLocation[]> => {
  // Fetches locations and applies tier-based limits
  // Returns only locations within user's current tier limit
}
```

### 2. Downgrade Handler

```typescript
// lib/services/locations.ts
export const handleTierDowngrade = async (
  userId: string,
  newTier: SubscriptionTier
): Promise<{ keptCount: number; disabledCount: number }> => {
  // Automatically disables excess locations when tier changes
  // Called from webhook handlers when subscription updates
}
```

### 3. Webhook Integration

```typescript
// app/api/webhooks/stripe/route.ts
async function handleSubscriptionUpdated(subscription) {
  // Detect downgrade
  if (isDowngrade) {
    await handleTierDowngrade(user._id, finalTier);
  }
}
```

## Data Preservation

**Important**: Disabled locations are NOT deleted. They are marked as `isActive: false`.

This means:
- ✅ Data is preserved if user upgrades again
- ✅ User doesn't lose their configured addresses/alerts
- ✅ Re-enabling is instant upon upgrade
- ❌ Disabled locations don't show in dashboard
- ❌ Disabled locations don't trigger alerts

## Re-enabling Locations on Upgrade

When a user upgrades to a higher tier:

1. Disabled locations become available again
2. User can manually re-enable them from the dashboard
3. OR system can auto-enable up to the new limit

**Current Behavior**: Locations remain disabled until user manually re-enables them.

**Future Enhancement**: Auto-enable disabled locations when upgrading, up to the new tier limit.

## UI Indicators

### Dashboard Display

**Free Tier** (2/2 locations):
```
✓ Home (Active)
✓ Work (Active)
```

**After Downgrade from Pro** (showing 2 of 8):
```
✓ Home (Active)
✓ Work (Active)
🔒 3 locations hidden due to tier limit
   [Upgrade to Supporter to access 5 locations]
   [Upgrade to Pro for unlimited locations]
```

## Testing Downgrade Behavior

### Manual Test

1. **Create multiple locations as Pro user**:
   - Create 8+ locations

2. **Downgrade to Supporter**:
   - Go to Customer Portal → Cancel subscription
   - OR trigger: `stripe trigger customer.subscription.updated`

3. **Verify behavior**:
   - Dashboard shows only 5 locations (oldest)
   - API returns only 5 locations
   - Other 3 locations are disabled in database

4. **Downgrade to Free**:
   - Repeat cancellation process

5. **Verify behavior**:
   - Dashboard shows only 2 locations
   - API returns only 2 locations
   - Other 6 locations are disabled in database

### Automated Test

```bash
# Run location limit tests
npx playwright test tests/location-limits.spec.ts
```

## Database Schema

Disabled locations in MongoDB:

```javascript
{
  "_id": ObjectId("..."),
  "userId": "user123",
  "label": "Gym",
  "isActive": false,  // ← Marked as inactive
  "createdAt": ISODate("2025-01-10T..."),
  "updatedAt": ISODate("2025-01-15T...")  // ← Updated when disabled
}
```

## API Responses

### GET /api/locations (Free tier with 8 total locations)

```json
{
  "locations": [
    {
      "_id": "...",
      "label": "Home",
      "isActive": true
    },
    {
      "_id": "...",
      "label": "Work",
      "isActive": true
    }
  ]
}
```

**Note**: Only 2 locations returned, even though 8 exist in the database.

## Logs

Watch for these log messages during downgrade:

```bash
# In webhook listener output
Tier downgrade: disabled 3 locations, kept 5

# In server logs
Disabled excess locations on tier downgrade
  userId: "user123"
  newTier: "supporter"
  limit: 5
  totalLocations: 8
  disabledCount: 3
```

## Migration Notes

**For Existing Users:**

If you're deploying this to production with existing users who have exceeded limits:

1. Run a migration script to audit all users
2. Disable excess locations for users already over their tier limit
3. Notify affected users about the change

**Migration Script** (example):

```typescript
// scripts/migrate-location-limits.ts
import { getUserById, updateUserSubscription } from '@/lib/services/users';
import { handleTierDowngrade } from '@/lib/services/locations';

async function migrateLocationLimits() {
  // Fetch all users
  // For each user:
  //   - Check their tier
  //   - Check their location count
  //   - If over limit, call handleTierDowngrade
}
```

## Future Enhancements

1. **User Choice**: Let users select which locations to keep when downgrading
2. **Auto Re-enable**: Auto-enable disabled locations when upgrading
3. **Notification**: Email users when locations are disabled due to downgrade
4. **Grace Period**: Give users 7 days to choose locations before auto-disabling
5. **Location Priority**: Let users mark priority locations that are kept first

## Support

**User Questions:**

Q: *"I downgraded and lost my locations. Are they deleted?"*
A: No, they're just hidden. Upgrade again to access them.

Q: *"Can I choose which locations to keep?"*
A: Currently no, the system keeps your oldest locations. This may be added in the future.

Q: *"What happens if I upgrade again?"*
A: Your disabled locations are still in your account. You can re-enable them from the dashboard.
