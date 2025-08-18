'use client';

import React, { Component, ReactNode } from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component to catch and display errors gracefully
 * @component
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId: 'unknown', // Could be populated from session
    };

    console.error('Error caught by boundary:', errorDetails);

    // TODO: Send error to monitoring service (e.g., Sentry, LogRocket)
    // if (process.env.NODE_ENV === 'production') {
    //   captureException(error, {
    //     extra: errorInfo,
    //     tags: { boundary: 'ErrorBoundary' },
    //     user: { id: userId }
    //   });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              mt: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="error">
                Something went wrong
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                We encountered an unexpected error. Please try refreshing the page.
              </Typography>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    fontFamily: 'monospace',
                    textAlign: 'left',
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
                <Button variant="outlined" onClick={this.handleReset}>
                  Try Again
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
