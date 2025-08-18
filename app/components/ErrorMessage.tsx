'use client';

import { Alert, AlertTitle, Box, Button, Collapse, IconButton, Typography } from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
} from '@mui/icons-material';
import { useState } from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  showDetails?: boolean;
  details?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  severity = 'error',
  showDetails = false,
  details,
  onRetry,
  retryLabel = 'Try Again',
  className,
}: ErrorMessageProps) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      case 'success':
        return <CheckCircle />;
      default:
        return <ErrorIcon />;
    }
  };

  const getTitle = () => {
    if (title) return title;

    switch (severity) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      case 'success':
        return 'Success';
      default:
        return 'Error';
    }
  };

  return (
    <Box className={className} sx={{ my: 2 }}>
      <Alert
        severity={severity}
        icon={getIcon()}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {onRetry && (
              <Button
                color="inherit"
                size="small"
                onClick={onRetry}
                startIcon={<Refresh />}
                variant="outlined"
              >
                {retryLabel}
              </Button>
            )}
            {showDetails && details && (
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setExpanded(!expanded)}
                aria-label="show details"
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        }
      >
        <AlertTitle>{getTitle()}</AlertTitle>
        <Typography variant="body2">{message}</Typography>

        {showDetails && details && (
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              >
                {details}
              </Typography>
            </Box>
          </Collapse>
        )}
      </Alert>
    </Box>
  );
}

// Predefined error messages for common scenarios
export const CommonErrors = {
  networkError: () => (
    <ErrorMessage
      title="Connection Problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
      severity="warning"
    />
  ),

  loadingError: (retryFn?: () => void) => (
    <ErrorMessage
      title="Loading Failed"
      message="Failed to load data. This might be a temporary issue."
      severity="error"
      onRetry={retryFn}
    />
  ),

  authenticationError: () => (
    <ErrorMessage
      title="Authentication Required"
      message="Please sign in to access this feature."
      severity="info"
    />
  ),

  permissionError: () => (
    <ErrorMessage
      title="Access Denied"
      message="You don't have permission to access this resource."
      severity="warning"
    />
  ),

  notFoundError: (resource: string = 'Resource') => (
    <ErrorMessage
      title="Not Found"
      message={`${resource} could not be found. It may have been deleted or moved.`}
      severity="info"
    />
  ),

  validationError: (fieldName: string) => (
    <ErrorMessage
      title="Invalid Input"
      message={`Please check the ${fieldName} field and try again.`}
      severity="warning"
    />
  ),
};

export default ErrorMessage;
