import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  MyLocation as MyLocationIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { SavedLocation, RADIUS_OPTIONS } from '@/types';

interface EditLocationProps {
  location: SavedLocation;
  onUpdate: (id: string, updates: Partial<SavedLocation>) => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}

const PRESET_LABELS = ['Home', 'Work', 'School', 'Gym', 'Parents', 'Custom'];

export default function EditLocation({
  location,
  onUpdate,
  onCancel,
  onSuccess,
}: EditLocationProps) {
  const [label, setLabel] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Initialize form with existing location data
  useEffect(() => {
    if (location) {
      setAddress(location.address);
      setRadius(location.radius);
      setCoordinates(location.coordinates);

      // Check if label matches a preset
      const presetLabel = PRESET_LABELS.find(
        (preset) => preset.toLowerCase() === location.label.toLowerCase()
      );
      if (presetLabel && presetLabel !== 'Custom') {
        setLabel(presetLabel);
        setCustomLabel('');
      } else {
        setLabel('Custom');
        setCustomLabel(location.label);
      }
    }
  }, [location]);

  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if address contains "Saint Paul" or "St Paul"
      let fullAddress = address;
      if (
        !address.toLowerCase().includes('saint paul') &&
        !address.toLowerCase().includes('st paul')
      ) {
        fullAddress = `${address}, Saint Paul, MN`;
      }

      // Use OpenStreetMap Nominatim for geocoding (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(fullAddress)}&format=json&limit=1`
      );

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();

      if (data.length === 0) {
        setError('Address not found. Please check and try again.');
        return;
      }

      const result = data[0];
      setCoordinates({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      });

      // Update address with the formatted version
      setAddress(result.display_name);
    } catch (err: any) {
      console.error('Geocoding error:', err);
      setError(
        'Unable to verify address. You can continue with the current location or try a different address.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    if (!coordinates) {
      setError('Please verify the address first');
      return;
    }

    const finalLabel = label === 'Custom' ? customLabel : label;
    if (!finalLabel.trim()) {
      setError('Please enter a label for this location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates: Partial<SavedLocation> = {
        label: finalLabel,
        address,
        coordinates,
        radius,
      };

      await onUpdate(location._id!, updates);

      // Call onSuccess callback if provided to exit edit mode
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setAddress(
            `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          );
          setLoading(false);
          setError(null);
        },
        (error) => {
          setError('Unable to get current location');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Edit Location: {location.label}
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Label Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Label
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          {PRESET_LABELS.map((presetLabel) => (
            <Chip
              key={presetLabel}
              label={presetLabel}
              onClick={() => setLabel(presetLabel)}
              color={label === presetLabel ? 'primary' : 'default'}
              variant={label === presetLabel ? 'filled' : 'outlined'}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
        {label === 'Custom' && (
          <TextField
            fullWidth
            size="small"
            placeholder="Enter custom label"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {/* Address Input */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Address
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter address (e.g., 123 Main St, Saint Paul, MN)"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
          }}
          sx={{ mb: 1 }}
        />
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleGeocodeAddress}
            disabled={loading || !address.trim()}
          >
            Verify Address
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<MyLocationIcon />}
            onClick={handleUseCurrentLocation}
            disabled={loading}
          >
            Use Current Location
          </Button>
        </Stack>
        {coordinates && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Location verified: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </Alert>
        )}
      </Box>

      {/* Monitoring Radius */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Monitoring Radius</InputLabel>
        <Select
          value={radius}
          label="Monitoring Radius"
          onChange={(e) => setRadius(e.target.value as number)}
        >
          {RADIUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={loading || !coordinates}
        >
          Save Changes
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}
