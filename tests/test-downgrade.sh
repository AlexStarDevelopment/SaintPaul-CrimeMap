#!/bin/bash

# Test script for subscription downgrade

echo "Testing subscription downgrade flow..."
echo ""

# Trigger subscription deletion event
echo "1. Triggering customer.subscription.deleted event..."
./stripe-cli/stripe.exe trigger customer.subscription.deleted

echo ""
echo "✅ Downgrade event triggered!"
echo ""
echo "To verify:"
echo "1. Check the webhook listener output for the event"
echo "2. Refresh the /account page"
echo "3. User should now be on Free tier"
echo "4. Premium features should be disabled"
