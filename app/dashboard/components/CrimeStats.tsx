import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { SavedLocation } from '@/types';
import { SubscriptionTier } from '@/types';
import { useCrimeData } from '../../contexts/CrimeDataContext';

interface CrimeStatsProps {
  location: SavedLocation;
  userTier: SubscriptionTier;
}

type PeriodType = '7d' | '30d' | '90d' | '1y';

interface CrimeTypeStat {
  type: string;
  count: number;
  percentage: number;
}

interface StatsShape {
  crimeTypes: CrimeTypeStat[];
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  topIncident: string;
  safestTime: string;
  riskiestTime: string;
}

export default function CrimeStats({ location, userTier }: CrimeStatsProps) {
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { crimeData, getCrimesForLocation, getCrimeStats } = useCrimeData();

  const handlePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: PeriodType | null
  ) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  // Check what periods are available for user tier
  const availablePeriods: Record<SubscriptionTier, PeriodType[]> = {
    free: ['7d'],
    supporter: ['7d', '30d'],
    pro: ['7d', '30d', '90d', '1y'],
  };

  const canAccessPeriod = (p: PeriodType) => availablePeriods[userTier].includes(p);

  useEffect(() => {
    const calculateStats = () => {
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
        // Get crimes within the location's saved radius (convert miles to km)
        const radiusKm = location.radius * 1.609344; // Convert miles to kilometers
        const localCrimes = getCrimesForLocation(
          location.coordinates.lat,
          location.coordinates.lng,
          radiusKm
        );

        // Filter by time period relative to the most recent data
        const allDates = localCrimes
          .map((crime) => parseInt(crime.DATE || '0'))
          .filter((date) => date > 0);
        const mostRecentDate = allDates.length > 0 ? Math.max(...allDates) : Date.now();
        const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        const cutoffTime = mostRecentDate - daysAgo * 24 * 60 * 60 * 1000;

        const filteredCrimes = localCrimes.filter((crime) => {
          if (!crime.DATE) return false;
          return parseInt(crime.DATE) >= cutoffTime;
        });

        // Calculate statistics using shared function
        const crimeStats = getCrimeStats(filteredCrimes);

        // Transform to component format
        const crimeTypes = Object.entries(crimeStats.crimesByType)
          .map(([type, count]) => ({
            type,
            count,
            percentage:
              crimeStats.totalCrimes > 0 ? Math.round((count / crimeStats.totalCrimes) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count);

        const topIncident = crimeTypes.length > 0 ? crimeTypes[0].type : 'None';

        // Calculate time distribution percentages
        const timeStats = crimeStats.crimesByTimeOfDay;
        const totalTimeEntries = Object.values(timeStats).reduce((sum, count) => sum + count, 0);

        const timeDistribution = {
          morning:
            totalTimeEntries > 0
              ? Math.round(((timeStats.morning || 0) / totalTimeEntries) * 100)
              : 0,
          afternoon:
            totalTimeEntries > 0
              ? Math.round(((timeStats.afternoon || 0) / totalTimeEntries) * 100)
              : 0,
          evening:
            totalTimeEntries > 0
              ? Math.round(((timeStats.evening || 0) / totalTimeEntries) * 100)
              : 0,
          night:
            totalTimeEntries > 0
              ? Math.round(((timeStats.night || 0) / totalTimeEntries) * 100)
              : 0,
        };

        // Find safest and riskiest times
        const timeEntries = Object.entries(timeStats);
        const sortedByCount = timeEntries.sort(([, a], [, b]) => a - b);
        const safestTime = sortedByCount[0] ? formatTimeOfDay(sortedByCount[0][0]) : 'Morning';
        const riskiestTime = sortedByCount[sortedByCount.length - 1]
          ? formatTimeOfDay(sortedByCount[sortedByCount.length - 1][0])
          : 'Evening';

        setStats({
          crimeTypes,
          timeDistribution,
          topIncident,
          safestTime,
          riskiestTime,
        });
      } catch (err: any) {
        console.error('Error calculating stats:', err);
        setError(err.message);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [
    location.coordinates.lat,
    location.coordinates.lng,
    location.radius,
    period,
    crimeData.items,
    crimeData.isLoading,
    getCrimesForLocation,
    getCrimeStats,
  ]);

  // Helper function to format time of day
  const formatTimeOfDay = (timeOfDay: string): string => {
    switch (timeOfDay) {
      case 'morning':
        return '6 AM - 12 PM';
      case 'afternoon':
        return '12 PM - 6 PM';
      case 'evening':
        return '6 PM - 10 PM';
      case 'night':
        return '10 PM - 6 AM';
      default:
        return timeOfDay;
    }
  };

  if (!stats) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography>Loading statistics...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Header with Period Selector */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <AssessmentIcon />
          Crime Statistics
        </Typography>
        <ToggleButtonGroup value={period} exclusive onChange={handlePeriodChange} size="small">
          <ToggleButton value="7d" disabled={!canAccessPeriod('7d')}>
            7D
          </ToggleButton>
          <ToggleButton value="30d" disabled={!canAccessPeriod('30d')}>
            30D
          </ToggleButton>
          <ToggleButton value="90d" disabled={!canAccessPeriod('90d')}>
            90D
          </ToggleButton>
          <ToggleButton value="1y" disabled={!canAccessPeriod('1y')}>
            1Y
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}. Showing sample data.
        </Alert>
      )}

      {/* Upgrade prompt for free users */}
      {userTier === 'free' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upgrade to Supporter or Pro to access longer time periods and detailed analytics
        </Alert>
      )}

      {loading ? (
        <Box>
          <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} />
        </Box>
      ) : (
        <>
          {/* Crime Type Breakdown */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Crime Type Breakdown
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {stats.crimeTypes.map((crime) => (
                <Box key={crime.type}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2">{crime.type}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {crime.count} ({crime.percentage}%)
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      backgroundColor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${crime.percentage}%`,
                        height: '100%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Key Insights */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Most Common Crime
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  component="div"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <WarningIcon fontSize="small" color="warning" />
                  {stats.topIncident}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Safest Time
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {stats.safestTime}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Riskiest Time
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {stats.riskiestTime}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Time Period
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  component="div"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <CalendarIcon fontSize="small" />
                  {period === '7d'
                    ? 'Past 7 Days'
                    : period === '30d'
                      ? 'Past 30 Days'
                      : period === '90d'
                        ? 'Past 90 Days'
                        : 'Past Year'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Time Distribution (Pro only) */}
          {userTier === 'pro' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Time of Day Distribution
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 1,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" display="block">
                      Morning
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.timeDistribution.morning}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 1,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" display="block">
                      Afternoon
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.timeDistribution.afternoon}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 1,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" display="block">
                      Evening
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.timeDistribution.evening}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 1,
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" display="block">
                      Night
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.timeDistribution.night}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
