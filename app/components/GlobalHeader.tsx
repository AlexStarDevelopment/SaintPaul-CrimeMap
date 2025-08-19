'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Person,
  Dashboard as DashboardIcon,
  AdminPanelSettings,
  Home,
} from '@mui/icons-material';
import { useTheme as useMUITheme } from '@mui/material/styles';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function GlobalHeader() {
  const muiTheme = useMUITheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardEnabled, setDashboardEnabled] = useState<boolean>(true);

  useEffect(() => {
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

  // Don't show header on signin pages or home page (home page has Navigation component)
  if (pathname?.startsWith('/auth/') || pathname === '/') {
    return null;
  }

  return (
    <AppBar
      position="sticky"
      sx={{
        background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.primary.dark} 100%)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 1100,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          {/* Logo/Title - Clickable to go home */}
          <Button
            onClick={() => router.push('/')}
            sx={{
              color: muiTheme.palette.primary.contrastText,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              Saint Paul Crime Map
            </Typography>
          </Button>

          {/* Center section - Page-specific controls (filled by pages) */}
          <Box sx={{ flex: 1 }} />

          {/* Right side - User Account Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* User Account Menu */}
            {session ? (
              <>
                <Button
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
                    src={session.user?.image}
                    alt={session.user?.name || session.user?.email || 'User'}
                    imgProps={{ referrerPolicy: 'no-referrer' }}
                  >
                    {!session.user?.image && (session.user?.name?.[0] || session.user?.email?.[0])}
                  </Avatar>
                  <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {session.user?.name || session.user?.email}
                  </Typography>
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  PaperProps={{
                    sx: { mt: 1.5, minWidth: 200 },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      router.push('/');
                    }}
                  >
                    <ListItemIcon>
                      <Home fontSize="small" />
                    </ListItemIcon>
                    Crime Map
                  </MenuItem>
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
                onClick={() => signIn()}
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
  );
}
