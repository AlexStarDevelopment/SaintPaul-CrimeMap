'use client';

import { useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Alert,
  Stack
} from '@mui/material';
import { ErrorOutline, Home, Refresh } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const theme = useTheme();

  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[8],
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
            <ErrorOutline
              sx={{
                fontSize: { xs: 60, sm: 80 },
                color: theme.palette.error.main,
                mb: 2,
              }}
            />
            
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              Oops! Something went wrong
            </Typography>
            
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              We encountered an unexpected error while loading this page.
            </Typography>

            {process.env.NODE_ENV === 'development' && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2" component="div">
                  <strong>Error:</strong> {error.message}
                </Typography>
                {error.digest && (
                  <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                    <strong>Error ID:</strong> {error.digest}
                  </Typography>
                )}
              </Alert>
            )}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={reset}
                size="large"
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.5, sm: 2 },
                }}
              >
                Try Again
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={handleGoHome}
                size="large"
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.5, sm: 2 },
                }}
              >
                Go Home
              </Button>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 4, fontStyle: 'italic' }}
            >
              If this problem persists, please contact support or try refreshing the page.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}