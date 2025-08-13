'use client';

import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

export default function VerifyRequestPage() {
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
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <FontAwesomeIcon icon={faEnvelope} size="3x" color="#1976d2" />
          </Box>

          <Typography variant="h4" gutterBottom>
            Check your email
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            A sign in link has been sent to your email address. Click the link to sign in to your
            account.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            If you don&apos;t see the email, check your spam folder or request a new link.
          </Typography>

          <Button variant="outlined" onClick={() => router.push('/auth/signin')}>
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
