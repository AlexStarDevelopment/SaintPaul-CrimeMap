'use client';

import { Box, Container, Typography, Button, Card, CardContent, Stack } from '@mui/material';
import { SearchOff, Home, ArrowBack } from '@mui/icons-material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            textAlign: 'center',
            backgroundColor: 'background.paper',
            boxShadow: 8,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 6 } }}>
            <SearchOff
              sx={{
                fontSize: { xs: 60, sm: 80 },
                color: 'text.secondary',
                mb: 2,
              }}
            />

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
                fontWeight: 'bold',
                color: 'primary.main',
                lineHeight: 1,
                mb: 1,
              }}
            >
              404
            </Typography>

            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: 'text.primary',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              }}
            >
              Page Not Found
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: 4,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                component={Link}
                href="/"
                variant="contained"
                startIcon={<Home />}
                size="large"
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.5, sm: 2 },
                }}
              >
                Go Home
              </Button>

              <Button
                onClick={() => window.history.back()}
                variant="outlined"
                startIcon={<ArrowBack />}
                size="large"
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.5, sm: 2 },
                }}
              >
                Go Back
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
              Looking for crime data? Visit our{' '}
              <Link href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>
                interactive crime map
              </Link>{' '}
              or{' '}
              <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'underline' }}>
                dashboard
              </Link>
              .
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
