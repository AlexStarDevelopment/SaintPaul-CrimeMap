import React, { useEffect, useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { SavedLocation, Crime, SubscriptionTier } from '@/types';
import { calculateDistanceMiles } from '../../../lib/geo';
import { useCrimeData } from '../../contexts/CrimeDataContext';

interface IncidentsFeedProps {
  location: SavedLocation;
  userTier: SubscriptionTier;
  onViewOnMap?: (crime: Crime) => void;
}

// Use shared geo util

// Helper function to format time ago
function formatTimeAgo(date: number): string {
  const now = Date.now();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
}

// Get incident color based on severity
function getIncidentColor(incident: string): 'error' | 'warning' | 'info' | 'inherit' {
  const upperIncident = incident.toUpperCase();
  if (upperIncident.includes('HOMICIDE') || upperIncident.includes('MURDER')) return 'error';
  if (
    upperIncident.includes('ASSAULT') ||
    upperIncident.includes('ROBBERY') ||
    upperIncident.includes('RAPE')
  )
    return 'error';
  if (upperIncident.includes('BURGLARY') || upperIncident.includes('THEFT')) return 'warning';
  if (upperIncident.includes('VANDALISM') || upperIncident.includes('GRAFFITI')) return 'info';
  return 'inherit';
}

export default function IncidentsFeed({ location, userTier, onViewOnMap }: IncidentsFeedProps) {
  const [incidents, setIncidents] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { crimeData, getCrimesForLocation } = useCrimeData();

  // Generate mock incidents for display
  const generateMockIncidents = useCallback((): Crime[] => {
    const mockTypes = ['Theft', 'Vandalism', 'Assault', 'Auto Theft', 'Burglary'];
    const now = Date.now();

    return Array.from(
      { length: 10 },
      (_, i) =>
        ({
          CASE_NUMBER: `2024-${100000 + i}`,
          CODE: '123',
          INCIDENT_TYPE: mockTypes[Math.floor(Math.random() * mockTypes.length)],
          INCIDENT: mockTypes[Math.floor(Math.random() * mockTypes.length)],
          POLICE_GRID_NUMBER: '001',
          NEIGHBORHOOD_NUMBER: 1,
          NEIGHBORHOOD_NAME: 'Mock Neighborhood',
          BLOCK: `${Math.floor(Math.random() * 999)}XX Example St`,
          BLOCK_VIEW: `${Math.floor(Math.random() * 999)}XX Example St`,
          CALL_DISPOSITION_CODE: 'CLOSED',
          CALL_DISPOSITION: 'Closed',
          DATE: (now - i * 3600000 * Math.random() * 48).toString(), // Random time in last 48 hours
          LAT: location.coordinates.lat + (Math.random() - 0.5) * 0.01,
          LON: location.coordinates.lng + (Math.random() - 0.5) * 0.01,
        }) as Crime
    );
  }, [location.coordinates]);

  const fetchIncidents = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

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

      // Get crimes within the location's saved radius (convert miles to km)
      const radiusKm = location.radius * 1.609344;
      const localCrimes = getCrimesForLocation(
        location.coordinates.lat,
        location.coordinates.lng,
        radiusKm
      );

      // Sort by date (most recent first) and limit to recent incidents
      // Use the most recent date from the dataset instead of current time
      const allDates = localCrimes
        .map((crime) => parseInt(crime.DATE || '0'))
        .filter((date) => date > 0);
      const mostRecentDate = allDates.length > 0 ? Math.max(...allDates) : Date.now();
      const thirtyDaysAgo = mostRecentDate - 30 * 24 * 60 * 60 * 1000;

      const recentIncidents = localCrimes
        .filter((crime) => crime.DATE && parseInt(crime.DATE) >= thirtyDaysAgo)
        .sort((a, b) => {
          const dateA = parseInt(a.DATE || '0');
          const dateB = parseInt(b.DATE || '0');
          return dateB - dateA; // Most recent first
        })
        .slice(0, 20); // Limit to 20 most recent

      setIncidents(recentIncidents);
    } catch (err: any) {
      console.error('Error processing incidents:', err);
      setError(err.message);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [
    location.coordinates.lat,
    location.coordinates.lng,
    location.radius,
    crimeData.items,
    crimeData.isLoading,
    getCrimesForLocation,
  ]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const displayIncidents = incidents.slice(
    0,
    userTier === 'free' ? 5 : userTier === 'supporter' ? 10 : 20
  );

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <WarningIcon />
          Recent Incidents
        </Typography>
        <IconButton onClick={fetchIncidents} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Using sample data. Real-time data will be available soon.
        </Alert>
      )}

      {displayIncidents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No recent incidents in this area
          </Typography>
        </Box>
      ) : (
        <>
          <List sx={{ width: '100%' }}>
            {displayIncidents.map((incident, index) => {
              const distance = calculateDistanceMiles(
                location.coordinates.lat,
                location.coordinates.lng,
                incident.LAT || 0,
                incident.LON || 0
              );

              return (
                <React.Fragment key={incident.CASE_NUMBER || index}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      onViewOnMap && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => onViewOnMap(incident)}
                          title="View on map"
                        >
                          <OpenIcon fontSize="small" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 1 }}>
                      <WarningIcon
                        color={getIncidentColor(incident.INCIDENT || '')}
                        fontSize="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="subtitle2" component="span">
                            {incident.INCIDENT}
                          </Typography>
                          <Chip
                            label={`${distance.toFixed(2)} mi`}
                            size="small"
                            variant="outlined"
                            icon={<LocationIcon />}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {incident.BLOCK_VIEW}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mt: 0.5,
                            }}
                          >
                            <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(Number(incident.DATE))}
                            </Typography>
                            {incident.CASE_NUMBER && (
                              <>
                                <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>
                                  •
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Case #{incident.CASE_NUMBER}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < displayIncidents.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              );
            })}
          </List>

          {userTier === 'free' && incidents.length > 5 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Showing 5 most recent incidents. Upgrade to see more incidents and get alerts.
            </Alert>
          )}
        </>
      )}
    </Paper>
  );
}
