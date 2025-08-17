'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '../hooks/useRequireAuth';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Map as MapIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import SavedLocations from './components/SavedLocations';
import LocationCard from './components/LocationCard';
import CrimeStats from './components/CrimeStats';
import IncidentsFeed from './components/IncidentsFeed';
import AddLocation from './components/AddLocation';
import { SavedLocation } from '../models/location';
import { LOCATION_LIMITS } from '../models/location';

export default function DashboardPage() {
  const { session, loading: authLoading, authenticated } = useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations);
        if (data.locations.length > 0 && !selectedLocation) {
          setSelectedLocation(data.locations[0]);
        }
      } else {
        throw new Error('Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to load saved locations');
    } finally {
      setLocationsLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (authenticated && session?.user?.id) {
      fetchLocations();
    }
  }, [authenticated, session, fetchLocations]);

  const handleAddLocation = async (
    locationData: Omit<SavedLocation, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        const data = await response.json();
        setLocations([...locations, data.location]);
        setSelectedLocation(data.location);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add location');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdateLocation = async (id: string, updates: Partial<SavedLocation>) => {
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setLocations(locations.map((loc) => (loc._id === id ? data.location : loc)));
        if (selectedLocation?._id === id) {
          setSelectedLocation(data.location);
        }
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteLocation = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocations(locations.filter((loc) => loc._id !== id));
        if (selectedLocation?._id === id) {
          setSelectedLocation(locations[0] || null);
        }
      } else {
        throw new Error('Failed to delete location');
      }
    } catch (error: any) {
      setError(error.message);
      throw error; // Re-throw to let the component handle the loading state
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      router.push('/');
    } else if (newValue === 2) {
      router.push('/account');
    }
  };

  if (authLoading || locationsLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!authenticated || !session?.user) {
    return null;
  }

  const userTier = session.user.subscriptionTier || 'free';
  const locationLimit = LOCATION_LIMITS[userTier];
  const canAddMore = locationLimit === -1 || locations.length < locationLimit;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Navigation Tabs */}
      <Paper sx={{ borderRadius: 0 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            <IconButton onClick={() => router.push('/')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Tabs value={1} onChange={handleTabChange} sx={{ flexGrow: 1 }}>
              <Tab icon={<MapIcon />} label="Map" iconPosition="start" />
              <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
              <Tab icon={<PersonIcon />} label="Account" iconPosition="start" />
            </Tabs>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Crime Dashboard
          </Typography>
          {canAddMore && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTabValue(1)}
              sx={{ borderRadius: 2 }}
            >
              Add Location
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!canAddMore && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You&apos;ve reached the maximum number of saved locations for your {userTier} plan.
            {userTier !== 'pro' && ' Upgrade to save more locations.'}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Saved Locations */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
                <Tab label="My Locations" />
                <Tab label="Add New" disabled={!canAddMore} />
              </Tabs>
              <Box sx={{ mt: 2 }}>
                {tabValue === 0 ? (
                  <SavedLocations
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onSelectLocation={setSelectedLocation}
                    onUpdateLocation={handleUpdateLocation}
                    onDeleteLocation={handleDeleteLocation}
                    userTier={userTier}
                  />
                ) : (
                  <AddLocation
                    onAdd={handleAddLocation}
                    onCancel={() => setTabValue(0)}
                    onSuccess={() => setTabValue(0)}
                  />
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Statistics */}
          <Grid item xs={12} md={8}>
            {selectedLocation ? (
              <>
                {/* Location Overview Card */}
                <LocationCard location={selectedLocation} period="30d" />

                {/* Crime Statistics */}
                <Box sx={{ mt: 3 }}>
                  <CrimeStats location={selectedLocation} userTier={userTier} />
                </Box>

                {/* Incidents Feed */}
                <Box sx={{ mt: 3 }}>
                  <IncidentsFeed location={selectedLocation} userTier={userTier} />
                </Box>
              </>
            ) : (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No Location Selected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {locations.length === 0
                    ? 'Add your first location to start monitoring crime activity'
                    : 'Select a location from the list to view statistics'}
                </Typography>
                {locations.length === 0 && canAddMore && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setTabValue(1)}
                  >
                    Add Your First Location
                  </Button>
                )}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
