'use client';
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Container,
  Button,
  Avatar,
  Menu,
  Divider,
  ListItemIcon,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  FilterList,
  AccountCircle,
  Logout,
  Person,
  Dashboard as DashboardIcon,
  AdminPanelSettings,
  Home,
  Map as MapIcon,
  CreditCard,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTheme as useMUITheme } from '@mui/material/styles';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dataSelection } from '../const';

interface NavigationProps {
  option: number;
  onOptionChange: (event: SelectChangeEvent<number>) => void;
  onFilterClick: () => void;
  currentPage?: 'map' | 'dashboard' | 'account';
}

export default function Navigation({
  option,
  onOptionChange,
  onFilterClick,
  currentPage = 'map',
}: NavigationProps) {
  const muiTheme = useMUITheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardEnabled, setDashboardEnabled] = useState<boolean>(true);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      router.push('/');
    } else if (newValue === 1) {
      router.push('/dashboard');
    } else if (newValue === 2) {
      router.push('/account');
    }
  };

  const getCurrentTabValue = () => {
    switch (currentPage) {
      case 'map':
        return 0;
      case 'dashboard':
        return 1;
      case 'account':
        return 2;
      default:
        return 0;
    }
  };

  useEffect(() => {
    // Fetch feature flags to determine if dashboard is enabled
    const loadFlags = async () => {
      try {
        const res = await fetch('/api/feature-flags');
        if (res.ok) {
          const data = await res.json();
          setDashboardEnabled(Boolean(data.flags?.dashboard));
        } else {
          setDashboardEnabled(false);
        }
      } catch {
        setDashboardEnabled(false);
      }
    };
    loadFlags();
  }, []);

  return (
    <React.Fragment>
      <AppBar
        position="static"
        sx={{
          background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.primary.dark} 100%)`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: { xs: 'center', sm: 'space-between' },
              alignItems: 'center',
              gap: { xs: 0.5, sm: 2 },
              py: { xs: 0.5, sm: 0 },
              minHeight: { xs: 'auto', sm: 64 },
            }}
          >
            {/* Mobile: First row - Title and profile photo */}
            <Box
              sx={{
                display: { xs: 'flex', sm: 'none' },
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: muiTheme.palette.primary.contrastText,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontSize: '1.1rem',
                }}
              >
                Saint Paul Crime Map
              </Typography>

              {/* User Account Menu - Mobile only */}
              {session ? (
                <Button
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 'auto',
                    px: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <Avatar
                    sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}
                    src={session.user?.image}
                    alt={session.user?.name || session.user?.email || 'User'}
                    imgProps={{ referrerPolicy: 'no-referrer' }}
                  >
                    {!session.user?.image && (session.user?.name?.[0] || session.user?.email?.[0])}
                  </Avatar>
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<AccountCircle />}
                  onClick={() => {
                    console.log('Sign in button clicked - mobile');
                    signIn('google', { callbackUrl: window.location.origin }).catch((error) => {
                      console.error('Sign in error:', error);
                    });
                  }}
                  size="small"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8rem',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Sign In
                </Button>
              )}
            </Box>

            {/* Desktop: Title - shown only on desktop */}
            <Typography
              variant="h6"
              component="h1"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 'bold',
                color: muiTheme.palette.primary.contrastText,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: '1.25rem',
              }}
            >
              Saint Paul Crime Map
            </Typography>

            {/* Controls - Center on desktop, full width on mobile */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              <FormControl
                variant="outlined"
                size="small"
                sx={{
                  minWidth: { xs: '100%', sm: 200 },
                  maxWidth: { xs: '300px', sm: 'none' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: 'white',
                    },
                  },
                  '& .MuiSelect-icon': {
                    color: 'white',
                  },
                }}
              >
                <InputLabel id="crime-select-label">Crime Data</InputLabel>
                <Select
                  labelId="crime-select-label"
                  value={option}
                  onChange={onOptionChange}
                  label="Crime Data"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {dataSelection.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={onFilterClick}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: { xs: '300px', sm: 'none' },
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Filters
              </Button>
            </Box>

            {/* Desktop: User Account Menu */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
              {session ? (
                <>
                  <Button
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 'auto',
                      px: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}
                      src={session.user?.image}
                      alt={session.user?.name || session.user?.email || 'User'}
                      imgProps={{ referrerPolicy: 'no-referrer' }}
                    >
                      {!session.user?.image &&
                        (session.user?.name?.[0] || session.user?.email?.[0])}
                    </Avatar>
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{
                      sx: { mt: 1.5, minWidth: 200 },
                    }}
                  >
                    {dashboardEnabled && (
                      <MenuItem
                        onClick={() => {
                          setAnchorEl(null);
                          router.push('/dashboard');
                        }}
                      >
                        <ListItemIcon>
                          <DashboardIcon fontSize="small" />
                        </ListItemIcon>
                        Dashboard
                      </MenuItem>
                    )}
                    <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                        router.push('/account');
                      }}
                    >
                      <ListItemIcon>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      Account
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                        router.push('/pricing');
                      }}
                    >
                      <ListItemIcon>
                        <CreditCard fontSize="small" />
                      </ListItemIcon>
                      Pricing
                    </MenuItem>
                    {session.user?.isAdmin && (
                      <MenuItem
                        onClick={() => {
                          setAnchorEl(null);
                          router.push('/admin');
                        }}
                      >
                        <ListItemIcon>
                          <AdminPanelSettings fontSize="small" />
                        </ListItemIcon>
                        Admin Dashboard
                      </MenuItem>
                    )}
                    <MenuItem disabled>
                      <Typography variant="body2" color="text.secondary">
                        {session.user?.subscriptionTier || 'Free'} Plan
                      </Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                        signOut();
                      }}
                    >
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      Sign Out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<AccountCircle />}
                  onClick={() => {
                    console.log('Sign in button clicked - desktop');
                    signIn('google', { callbackUrl: window.location.origin }).catch((error) => {
                      console.error('Sign in error:', error);
                    });
                  }}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Sign In
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Clean navigation tabs below header for signed-in users */}
      {session && (
        <Paper
          sx={{
            borderRadius: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 0.25, sm: 1 } }}>
              <Tabs
                value={getCurrentTabValue()}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    minHeight: { xs: 40, sm: 'auto' },
                    py: { xs: 0.25, sm: 1 },
                    px: { xs: 1, sm: 3 },
                    fontSize: { xs: '0.75rem', sm: '0.9rem' },
                    minWidth: { xs: 'auto', sm: 90 },
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '0.9rem', sm: '1.2rem' },
                    },
                  },
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                  },
                }}
              >
                <Tab icon={<MapIcon />} label="Map" iconPosition="start" />
                {dashboardEnabled && (
                  <Tab icon={<DashboardIcon />} label="Dashboard" iconPosition="start" />
                )}
                <Tab icon={<Person />} label="Account" iconPosition="start" />
              </Tabs>
            </Box>
          </Container>
        </Paper>
      )}
    </React.Fragment>
  );
}
