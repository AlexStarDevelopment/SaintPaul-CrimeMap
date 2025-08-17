'use client';

import { 
  Box, 
  CircularProgress, 
  Typography, 
  LinearProgress,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  variant?: 'circular' | 'linear' | 'skeleton';
  fullScreen?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
}

export function LoadingSpinner({
  size = 'medium',
  message,
  variant = 'circular',
  fullScreen = false,
  color = 'primary',
}: LoadingSpinnerProps) {
  const theme = useTheme();

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 40;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  const containerSx = fullScreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: theme.zIndex.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        p: 3,
      };

  if (variant === 'skeleton') {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (variant === 'linear') {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        {message && (
          <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
            {message}
          </Typography>
        )}
        <LinearProgress color={color} />
      </Box>
    );
  }

  return (
    <Box sx={containerSx}>
      <CircularProgress size={getSizeValue()} color={color} />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            textAlign: 'center',
            maxWidth: 300,
            fontSize: size === 'small' ? '0.875rem' : '1rem'
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

// Predefined loading states for common scenarios
export const CommonLoadingStates = {
  pageLoading: () => (
    <LoadingSpinner
      size="large"
      message="Loading page..."
      fullScreen
    />
  ),
  
  dataLoading: () => (
    <LoadingSpinner
      size="medium"
      message="Loading data..."
    />
  ),
  
  submitting: () => (
    <LoadingSpinner
      size="small"
      message="Submitting..."
      variant="linear"
    />
  ),
  
  crimeDataLoading: () => (
    <LoadingSpinner
      size="medium"
      message="Loading crime data from Saint Paul..."
    />
  ),
  
  mapLoading: () => (
    <LoadingSpinner
      size="large"
      message="Preparing interactive map..."
    />
  ),
  
  dashboardLoading: () => (
    <LoadingSpinner
      variant="skeleton"
    />
  ),
  
  authenticating: () => (
    <LoadingSpinner
      size="medium"
      message="Signing you in..."
      variant="linear"
    />
  ),
};

// Card-based loading component for content areas
export function LoadingCard({ 
  title = "Loading...", 
  height = 200 
}: { 
  title?: string; 
  height?: number;
}) {
  return (
    <Card>
      <CardContent>
        <Box 
          sx={{ 
            height, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default LoadingSpinner;