'use client';
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
} from '@mui/material';
import {
  FilterList,
  AccountCircle,
  Logout,
  Person,
  Dashboard as DashboardIcon,
  AdminPanelSettings,
  Home,
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
}

export default function Navigation({ option, onOptionChange, onFilterClick }: NavigationProps) {
  const muiTheme = useMUITheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardEnabled, setDashboardEnabled] = useState<boolean>(true);

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
            gap: { xs: 1, sm: 0 },
            py: { xs: 1, sm: 0 },
          }}
        >
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: muiTheme.palette.primary.contrastText,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' },
              mb: { xs: 1, sm: 0 },
            }}
          >
            Saint Paul Crime Map
          </Typography>

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
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: { xs: '300px', sm: 'none' },
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
