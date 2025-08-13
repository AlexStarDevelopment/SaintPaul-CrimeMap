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
import { FilterList, AccountCircle, Logout, Person } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTheme as useMUITheme } from '@mui/material/styles';
import { dataSelection } from '../const';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
            flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
            justifyContent: { xs: 'center', sm: 'space-between' }, // Center on mobile, space-between on desktop
            alignItems: 'center',
            gap: { xs: 1, sm: 0 }, // Add gap between stacked items on mobile
            py: { xs: 1, sm: 0 }, // Add some vertical padding on mobile
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: muiTheme.palette.primary.contrastText,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }, // Smaller text on mobile
              textAlign: { xs: 'center', sm: 'left' }, // Center text on mobile
              mb: { xs: 1, sm: 0 }, // Add margin bottom on mobile
            }}
          >
            Saint Paul Crime Map
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Stack controls vertically on mobile
              alignItems: 'center',
              gap: { xs: 1, sm: 2 }, // Less gap on mobile
              width: { xs: '100%', sm: 'auto' }, // Full width on mobile
            }}
          >
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                minWidth: { xs: '100%', sm: 200 }, // Full width on mobile
                maxWidth: { xs: '300px', sm: 'none' }, // Max width on mobile for better UX
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
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              }}
            >
              <InputLabel id="data-selection-label">Data Period</InputLabel>
              <Select
                labelId="data-selection-label"
                value={option}
                label="Data Period"
                onChange={onOptionChange}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'background.paper',
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      },
                    },
                  },
                }}
              >
                {dataSelection.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.month.toUpperCase()} - {item.year}
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
                width: { xs: '100%', sm: 'auto' }, // Full width on mobile
                maxWidth: { xs: '300px', sm: 'none' }, // Max width on mobile
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Filters
            </Button>

            {/* User Account Section */}
            {status === 'loading' ? (
              <Box sx={{ width: 40, height: 40 }} />
            ) : session ? (
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
                    src={session.user?.image || undefined}
                  >
                    {session.user?.name?.[0] || session.user?.email?.[0]}
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
                      router.push('/account');
                    }}
                  >
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    Account
                  </MenuItem>
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
