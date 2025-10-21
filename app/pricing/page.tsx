'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import toast from 'react-hot-toast';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/types/user';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (status !== 'authenticated') {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    if (tier === 'free') {
      router.push('/');
      return;
    }

    setLoading(tier);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
      setLoading(null);
    }
  };

  const currentTier = session?.user?.subscriptionTier || 'free';

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Start with a 7-day free trial. Cancel anytime.
        </Typography>
        {status === 'authenticated' && (
          <Chip
            label={`Current: ${SUBSCRIPTION_TIERS[currentTier].name}`}
            color="primary"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {(
          Object.entries(SUBSCRIPTION_TIERS) as [
            SubscriptionTier,
            (typeof SUBSCRIPTION_TIERS)[SubscriptionTier],
          ][]
        ).map(([tier, info]) => {
          const isCurrent = tier === currentTier;
          const isPopular = tier === 'supporter';

          return (
            <Card
              key={tier}
              sx={{
                position: 'relative',
                border: isPopular ? '2px solid' : '1px solid',
                borderColor: isPopular ? 'primary.main' : 'divider',
                transform: isPopular ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: isPopular ? 'scale(1.08)' : 'scale(1.03)',
                },
              }}
            >
              {isPopular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                  }}
                />
              )}

              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {info.name}
                </Typography>

                <Box sx={{ my: 3 }}>
                  <Typography variant="h3" component="span" sx={{ fontWeight: 'bold' }}>
                    ${info.price}
                  </Typography>
                  <Typography variant="h6" component="span" color="text.secondary">
                    /month
                  </Typography>
                </Box>

                {tier !== 'free' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    7-day free trial included
                  </Alert>
                )}

                <List dense>
                  {info.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant={isPopular ? 'contained' : 'outlined'}
                  fullWidth
                  size="large"
                  disabled={isCurrent || loading === tier}
                  onClick={() => handleSubscribe(tier)}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : loading === tier
                      ? 'Loading...'
                      : tier === 'free'
                        ? 'Get Started'
                        : 'Start 7-Day Free Trial'}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          All plans include access to the Saint Paul Crime Map with real-time data updates.
        </Typography>
      </Box>
    </Container>
  );
}
