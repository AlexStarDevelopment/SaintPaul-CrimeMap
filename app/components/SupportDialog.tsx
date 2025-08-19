'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface SupportDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SupportDialog({ open, onClose }: SupportDialogProps) {
  const handleSupport = () => {
    // Track analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'engagement',
        event_label: 'support_dialog_donate',
        value: 1,
      });
    }
    window.open('https://buy.stripe.com/7sY7sLfBcfV3dsZaj85Ne01', '_blank');
    onClose();
  };

  const handleLater = () => {
    // Track analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'engagement',
        event_label: 'support_dialog_later',
        value: 0,
      });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleLater}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          mx: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FavoriteIcon sx={{ color: 'error.main' }} />
            <Typography variant="h6" component="div">
              I Love That You&apos;re Here!
            </Typography>
          </Box>
          <Button
            variant="text"
            size="small"
            onClick={handleLater}
            sx={{ minWidth: 'auto', p: 0.5, color: 'text.secondary' }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            We&apos;re thrilled you&apos;re enjoying the Saint Paul Crime Map! We hate to interrupt,
            but I need your help.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <GroupsIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Thousands of Users Monthly
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Our community has grown beyond our wildest dreams
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TrendingUpIcon sx={{ color: 'warning.main', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                Growing Server Costs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                More users means higher hosting and data processing costs
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.contrastText' }}>
            💡 <strong>Your support helps us:</strong> Keep the map updated as soon as the city
            publishes the data, maintain fast loading speeds, add new features, and keep this
            resource free for everyone in Saint Paul.
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            100% of development and server costs are currently covered by me (Alex! Nice to meet
            you.), but your support helps ensure this resource continues to grow and improve for our
            community.
          </Typography>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: 'italic', textAlign: 'center' }}
        >
          &quot;Even $15 helps keep this resource running for everyone&quot;
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={handleLater}
          variant="outlined"
          sx={{
            flex: 1,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'text.secondary',
            },
          }}
        >
          Maybe Later
        </Button>
        <Button
          onClick={handleSupport}
          variant="contained"
          size="large"
          startIcon={<FavoriteIcon />}
          sx={{
            flex: 1,
            fontWeight: 'bold',
            py: 1.5,
            backgroundColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }}
        >
          Support the Map
        </Button>
      </DialogActions>
    </Dialog>
  );
}
