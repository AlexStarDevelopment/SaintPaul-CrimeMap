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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Palette as PaletteIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingUpIcon,
  PictureAsPdf as PdfIcon,
  Star as StarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { signIn } from 'next-auth/react';

interface AccountBenefitsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountBenefitsDialog({ open, onClose }: AccountBenefitsDialogProps) {
  const handleCreateAccount = () => {
    signIn('google', { callbackUrl: '/pricing' });
  };

  const benefits = [
    {
      icon: <DashboardIcon sx={{ color: 'primary.main' }} />,
      title: 'Personal Crime Dashboard',
      description:
        'Save locations and get detailed crime statistics for areas you care about (free tier: 2 locations)',
    },
    {
      icon: <PaletteIcon sx={{ color: 'info.main' }} />,
      title: 'Customizable Themes',
      description: 'Choose your preferred theme and have it saved across all your devices',
    },
    {
      icon: <TrendingUpIcon sx={{ color: 'success.main' }} />,
      title: 'Crime Trends & Analytics',
      description: 'View detailed crime trends, safety scores, and historical data for your areas',
    },
    {
      icon: <StarIcon sx={{ color: 'warning.main' }} />,
      title: 'Premium Tiers Available',
      description:
        'Supporter ($5/mo): Save up to 5 locations. Pro ($15/mo): Unlimited locations + PDF reports',
    },
    {
      icon: <PdfIcon sx={{ color: 'error.main' }} />,
      title: 'PDF Address Safety Reports (Pro)',
      description:
        'Generate unlimited detailed PDF safety reports for any address with crime statistics and trends',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          <Box>
            <Typography variant="h5" component="div" gutterBottom>
              Unlock Premium Crime Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join thousands of Saint Paul residents who use the crime map to stay safer
            </Typography>
          </Box>
          <Button
            variant="text"
            size="small"
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 0.5, color: 'text.secondary' }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Why Create an Account?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The crime map is completely free to use, but an account unlocks powerful personalized
            features - plus optional premium tiers with enhanced capabilities:
          </Typography>
        </Box>

        <List sx={{ py: 0 }}>
          {benefits.map((benefit, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>{benefit.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight="medium">
                      {benefit.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {benefit.description}
                    </Typography>
                  }
                />
              </ListItem>
              {index < benefits.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
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
          No Thanks, Continue
        </Button>
        <Button
          onClick={handleCreateAccount}
          variant="contained"
          size="large"
          sx={{
            flex: 1,
            fontWeight: 'bold',
            py: 1.5,
          }}
        >
          Create Free Account
        </Button>
      </DialogActions>
    </Dialog>
  );
}
