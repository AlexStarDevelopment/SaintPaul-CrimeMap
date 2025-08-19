import React, { useState } from 'react';
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
  Add as AddIcon,
  MyLocation as MyLocationIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { SavedLocation, RADIUS_OPTIONS } from '@/types';

interface AddLocationProps {
  onAdd: (
    location: Omit<SavedLocation, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}

const PRESET_LABELS = ['Home', 'Work', 'School', 'Gym', 'Parents', 'Custom'];

export default function AddLocation({ onAdd, onCancel, onSuccess }: AddLocationProps) {
  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, we'll use a simple geocoding approach
      // In production, you'd want to use a proper geocoding API

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
      // For demo purposes, use a default Saint Paul location
      setCoordinates({
        lat: 44.9537,
        lng: -93.09,
      });
      setError('Using approximate location. You can continue or try a different address.');
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
      const locationData: Omit<SavedLocation, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        label: finalLabel,
        address,
        coordinates,
        radius,
        notifications: {
          enabled: false,
          types: [],
          severity: 'all',
        },
        isActive: true,
      };

      await onAdd(locationData);

      // Call onSuccess callback if provided to switch back to locations tab
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add location');
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
        Add New Location
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
            setCoordinates(null); // Reset coordinates when address changes
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
          startIcon={<AddIcon />}
          onClick={handleSubmit}
          disabled={loading || !coordinates}
        >
          Add Location
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
