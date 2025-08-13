'use client';

import { signIn } from 'next-auth/react';
import { Button, Card, CardContent, Typography, Box, TextField, Alert } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setError('Failed to sign in. Please check your email.');
      } else if (result?.url) {
        router.push('/auth/verify-request');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Sign in to access premium features
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleEmailSignIn} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mb: 2 }}>
              {loading ? 'Sending...' : 'Sign in with Email'}
            </Button>
          </Box>

          <Box sx={{ position: 'relative', mb: 3 }}>
            <Typography
              variant="body2"
              align="center"
              sx={{
                position: 'relative',
                backgroundColor: 'background.paper',
                px: 2,
                display: 'inline-block',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              or
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 1,
                bgcolor: 'divider',
                zIndex: -1,
              }}
            />
          </Box>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            startIcon={<FontAwesomeIcon icon={faGoogle} />}
            sx={{ mb: 2 }}
          >
            Sign in with Google
          </Button>

          <Typography variant="body2" color="text.secondary" align="center">
            By signing in, you agree to our terms of service and privacy policy.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
