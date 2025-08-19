'use client';

import { signIn } from 'next-auth/react';
import { Button, Card, CardContent, Typography, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';

export default function SignInPage() {
  const router = useRouter();

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => router.push('/')}
              sx={{ color: 'text.secondary' }}
            >
              Return to Map
            </Button>
          </Box>
          
          <Typography variant="h4" gutterBottom align="center">
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Sign in to access personalized features and save your preferences
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            startIcon={<FontAwesomeIcon icon={faGoogle} />}
            sx={{ mb: 3, py: 1.5 }}
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
