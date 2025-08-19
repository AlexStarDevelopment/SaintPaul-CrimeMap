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
    const fetchStats = async () => {
      if (!location._id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/dashboard/stats?locationId=${location._id}&period=${period}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();

        // Transform API data to component format
        const crimeTypes = Object.entries(data.stats.crimesByType)
          .map(([type, count]) => {
            const total = data.stats.totalCrimes;
            return {
              type,
              count: count as number,
              percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
            };
          })
          .sort((a, b) => b.count - a.count);

        const topIncident = crimeTypes.length > 0 ? crimeTypes[0].type : 'None';

        setStats({
          crimeTypes,
          timeDistribution: {
            morning: 15, // Will be calculated from timeDistribution data
            afternoon: 25,
            evening: 35,
            night: 25,
          },
          topIncident,
          safestTime: '10 AM - 2 PM', // Will be calculated from time patterns
          riskiestTime: '8 PM - 12 AM',
        });
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        setError(err.message);
        // Fall back to mock data
        setStats({
          crimeTypes: [
            { type: 'Theft', count: 12, percentage: 35 },
            { type: 'Vandalism', count: 8, percentage: 23 },
            { type: 'Assault', count: 6, percentage: 18 },
            { type: 'Auto Theft', count: 5, percentage: 15 },
            { type: 'Other', count: 3, percentage: 9 },
          ],
          timeDistribution: {
            morning: 15,
            afternoon: 25,
            evening: 35,
            night: 25,
          },
          topIncident: 'Theft',
          safestTime: '10 AM - 2 PM',
          riskiestTime: '8 PM - 12 AM',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [location._id, period]); // Re-fetch when location or period changes

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
                    ? 'Last 7 Days'
                    : period === '30d'
                      ? 'Last 30 Days'
                      : period === '90d'
                        ? 'Last 90 Days'
                        : 'Last Year'}
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
