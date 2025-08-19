import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Shield as ShieldIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { SavedLocation, Crime } from '@/types';

interface LocationCardProps {
  location: SavedLocation;
  period: '7d' | '30d' | '90d';
}

export default function LocationCard({ location, period }: LocationCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [safetyScore, setSafetyScore] = useState(0);
  const [totalCrimes, setTotalCrimes] = useState(0);
  const [percentChange, setPercentChange] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    const fetchLocationData = async () => {
      if (!location._id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch both stats and safety score in parallel
        const [statsResponse, safetyResponse] = await Promise.all([
          fetch(`/api/dashboard/stats?locationId=${location._id}&period=${period}`),
          fetch(`/api/dashboard/safety-score?locationId=${location._id}`),
        ]);

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch location stats');
        }

        if (!safetyResponse.ok) {
          throw new Error('Failed to fetch safety score');
        }

        const statsData = await statsResponse.json();
        const safetyData = await safetyResponse.json();

        // Update state with real data
        setTotalCrimes(statsData.stats.totalCrimes);
        setPercentChange(statsData.stats.trendsData.percentChange);
        setTrend(statsData.stats.trendsData.direction);
        setSafetyScore(safetyData.safetyScore.score);
      } catch (err: any) {
        console.error('Error fetching location data:', err);
        setError(err.message);
        // Fall back to mock data on error
        setSafetyScore(78);
        setTotalCrimes(24);
        setPercentChange(-5);
        setTrend('down');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [location._id, period]); // Re-fetch when location or period changes

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getSafetyLabel = (score: number) => {
    if (score >= 80) return 'Safe';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Caution';
    return 'High Risk';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: 'error.main' }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: 'success.main' }} />;
      default:
        return <TrendingFlatIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const periodLabel = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
  }[period];

  if (loading) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}. Showing sample data.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              gutterBottom
              component="div"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LocationIcon />
              {location.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {location.address}
            </Typography>
          </Box>
          <Chip label={periodLabel} size="small" variant="outlined" />
        </Box>

        <Grid container spacing={3}>
          {/* Safety Score */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${getSafetyColor(safetyScore)}.light`,
                    border: 3,
                    borderColor: `${getSafetyColor(safetyScore)}.main`,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    {safetyScore}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="subtitle2" gutterBottom>
                Safety Score
              </Typography>
              <Chip
                icon={<ShieldIcon />}
                label={getSafetyLabel(safetyScore)}
                color={getSafetyColor(safetyScore)}
                size="small"
              />
            </Box>
          </Grid>

          {/* Total Crimes */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                {totalCrimes}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Total Crimes
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Within {location.radius} mile{location.radius !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Grid>

          {/* Trend */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 1,
                }}
              >
                {getTrendIcon()}
                <Typography variant="h4" fontWeight="bold">
                  {Math.abs(percentChange)}%
                </Typography>
              </Box>
              <Typography variant="subtitle2" color="text.secondary">
                vs Previous Period
              </Typography>
              <Chip
                label={trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
                color={trend === 'down' ? 'success' : trend === 'up' ? 'error' : 'default'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Safety Level
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {safetyScore}/100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={safetyScore}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: `${getSafetyColor(safetyScore)}.main`,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
