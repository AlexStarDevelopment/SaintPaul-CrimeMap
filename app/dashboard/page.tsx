'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useCheckSessionUpdate } from '../hooks/useCheckSessionUpdate';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { dataSelection } from '../const';
import { getCrimes, getTotalCrimes } from '../api/getCrimes';
import { useCrimeData } from '../contexts/CrimeDataContext';
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
import EditLocation from './components/EditLocation';

import { SavedLocation, LOCATION_LIMITS, Crime } from '@/types';
import { calculateDistanceMiles } from '../../lib/geo';
import { computeSafetyScore } from '../../lib/safety';

export default function DashboardPage() {
  const { session, loading: authLoading, authenticated } = useRequireAuth();
  const router = useRouter();
  const theme = useTheme();
  const { flags, isEnabled, loading: flagsLoading } = useFeatureFlags();
  const { updateCrimeData, crimeData, getCrimesForLocation } = useCrimeData();

  // Check for session updates when dashboard loads
  useCheckSessionUpdate();

  // Redirect away if dashboard is disabled
  useEffect(() => {
    if (!flagsLoading && !isEnabled('dashboard')) {
      router.push('/');
    }
  }, [flagsLoading, flags, isEnabled, router]);

  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);

  // Fetch crime data using the same method as the main page
  const fetchCrimeData = useCallback(async () => {
    updateCrimeData({
      items: [],
      isLoading: true,
      selectedMonth: crimeData.selectedMonth,
      selectedYear: crimeData.selectedYear,
    });
    try {
      // Use All 2025 dataset for dashboard
      const dashboardData = dataSelection.find(
        (data) => data.month === 'all' && data.year === 2025
      );

      if (!dashboardData) {
        console.error('All 2025 data selection not found.');
        return;
      }

      const totalCrimesResponse = await getTotalCrimes(
        dashboardData.month,
        dashboardData.year,
        20000
      );

      const numPages = totalCrimesResponse.totalPages;
      const promises = [];

      for (let i = 1; i <= numPages; i++) {
        promises.push(getCrimes(dashboardData.month, dashboardData.year, i, 20000));
      }

      const allCrimesResponses = await Promise.all(promises);
      const crimesArray: Crime[] = [];
      allCrimesResponses.forEach((res) => {
        res.crimes.forEach((crime) => {
          crimesArray.push(crime);
        });
      });

      // Update shared crime data context
      updateCrimeData({
        items: crimesArray,
        isLoading: false,
        selectedMonth: dashboardData.month,
        selectedYear: dashboardData.year,
      });
    } catch (error) {
      console.error('Error fetching crime data:', error);
      // Update context with empty data on error
      const dashboardData = dataSelection.find(
        (data) => data.month === 'all' && data.year === 2025
      );
      updateCrimeData({
        items: [],
        isLoading: false,
        selectedMonth: dashboardData?.month || 'all',
        selectedYear: dashboardData?.year || 2025,
      });
    }
  }, [updateCrimeData, crimeData.selectedMonth, crimeData.selectedYear]);

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
      fetchCrimeData();
    }
  }, [authenticated, session, fetchLocations, fetchCrimeData]);

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

  const handleEditLocation = (location: SavedLocation) => {
    setEditingLocation(location);
    setTabValue(2); // Switch to edit tab
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      router.push('/');
    } else if (newValue === 2) {
      router.push('/account');
    }
  };

  if (authLoading || locationsLoading || (crimeData.isLoading && crimeData.items.length === 0)) {
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
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              userTier !== 'pro' && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/pricing')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Upgrade
                </Button>
              )
            }
          >
            You&apos;ve reached the maximum number of saved locations for your {userTier} plan (
            {LOCATION_LIMITS[userTier as keyof typeof LOCATION_LIMITS]}/
            {LOCATION_LIMITS[userTier as keyof typeof LOCATION_LIMITS]}).
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
                <Tab label="Edit" disabled={!editingLocation} />
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
                    onEditLocation={handleEditLocation}
                  />
                ) : tabValue === 1 ? (
                  <AddLocation
                    onAdd={handleAddLocation}
                    onCancel={() => setTabValue(0)}
                    onSuccess={() => setTabValue(0)}
                  />
                ) : editingLocation ? (
                  <EditLocation
                    location={editingLocation}
                    onUpdate={handleUpdateLocation}
                    onCancel={() => {
                      setEditingLocation(null);
                      setTabValue(0);
                    }}
                    onSuccess={() => {
                      setEditingLocation(null);
                      setTabValue(0);
                    }}
                  />
                ) : null}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Statistics */}
          <Grid item xs={12} md={8}>
            {selectedLocation ? (
              <>
                {/* Location Overview Card */}
                <LocationCard location={selectedLocation} period="30d" />

                {/* Export as PDF for pro users */}
                {userTier === 'pro' && (
                  <Box sx={{ mt: 2, mb: 2, textAlign: 'right' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={async () => {
                        if (!selectedLocation) return;
                        // Use the same method as the dashboard for incidents and distance calculation
                        const radiusKm = (selectedLocation.radius || 1.0) * 1.609344;
                        const localCrimes = getCrimesForLocation(
                          selectedLocation.coordinates.lat,
                          selectedLocation.coordinates.lng,
                          radiusKm
                        );
                        const allDates = localCrimes
                          .map((crime) => parseInt(crime.DATE || '0'))
                          .filter((date) => date > 0);
                        const mostRecentDate = Math.max(...allDates);
                        const daysAgo = 30;
                        const cutoffTime = mostRecentDate - daysAgo * 24 * 60 * 60 * 1000;
                        const currentPeriodCrimes = localCrimes.filter((crime) => {
                          if (!crime.DATE) return false;
                          return parseInt(crime.DATE) >= cutoffTime;
                        });
                        const totalCrimes = currentPeriodCrimes.length;
                        // Use the same safety score logic as LocationCard for PDF export
                        const maxExpectedCrimes = 50; // Must match LocationCard
                        const crimeRatio = Math.min(totalCrimes / maxExpectedCrimes, 1);
                        const safetyScore = Math.max(10, Math.round((1 - crimeRatio) * 100));
                        // Use the same mapping as dashboard for incidents
                        const incidents = currentPeriodCrimes.slice(0, 10).map((crime) => {
                          let crimeLat = null;
                          let crimeLng = null;
                          const latVal = crime.LAT as unknown;
                          const lonVal = crime.LON as unknown;
                          if (typeof latVal === 'number') {
                            crimeLat = latVal;
                          } else if (typeof latVal === 'string' && latVal.trim() !== '') {
                            const parsed = parseFloat(latVal);
                            if (!isNaN(parsed)) crimeLat = parsed;
                          }
                          if (typeof lonVal === 'number') {
                            crimeLng = lonVal;
                          } else if (typeof lonVal === 'string' && lonVal.trim() !== '') {
                            const parsed = parseFloat(lonVal);
                            if (!isNaN(parsed)) crimeLng = parsed;
                          }
                          let distance = '';
                          if (
                            crimeLat !== null &&
                            crimeLng !== null &&
                            selectedLocation?.coordinates?.lat != null &&
                            selectedLocation?.coordinates?.lng != null
                          ) {
                            const dist = calculateDistanceMiles(
                              selectedLocation.coordinates.lat,
                              selectedLocation.coordinates.lng,
                              crimeLat,
                              crimeLng
                            );
                            distance = `${dist.toFixed(1)} mi`;
                          } else {
                            distance = 'N/A';
                          }
                          return {
                            type: crime.INCIDENT || crime.INCIDENT_TYPE || 'Unknown',
                            date: crime.DATE
                              ? new Date(Number(crime.DATE)).toLocaleDateString()
                              : 'Unknown',
                            location: crime.BLOCK_VIEW || crime.BLOCK || selectedLocation.address,
                            distance,
                          };
                        });
                        // --- Dashboard analytics for PDF ---
                        // Crime type breakdown
                        const typeCounts: Record<string, number> = {};
                        currentPeriodCrimes.forEach((crime: any) => {
                          const type = crime.INCIDENT || crime.TYPE || 'Unknown';
                          typeCounts[type] = (typeCounts[type] || 0) + 1;
                        });
                        // Time of day breakdown
                        const timeCounts: Record<string, number> = {
                          morning: 0,
                          afternoon: 0,
                          evening: 0,
                          night: 0,
                        };
                        currentPeriodCrimes.forEach((crime: any) => {
                          if (crime.DATE) {
                            const hour = new Date(parseInt(crime.DATE)).getHours();
                            let timeOfDay = '';
                            if (hour >= 6 && hour < 12) timeOfDay = 'morning';
                            else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
                            else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
                            else timeOfDay = 'night';
                            timeCounts[timeOfDay] = (timeCounts[timeOfDay] || 0) + 1;
                          }
                        });
                        const totalTimeEntries = Object.values(timeCounts).reduce(
                          (sum, c) => sum + c,
                          0
                        );
                        const timePercentages = {
                          morning:
                            totalTimeEntries > 0
                              ? Math.round((timeCounts.morning / totalTimeEntries) * 100)
                              : 0,
                          afternoon:
                            totalTimeEntries > 0
                              ? Math.round((timeCounts.afternoon / totalTimeEntries) * 100)
                              : 0,
                          evening:
                            totalTimeEntries > 0
                              ? Math.round((timeCounts.evening / totalTimeEntries) * 100)
                              : 0,
                          night:
                            totalTimeEntries > 0
                              ? Math.round((timeCounts.night / totalTimeEntries) * 100)
                              : 0,
                        };
                        // Safest/riskiest time
                        const sortedTimes = Object.entries(timeCounts).sort(
                          ([, a], [, b]) => a - b
                        );
                        const formatTimeOfDay = (key: string) => {
                          switch (key) {
                            case 'morning':
                              return '6 AM - 12 PM';
                            case 'afternoon':
                              return '12 PM - 6 PM';
                            case 'evening':
                              return '6 PM - 10 PM';
                            case 'night':
                              return '10 PM - 6 AM';
                            default:
                              return key;
                          }
                        };
                        const safestTime = sortedTimes[0]
                          ? formatTimeOfDay(sortedTimes[0][0])
                          : 'Morning';
                        const riskiestTime = sortedTimes[sortedTimes.length - 1]
                          ? formatTimeOfDay(sortedTimes[sortedTimes.length - 1][0])
                          : 'Evening';
                        // Most common crime
                        const topIncident =
                          Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
                          'None';
                        // Generate PDF on the frontend using pdf-lib
                        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
                        const lat = selectedLocation.coordinates.lat;
                        const lng = selectedLocation.coordinates.lng;
                        // Use staticmap.openstreetmap.de (no API key required, limited usage)
                        const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x200&markers=${lat},${lng},red-pushpin`;
                        let mapImageBytes: Uint8Array | null = null;
                        try {
                          const mapResp = await fetch(mapUrl);
                          if (mapResp.ok) {
                            mapImageBytes = new Uint8Array(await mapResp.arrayBuffer());
                          }
                        } catch (e) {
                          // Ignore map fetch errors, just skip image
                        }
                        const pdfDoc = await PDFDocument.create();
                        const page = pdfDoc.addPage([600, 800]);
                        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                        let y = 760;
                        // Draw map image at the top if available
                        if (mapImageBytes) {
                          try {
                            const mapImg = await pdfDoc.embedPng(mapImageBytes);
                            page.drawImage(mapImg, {
                              x: 0,
                              y: y - 200,
                              width: 600,
                              height: 200,
                            });
                            y -= 210;
                          } catch (e) {
                            // If image fails to embed, just skip
                          }
                        }
                        // Colored header bar
                        page.drawRectangle({
                          x: 0,
                          y: y - 30,
                          width: 600,
                          height: 40,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        page.drawText('Saint Paul CrimeMap', {
                          x: 50,
                          y: y - 10,
                          size: 24,
                          font,
                          color: rgb(1, 1, 1),
                        });
                        y -= 50;

                        // Address and date (wrap if too long)
                        // Word-wrap address, label only on first line
                        // Remove neighborhood, county, country from address for PDF
                        function stripAddress(address: string) {
                          // Remove after first comma if it looks like neighborhood/county/country
                          // e.g. "123 Main St, Saint Paul, MN, USA" => "123 Main St"
                          // If address has more than 2 commas, keep only up to the second part
                          const parts = address.split(',');
                          if (parts.length > 2) {
                            return parts.slice(0, 2).join(',').trim();
                          }
                          return address;
                        }
                        function wrapText(text: string, maxLen: number) {
                          const words = text.split(' ');
                          const lines = [];
                          let current = '';
                          for (const word of words) {
                            if ((current + word).length > maxLen) {
                              lines.push(current.trim());
                              current = '';
                            }
                            current += word + ' ';
                          }
                          if (current.trim()) lines.push(current.trim());
                          return lines;
                        }
                        const cleanAddress = stripAddress(selectedLocation.address);
                        const addressLines = wrapText(cleanAddress, 50);
                        addressLines.forEach((line, idx) => {
                          if (idx === 0) {
                            page.drawText(`Address: ${line}`, {
                              x: 50,
                              y,
                              size: 11,
                              font,
                              color: rgb(0.13, 0.32, 0.47),
                            });
                          } else {
                            page.drawText(line, {
                              x: 120,
                              y,
                              size: 11,
                              font,
                              color: rgb(0.13, 0.32, 0.47),
                            });
                          }
                          y -= 15;
                        });
                        page.drawText(`Radius: ${(selectedLocation.radius || 1.0).toFixed(2)} mi`, {
                          x: 50,
                          y,
                          size: 12,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 16;
                        page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
                          x: 50,
                          y,
                          size: 12,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 20;

                        // Summary section (moved up)
                        page.drawText('Summary', {
                          x: 50,
                          y,
                          size: 18,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 22;
                        // Safety Score Bar Visualization
                        page.drawText('Safety Score:', { x: 50, y, size: 14, font });
                        // Bar background
                        page.drawRectangle({
                          x: 150,
                          y: y - 4,
                          width: 200,
                          height: 14,
                          color: rgb(0.9, 0.9, 0.9),
                        });
                        // Bar fill (green to red)
                        const scoreColor =
                          safetyScore > 70
                            ? rgb(0.2, 0.7, 0.2)
                            : safetyScore > 40
                              ? rgb(1, 0.8, 0.2)
                              : rgb(0.9, 0.2, 0.2);
                        page.drawRectangle({
                          x: 150,
                          y: y - 4,
                          width: 2 * safetyScore,
                          height: 14,
                          color: scoreColor,
                        });
                        page.drawText(`${safetyScore}`, {
                          x: 360,
                          y,
                          size: 12,
                          font,
                          color: scoreColor,
                        });
                        y -= 20;
                        page.drawText(`Total Incidents (30 days): ${totalCrimes}`, {
                          x: 50,
                          y,
                          size: 14,
                          font,
                        });
                        y -= 28;

                        // Section divider
                        page.drawLine({
                          start: { x: 50, y },
                          end: { x: 550, y },
                          thickness: 1,
                          color: rgb(0.8, 0.8, 0.8),
                        });
                        y -= 18;
                        // Crime type breakdown bar chart
                        const chartY = y;
                        page.drawText('Crime Type Breakdown', {
                          x: 50,
                          y: chartY,
                          size: 14,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        let barY = chartY - 18;
                        const maxCount = Math.max(...Object.values(typeCounts));
                        Object.entries(typeCounts).forEach(([type, count], idx) => {
                          const barWidth = 300 * (count / (maxCount || 1));
                          page.drawRectangle({
                            x: 150,
                            y: barY - 8,
                            width: barWidth,
                            height: 12,
                            color: rgb(0.13, 0.32, 0.47),
                          });
                          page.drawText(type, { x: 50, y: barY, size: 10, font });
                          page.drawText(`${count}`, { x: 460, y: barY, size: 10, font });
                          barY -= 18;
                        });
                        y = barY - 10;

                        // Time of Day Breakdown Bar Chart
                        page.drawText('Time of Day Breakdown', {
                          x: 50,
                          y,
                          size: 14,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 18;
                        const timeLabels = ['Morning', 'Afternoon', 'Evening', 'Night'];
                        const timeKeys = ['morning', 'afternoon', 'evening', 'night'];
                        let timeBarY = y;
                        timeKeys.forEach((key, idx) => {
                          const percent = timePercentages[key as keyof typeof timePercentages];
                          const barWidth = 300 * (percent / 100);
                          page.drawRectangle({
                            x: 150,
                            y: timeBarY - 8,
                            width: barWidth,
                            height: 12,
                            color: rgb(0.47, 0.47, 0.7),
                          });
                          page.drawText(timeLabels[idx], { x: 50, y: timeBarY, size: 10, font });
                          page.drawText(`${percent}%`, { x: 460, y: timeBarY, size: 10, font });
                          timeBarY -= 18;
                        });
                        y = timeBarY - 10;

                        // Key Insights Section
                        page.drawText('Key Insights', {
                          x: 50,
                          y,
                          size: 14,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 18;
                        page.drawText(`Most Common Crime: ${topIncident}`, {
                          x: 50,
                          y,
                          size: 12,
                          font,
                        });
                        y -= 14;
                        page.drawText(`Safest Time: ${safestTime}`, { x: 50, y, size: 12, font });
                        y -= 14;
                        page.drawText(`Riskiest Time: ${riskiestTime}`, {
                          x: 50,
                          y,
                          size: 12,
                          font,
                        });
                        y -= 18;

                        // Section divider
                        page.drawLine({
                          start: { x: 50, y },
                          end: { x: 550, y },
                          thickness: 1,
                          color: rgb(0.8, 0.8, 0.8),
                        });
                        y -= 18;

                        // Summary section

                        // Recent Incidents Table
                        page.drawText('Recent Incidents', {
                          x: 50,
                          y,
                          size: 16,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 20;
                        page.drawText('Type', {
                          x: 50,
                          y,
                          size: 12,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        page.drawText('Date', {
                          x: 170,
                          y,
                          size: 12,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        page.drawText('Location', {
                          x: 290,
                          y,
                          size: 12,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        page.drawText('Distance', {
                          x: 470,
                          y,
                          size: 12,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 14;
                        incidents.forEach((incident: any, idx: number) => {
                          if (y < 50) return; // avoid overflow
                          page.drawText(incident.type, { x: 50, y, size: 10, font });
                          page.drawText(incident.date, { x: 170, y, size: 10, font });
                          page.drawText(incident.location, { x: 290, y, size: 10, font });
                          page.drawText(incident.distance, { x: 470, y, size: 10, font });
                          y -= 12;
                        });
                        y -= 24;

                        // Footer
                        page.drawLine({
                          start: { x: 50, y },
                          end: { x: 550, y },
                          thickness: 1,
                          color: rgb(0.8, 0.8, 0.8),
                        });
                        y -= 18;
                        page.drawText('Saint Paul CrimeMap | Generated for sharing', {
                          x: 50,
                          y,
                          size: 10,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });
                        y -= 14;
                        page.drawText('For more details, visit: https://saintpaul-crimemap.com', {
                          x: 50,
                          y,
                          size: 10,
                          font,
                          color: rgb(0.13, 0.32, 0.47),
                        });

                        const pdfBytes = await pdfDoc.save();
                        // Ensure we pass a regular ArrayBuffer, not SharedArrayBuffer
                        // Create a new Uint8Array to guarantee compatibility
                        const safeBytes = new Uint8Array(pdfBytes);
                        const blob = new Blob([safeBytes], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `crime-report-${selectedLocation.address}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      Export as PDF
                    </Button>
                  </Box>
                )}

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
