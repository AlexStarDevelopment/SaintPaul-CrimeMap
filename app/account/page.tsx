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
import { ThemeType } from '../models/user';
import { themeMetadata } from '../constants/themes';
import { SUBSCRIPTION_TIERS } from '../models/user';

export default function AccountPage() {
  const { session, loading: authLoading, authenticated } = useRequireAuth();
  const { update } = useSession();
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('light');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated && session?.user?.theme) {
      setSelectedTheme(session.user.theme);
    } else {
      setSelectedTheme('light'); // Default to light theme
    }
  }, [authenticated, session]);

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      router.push('/');
    } else if (newValue === 1) {
      router.push('/dashboard');
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
            <Tabs value={2} onChange={handleTabChange} sx={{ flexGrow: 1 }}>
              <Tab icon={<MapIcon />} label="Map" iconPosition="start" />
              <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
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

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  User ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {user.id}
                </Typography>
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
                    Renews On
                  </Typography>
                  <Typography variant="body2">
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </Typography>
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

          {/* Theme Preview Cards */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Theme Previews
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(themeMetadata).map(([key, meta]) => (
                <Grid item xs={12} sm={6} md={3} key={key}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      border: selectedTheme === key ? 2 : 1,
                      borderColor: selectedTheme === key ? 'primary.main' : 'divider',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                    onClick={() =>
                      handleThemeChange({
                        target: { value: key },
                      } as SelectChangeEvent<ThemeType>)
                    }
                  >
                    <CardContent>
                      <Box
                        sx={{
                          height: 60,
                          mb: 2,
                          borderRadius: 1,
                          background:
                            key === 'light'
                              ? 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)'
                              : key === 'dark'
                                ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
                                : key === 'sage'
                                  ? 'linear-gradient(135deg, #1e2e2e 0%, #263838 100%)'
                                  : 'linear-gradient(135deg, #1a1f2e 0%, #232937 100%)',
                        }}
                      />
                      <Typography variant="subtitle1" fontWeight="bold">
                        {meta.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {meta.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
