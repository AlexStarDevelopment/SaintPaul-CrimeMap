import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';
import { SavedLocation, RADIUS_OPTIONS, SubscriptionTier } from '@/types';

interface SavedLocationsProps {
  locations: SavedLocation[];
  selectedLocation: SavedLocation | null;
  onSelectLocation: (location: SavedLocation) => void;
  onUpdateLocation: (id: string, updates: Partial<SavedLocation>) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
  userTier: SubscriptionTier;
  onEditLocation?: (location: SavedLocation) => void;
}

export default function SavedLocations({
  locations,
  selectedLocation,
  onSelectLocation,
  onUpdateLocation,
  onDeleteLocation,
  userTier,
  onEditLocation,
}: SavedLocationsProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuLocation, setMenuLocation] = React.useState<SavedLocation | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, location: SavedLocation) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuLocation(location);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuLocation(null);
  };

  const handleDelete = async () => {
    if (menuLocation) {
      const locationId = menuLocation._id!;
      setDeletingId(locationId);
      handleMenuClose(); // Close menu first but keep the loading state

      try {
        await onDeleteLocation(locationId);
      } catch (error) {
        // Error is already handled in the parent component
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getLocationIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return <HomeIcon />;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return <WorkIcon />;
    return <PlaceIcon />;
  };

  const getRadiusLabel = (radius: number) => {
    const option = RADIUS_OPTIONS.find((opt) => opt.value === radius);
    return option?.label || `${radius} mi`;
  };

  if (locations.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No saved locations yet
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ width: '100%' }}>
        {locations.map((location) => (
          <ListItem
            key={location._id}
            disablePadding
            sx={{
              mb: 1,
              border: 1,
              borderColor: selectedLocation?._id === location._id ? 'primary.main' : 'divider',
              borderRadius: 1,
              backgroundColor:
                selectedLocation?._id === location._id ? 'action.selected' : 'transparent',
            }}
          >
            <ListItemButton onClick={() => onSelectLocation(location)}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {getLocationIcon(location.label)}
              </Box>
              <ListItemText
                primary={<Typography variant="subtitle1">{location.label}</Typography>}
                secondary={
                  <Box>
                    <Typography variant="caption" display="block" noWrap>
                      {location.address}
                    </Typography>
                    <Chip
                      label={getRadiusLabel(location.radius)}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {deletingId === location._id ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, location)}
                    size="small"
                    disabled={deletingId !== null}
                  >
                    <MoreIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (menuLocation && onEditLocation) {
              onEditLocation(menuLocation);
            }
            handleMenuClose();
          }}
        >
          Edit Location
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete Location
        </MenuItem>
      </Menu>
    </>
  );
}
