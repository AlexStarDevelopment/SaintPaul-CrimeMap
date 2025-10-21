'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '../hooks/useRequireAuth';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Palette as PaletteIcon,
  Star as StarIcon,
  CalendarMonth as CalendarIcon,
  Map as MapIcon,
  Dashboard as DashboardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { ThemeType } from '@/types';
import { themeMetadata } from '../constants/themes';
import { SUBSCRIPTION_TIERS } from '@/types';

export default function AccountPage() {
  const { session, loading: authLoading, authenticated } = useRequireAuth();
  const { update } = useSession();
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('light');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dashboardEnabled, setDashboardEnabled] = useState<boolean>(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    if (authenticated && session?.user?.theme) {
      setSelectedTheme(session.user.theme);
    } else {
      setSelectedTheme('light'); // Default to light theme
    }
  }, [authenticated, session]);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const res = await fetch('/api/feature-flags');
        if (res.ok) {
          const data = await res.json();
          setDashboardEnabled(Boolean(data.flags?.dashboard));
        } else {
          setDashboardEnabled(false);
        }
      } catch {
        setDashboardEnabled(false);
      }
    };
    loadFlags();
  }, []);

  useEffect(() => {
    // Check for checkout success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setCheckoutSuccess(true);
      // Update session to reflect new subscription
      update();
      // Clean URL
      window.history.replaceState({}, '', '/account');
    }
  }, [update]);

  const handleThemeChange = async (event: SelectChangeEvent<ThemeType>) => {
    const newTheme = event.target.value as ThemeType;
    setSelectedTheme(newTheme);
    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/user/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (response.ok) {
        setSaveMessage('Theme updated successfully!');
        // Update the session to reflect the new theme
        await update();
        // Reload to apply the new theme
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setSaveMessage('Failed to update theme. Please try again.');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      setSaveMessage('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe customer portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert(error instanceof Error ? error.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      router.push('/');
    } else if (dashboardEnabled && newValue === 1) {
      router.push('/dashboard');
    } else if (!dashboardEnabled && newValue === 1) {
      // If dashboard is disabled, tab 1 becomes account (this tab)
      // No navigation needed since we're already on account page
    } else if (dashboardEnabled && newValue === 2) {
      // If dashboard is enabled, tab 2 is account (this tab)
      // No navigation needed since we're already on account page
    }
  };

  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!authenticated || !session?.user) {
    return null;
  }

  const user = session.user;
  const subscriptionTier = SUBSCRIPTION_TIERS[user.subscriptionTier || 'free'];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Navigation Tabs */}
      <Paper sx={{ borderRadius: 0 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            <IconButton onClick={() => router.push('/')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Tabs value={dashboardEnabled ? 2 : 1} onChange={handleTabChange} sx={{ flexGrow: 1 }}>
              <Tab icon={<MapIcon />} label="Map" iconPosition="start" />
              {dashboardEnabled && (
                <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
              )}
              <Tab icon={<PersonIcon />} label="Account" iconPosition="start" />
            </Tabs>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Account Settings
          </Typography>
        </Box>

        {checkoutSuccess && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setCheckoutSuccess(false)}>
            Welcome to your subscription! Your trial has started and you now have access to all
            premium features.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography
                variant="h6"
                gutterBottom
                component="div"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <PersonIcon /> Profile Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={user.image || undefined}
                  alt={user.name || 'User'}
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user.name || 'User'}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Subscription Details */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography
                variant="h6"
                gutterBottom
                component="div"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <StarIcon /> Subscription Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Current Plan
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={subscriptionTier?.name || 'Free'}
                    color={
                      (user.subscriptionTier || 'free') === 'pro'
                        ? 'primary'
                        : (user.subscriptionTier || 'free') === 'supporter'
                          ? 'secondary'
                          : 'default'
                    }
                    variant="filled"
                  />
                  <Typography variant="body1">${subscriptionTier?.price || 0}/month</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={user.subscriptionStatus || 'active'}
                  color={(user.subscriptionStatus || 'active') === 'active' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>

              {user.subscriptionEndDate && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    component="div"
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {user.subscriptionStatus === 'canceled' ? 'Subscription Ends On' : 'Renews On'}
                  </Typography>
                  <Typography variant="body2">
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </Typography>
                  {user.subscriptionStatus === 'canceled' && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                      Your subscription has been canceled and will end on this date.
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Features
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(subscriptionTier?.features || []).map((feature, index) => (
                    <Chip key={index} label={feature} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {(user.subscriptionTier === 'free' || !user.subscriptionTier) && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push('/pricing')}
                    fullWidth
                  >
                    Upgrade Plan
                  </Button>
                )}
                {user.subscriptionTier && user.subscriptionTier !== 'free' && (
                  <>
                    <Button
                      variant="contained"
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      sx={{ flex: 1 }}
                    >
                      {portalLoading ? 'Loading...' : 'Manage Billing'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => router.push('/pricing')}
                      sx={{ flex: 1 }}
                    >
                      Change Plan
                    </Button>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Theme Settings */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                component="div"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <PaletteIcon /> Theme Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="theme-select-label">Select Theme</InputLabel>
                    <Select
                      labelId="theme-select-label"
                      value={selectedTheme}
                      label="Select Theme"
                      onChange={handleThemeChange}
                      disabled={saving}
                    >
                      {Object.entries(themeMetadata).map(([key, meta]) => (
                        <MenuItem key={key} value={key}>
                          <Box>
                            <Typography variant="body1">{meta.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {meta.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  {saveMessage && (
                    <Alert severity={saveMessage.includes('success') ? 'success' : 'error'}>
                      {saveMessage}
                    </Alert>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Your selected theme will be applied across the entire application and saved to
                  your account. The theme will persist across sessions and devices when you sign in.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
