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
import { useCrimeData } from '../../contexts/CrimeDataContext';

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
  const { crimeData, getCrimesForLocation } = useCrimeData();

  useEffect(() => {
    const calculateLocationData = () => {
      if (!location.coordinates.lat || !location.coordinates.lng) {
        setLoading(false);
        return;
      }

      if (crimeData.isLoading) {
        setLoading(true);
        return;
      }

      if (!crimeData.items.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get crimes within radius of the location (convert miles to km)
        const radiusKm = (location.radius || 1.0) * 1.609344;
        const localCrimes = getCrimesForLocation(
          location.coordinates.lat,
          location.coordinates.lng,
          radiusKm
        );

        // Filter by time period relative to the most recent data
        // Find the most recent crime date in the dataset
        const allDates = localCrimes
          .map((crime) => parseInt(crime.DATE || '0'))
          .filter((date) => date > 0);
        const mostRecentDate = Math.max(...allDates);
        const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const cutoffTime = mostRecentDate - daysAgo * 24 * 60 * 60 * 1000;

        const currentPeriodCrimes = localCrimes.filter((crime) => {
          if (!crime.DATE) return false;
          return parseInt(crime.DATE) >= cutoffTime;
        });

        // Calculate previous period for trend
        const previousCutoffTime = cutoffTime - daysAgo * 24 * 60 * 60 * 1000;
        const previousPeriodCrimes = localCrimes.filter((crime) => {
          if (!crime.DATE) return false;
          const crimeTime = parseInt(crime.DATE);
          return crimeTime >= previousCutoffTime && crimeTime < cutoffTime;
        });

        const currentCount = currentPeriodCrimes.length;
        const previousCount = previousPeriodCrimes.length;

        // Calculate trend
        let calculatedTrend: 'up' | 'down' | 'stable' = 'stable';
        let calculatedPercentChange = 0;

        if (previousCount > 0) {
          calculatedPercentChange = Math.round(
            ((currentCount - previousCount) / previousCount) * 100
          );
          if (calculatedPercentChange > 5) {
            calculatedTrend = 'up';
          } else if (calculatedPercentChange < -5) {
            calculatedTrend = 'down';
          }
        } else if (currentCount > 0) {
          calculatedTrend = 'up';
          calculatedPercentChange = 100;
        }

        // Calculate safety score (inverse relationship with crime count)
        // Higher crime count = lower safety score
        const maxExpectedCrimes = 50; // Adjust based on your data
        const crimeRatio = Math.min(currentCount / maxExpectedCrimes, 1);
        const calculatedSafetyScore = Math.max(10, Math.round((1 - crimeRatio) * 100));

        setTotalCrimes(currentCount);
        setPercentChange(Math.abs(calculatedPercentChange));
        setTrend(calculatedTrend);
        setSafetyScore(calculatedSafetyScore);
      } catch (err: any) {
        console.error('Error calculating location data:', err);
        setError(err.message);
        setSafetyScore(0);
        setTotalCrimes(0);
        setPercentChange(0);
        setTrend('stable');
      } finally {
        setLoading(false);
      }
    };

    calculateLocationData();
  }, [
    location.coordinates.lat,
    location.coordinates.lng,
    location.radius,
    period,
    crimeData.items,
    crimeData.isLoading,
    getCrimesForLocation,
  ]);

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
    '7d': 'Past 7 Days',
    '30d': 'Past 30 Days',
    '90d': 'Past 90 Days',
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
