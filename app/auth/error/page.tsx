'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error starting the OAuth sign-in flow. Please try again.';
      case 'OAuthCallback':
        return 'Error handling the OAuth callback. Please try again.';
      case 'OAuthCreateAccount':
        return 'Could not create user account. Please try again.';
      case 'EmailCreateAccount':
        return 'Could not create user account. Please try again.';
      case 'Callback':
        return 'Error in the authentication callback. Please try again.';
      case 'Default':
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom color="error">
            Authentication Error
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {getErrorMessage()}
          </Typography>
          {error && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Error code: {error}
            </Typography>
          )}
          <Button
            component={Link}
            href="/auth/signin"
            variant="contained"
            color="primary"
            fullWidth
          >
            Back to Sign In
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
