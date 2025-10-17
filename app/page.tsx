'use client';
import dynamic from 'next/dynamic';
import { ChangeEvent, useEffect, useState, useMemo } from 'react';
import { dataSelection } from './const';
import { Crime } from '@/types';
import DrawerBasic from './components/drawer';
import Navigation from './components/Navigation';
import { getCrimes, getTotalCrimes } from './api/getCrimes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { Dayjs } from 'dayjs';
import { Container, Card, CardContent, Box, Button, Typography } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import { useCrimeData } from './contexts/CrimeDataContext';
import { useSession } from 'next-auth/react';
import AccountBenefitsDialog from './components/AccountBenefitsDialog';

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

const MyMap = dynamic(() => import('./components/map'), {
  ssr: false,
});

export default function Home() {
  const theme = useTheme();
  const { updateCrimeData } = useCrimeData();
  const { data: session, status } = useSession();

  const handleClick = () => {
    // Track analytics event using modern gtag
    if (typeof window !== 'undefined') {
      try {
        if (window.gtag) {
          window.gtag('event', 'click', {
            event_category: 'engagement',
            event_label: 'support_button',
            value: 1,
          });
        }
      } catch (error) {
        console.warn('Failed to track analytics event:', error);
      }
      window.open('https://buy.stripe.com/7sY7sLfBcfV3dsZaj85Ne01', '_blank');
    }
  };

  const [option, setOption] = useState<number>(dataSelection[0].id);

  const handleOptionChange = (event: SelectChangeEvent<number>) => {
    const newOption = event.target.value as number;
    setOption(newOption);
  };
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [items, setItems] = useState<Crime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [crimeType, setCrimeType] = useState('ALL');
  const [neighborhood, setNeighborhood] = useState('ALL');
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  const filteredItems = useMemo((): Crime[] => {
    const filteredItems =
      crimeType === 'ALL'
        ? items
        : items.filter((i) => i.INCIDENT?.toUpperCase() === crimeType.toUpperCase());

    const filteredItemsNeighborhood =
      neighborhood === 'ALL'
        ? filteredItems
        : filteredItems.filter(
            (i) => i.NEIGHBORHOOD_NAME.toUpperCase() === neighborhood.toUpperCase()
          );

    const filteredItemsStartDate =
      startDate === null
        ? filteredItemsNeighborhood
        : filteredItemsNeighborhood.filter((i) => Number(i.DATE) >= startDate.valueOf());

    const filteredItemsEndDate =
      endDate === null
        ? filteredItemsStartDate
        : filteredItemsStartDate.filter((i) => Number(i.DATE) <= endDate.valueOf() + 86399000);
    return filteredItemsEndDate;
  }, [items, crimeType, neighborhood, startDate, endDate]);

  // Show account benefits dialog for new, non-signed-in users
  useEffect(() => {
    // Only show if user is not signed in and hasn't seen the dialog before
    if (status !== 'loading' && !session) {
      const hasSeenDialog = localStorage.getItem('hasSeenAccountDialog');
      if (!hasSeenDialog) {
        // Delay showing the dialog slightly to let the page load
        const timer = setTimeout(() => {
          setShowAccountDialog(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [session, status]);

  const handleCloseAccountDialog = () => {
    setShowAccountDialog(false);
    // Mark that user has seen the dialog so it doesn't show again
    localStorage.setItem('hasSeenAccountDialog', 'true');
  };

  useEffect(() => {
    const fetchCrimeData = async () => {
      setIsLoading(true);
      try {
        const selectedData = dataSelection.find((i) => i.id === option);
        if (!selectedData) {
          console.error('Selected data option not found.');
          setItems([]);
          return;
        }

        const totalCrimesResponse = await getTotalCrimes(
          selectedData.month,
          selectedData.year,
          20000
        );

        const numPages = totalCrimesResponse.totalPages;
        const promises = [];

        for (let i = 1; i <= numPages; i++) {
          promises.push(getCrimes(selectedData.month, selectedData.year, i, 20000));
        }

        const allCrimesResponses = await Promise.all(promises);
        const crimesArray: Crime[] = [];
        allCrimesResponses.forEach((res) => {
          res.crimes.forEach((crime) => {
            crimesArray.push(crime);
          });
        });
        setItems(crimesArray);

        // Update shared crime data context
        updateCrimeData({
          items: crimesArray,
          isLoading: false,
          selectedMonth: selectedData.month,
          selectedYear: selectedData.year,
        });
      } catch (error) {
        console.error('Error fetching crime data:', error);
        setItems([]); // Clear items on error

        // Update context with empty data on error
        const selectedData = dataSelection.find((i) => i.id === option);
        updateCrimeData({
          items: [],
          isLoading: false,
          selectedMonth: selectedData?.month || '',
          selectedYear: selectedData?.year || new Date().getFullYear(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrimeData();
    setCrimeType('ALL');
    setNeighborhood('ALL');
    setStartDate(null);
    setEndDate(null);
  }, [currentPage, option, updateCrimeData]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Navigation Header */}
      <Navigation
        option={option}
        onOptionChange={handleOptionChange}
        onFilterClick={() => setIsFiltersOpen(true)}
        currentPage="map"
      />

      {/* Main Content */}
      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 1, sm: 2 }, // Less padding on mobile
          px: { xs: 1, sm: 2 }, // Less horizontal padding on mobile
        }}
      >
        {/* Filters Drawer */}
        {isFiltersOpen && (
          <Card
            sx={{
              mb: { xs: 1, sm: 2 }, // Less margin on mobile
              backgroundColor: theme.palette.background.paper,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <DrawerBasic
                items={items}
                setCrimeTypes={setCrimeType}
                setNeighborhood={setNeighborhood}
                isFiltersOpen={isFiltersOpen}
                setIsFiltersOpen={setIsFiltersOpen}
                crimeType={crimeType}
                neighborhood={neighborhood}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
              />
            </CardContent>
          </Card>
        )}

        {/* Map Card */}
        <Card sx={{ mb: { xs: 1, sm: 1.5 } }}>
          {/* Less margin on mobile */}
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: {
                  xs: '50vh', // Mobile: 50% of viewport height
                  sm: '55vh', // Small tablets: 55%
                  md: '60vh', // Medium screens: 60%
                  lg: '65vh', // Large screens: 65%
                },
                width: '100%',
                minHeight: {
                  xs: '300px', // Mobile minimum height
                  sm: '400px', // Tablet minimum height
                  md: '500px', // Desktop minimum height
                },
                maxHeight: {
                  xs: '400px', // Mobile maximum height
                  sm: '500px', // Tablet maximum height
                  md: '600px', // Desktop maximum height
                },
              }}
            >
              <MyMap items={filteredItems} isLoading={isLoading} />
            </Box>
          </CardContent>
        </Card>

        {/* Quick Support Button - Subtle placement for immediate supporters */}
        <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
            Love this tool? Support Saint Paul&apos;s #1 crime resource
          </Typography>
          <Button
            variant="outlined"
            onClick={handleClick}
            sx={{
              borderColor: (theme) =>
                theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.5)',
              color: (theme) =>
                theme.palette.mode === 'light' ? theme.palette.text.primary : 'white',
              '&:hover': {
                borderColor: (theme) =>
                  theme.palette.mode === 'light' ? theme.palette.primary.main : 'white',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Support This Resource
          </Button>
        </Box>

        {/* About Section */}
        <Card
          sx={{
            mb: { xs: 1.5, sm: 2 },
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <CardContent
            sx={{
              textAlign: 'center',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 },
            }}
          >
            <Typography variant="h5" component="h3" gutterBottom>
              About
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              My name is Alex and I live on the Westside in Saint Paul. I couldn&apos;t find
              reliable crime maps for our city - the public data spreadsheets are buggy and nearly
              impossible to use. I figured if I was having trouble accessing this critical safety
              information, others would be too. Building this tool took extensive work cleaning the
              city&apos;s messy data, hand-correcting GPS coordinates, and making it actually usable
              for our community.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              What started as a personal project has become Saint Paul&apos;s #1 crime resource,
              with thousands of monthly users who depend on accurate, up-to-date safety information.
              I spend 15-20 hours monthly maintaining this tool, ensuring it stays reliable when
              other resources fail. If this helps you stay informed about your neighborhood&apos;s
              safety, please consider supporting its continued development.
            </Typography>
          </CardContent>
        </Card>

        {/* Why This Tool Matters Section */}
        <Card
          sx={{
            mb: { xs: 1.5, sm: 2 },
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <CardContent
            sx={{
              textAlign: 'center',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 },
            }}
          >
            <Typography variant="h5" component="h3" gutterBottom>
              Why This Tool Matters
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Unlike other crime resources, this tool actually works:</strong>
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'left' }}>
              • <strong>#1 Google ranking</strong> for Saint Paul crime data
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'left' }}>
              • <strong>Monthly updates</strong> with cleaned, verified data
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'left' }}>
              • <strong>Hand-corrected GPS coordinates</strong> for accurate mapping
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'left' }}>
              • <strong>No crashes or bugs</strong> like the city&apos;s official tools
            </Typography>
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'left' }}>
              • <strong>Free for everyone</strong> in our community
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
              <strong>Monthly costs to maintain this resource:</strong> Server hosting, data
              processing, and 20+ hours of manual updates to ensure accuracy.
            </Typography>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card
          sx={{
            mb: { xs: 1.5, sm: 2 },
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            border: 2,
            borderColor: 'primary.light',
          }}
        >
          <CardContent
            sx={{
              textAlign: 'center',
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 },
            }}
          >
            <Typography variant="h5" component="h3" gutterBottom>
              Support Saint Paul&apos;s Crime Data Resource
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This tool has grown from a personal project to the most trusted crime resource in
              Saint Paul. Maintaining this level of accuracy and reliability requires ongoing
              investment.
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              <strong>Join hundreds of Saint Paul residents</strong> who support keeping this
              critical safety resource free and updated for our entire community.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Button
                variant="outlined"
                onClick={handleClick}
                size="large"
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  borderColor: (theme) =>
                    theme.palette.mode === 'light'
                      ? 'rgba(0, 0, 0, 0.23)'
                      : 'rgba(255, 255, 255, 0.5)',
                  color: (theme) =>
                    theme.palette.mode === 'light' ? theme.palette.text.primary : 'white',
                  '&:hover': {
                    borderColor: (theme) =>
                      theme.palette.mode === 'light' ? theme.palette.primary.main : 'white',
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Support This Resource
              </Button>
              <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.9 }}>
                (Buy Alex a coffee at Amore)
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Limitations Section */}
        <Card
          sx={{
            mb: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" component="h3" gutterBottom>
              Limitations
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Data provided by the city is not exact and locations are approximate. Addresses from
              the city are obfuscated for privacy so I round dates to the middle. Ex: 1XX Robert St
              will become 150 Robert St. Only crimes that have been reported and entered into the
              cities database will be displayed
            </Typography>
          </CardContent>
        </Card>
        {/* Change Log Section */}
        <Card
          sx={{
            mb: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <CardContent>
            <Typography variant="h5" component="h3" gutterBottom sx={{ textAlign: 'center' }}>
              Development History
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', fontStyle: 'italic' }}>
              <strong>Over 25 major updates</strong> in the past year - demonstrating ongoing
              commitment to Saint Paul&apos;s most reliable crime data resource:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              10/16/25 4.2.0 - August and September 2025 crime data added to dropdown selector. All
              2025 data (January-September) now available. Dropdown reorganized in reverse
              chronological order for easier navigation.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              10/10/25 4.1.0 - July 2025 crime data added to dropdown selector. All 2025 data
              (January-July) updated with the most recent available information. NOTE: Due to the
              Saint Paul digital security incident, the police department has been experiencing
              delays in publishing the most up-to-date crime data. We are keeping a close eye on it
              and will update the map as soon as new data is released by the city.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              08/20/25 4.0.1 - Minor bug fixed in the dashboard preventing users from changing
              between 7 and 30 days in crime stats.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              08/19/25 4.0.0 - MAJOR UPDATE: Personal Crime Dashboard! Save up to 2 locations (more
              coming soon), track crime statistics with safety scores, view recent incidents in your
              areas, and monitor crime trends. Plus: Improved navigation with compact mobile design,
              new account benefits dialog, foundation for upcoming subscription features. The most
              comprehensive update yet!
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              08/18/25 3.1.1 - Small bug fixes to account themes.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              08/17/25 3.1.0 - NEW: User accounts now available! Create an account to save your
              preferred theme settings, access personalized dashboard features, and get a customized
              experience. Also includes major performance improvements: faster page loading, quicker
              map rendering, cleaner navigation, and enhanced reliability across all devices.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              08/01/25 3.0.0 - Updates to the map component package. Updates to all 2025 crime data.
              Another major makeover and component upgrade.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              07/03/25 2.0.0 - We have added June 2025 data, cleaned up old data, and made sure you
              can select your own theme and it stays just how you like it. Enjoy the fresh new look
              and feel!
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              06/10/25 1.9 - May data added. All 2025 updated as of today. Thank you for one year
              theme!
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              05/13/25 1.8.9 - March / April data added. All 2025 updated as of today
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              03/30/25 1.8.9 - February data added. All 2025 updated as of today
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              02/17/25 1.8.8 - Sorry for the delay in the most recent data. I have a new job now and
              I am settling in well so I took some time to come back to this app and was thrilled to
              see all the traffic and its #1 google ranking! I have updated the app to add december
              2024, january 2025, and all 2024 is now all of 2024! Another year in the books! Thanks
              for the support.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              12/11/24 1.8.7 - November data added - All 2024 Data updated
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              11/18/24 1.8.6 - October data added - All 2024 Data updated
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              10/15/24 1.8.5 - September data added - All 2024 Data updated
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              10/4/24 1.8.4 - September data added
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              9/14/24 1.8.3 - August data added
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              8/8/24 1.8.2 - Second half of July data added
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/22/24 1.8.1 - Data fixes for university ave
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/18/24 1.8.0 - Added July data and locations to each incident
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/15/24 1.7.0 - Filter menu added with support for filtering by date
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/14/24 1.6.0 - Filter menu added with support for filtering by neighborhood
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/10/24 1.5.0 - Filter menu added with support for filtering by crime types
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/4/24 1.4.1 - Fixed loading issues for years 2015-2022
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/3/24 1.4.0 - All data for 2014 - 2022 added.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              7/2/24 1.3.0 - June 2024 data added. April, March, February, and January data added.
              All available for 2024 expanded to entire city. All 2023 data added.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              6/20/24 1.2.0 - Expanded May 2024 data to include the entire city of Saint Paul.
              Widened text cards on desktop
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              6/19/24 1.1.0 - Added new dropdown feature which allows switching between May 2024 and
              All 2024 data available. Fixed minor issue with addresses on HALL. Crimes provided by
              the city via cross streets are now more accurate. Added change log.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              6/18/24 1.0.2 - Added new icons for each offense
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              6/17/24 1.0.1 - Added dates to each offense
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              6/14/24 1.0.0 - Initial Release
            </Typography>

            <Box
              sx={{
                textAlign: 'center',
                mt: 3,
                pt: 2,
                borderTop: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
            >
              <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                This level of dedication requires ongoing support to continue.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleClick}
                size="large"
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1, sm: 1.5 },
                  fontWeight: 'bold',
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                Help Keep This Resource Running
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Disclaimer Section */}
        <Card
          sx={{
            mb: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h5" component="h3" gutterBottom>
              Disclaimer
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              City of Saint Paul Disclaimer: This data is public domain. This data are provided to
              you &quot;as is&quot; and without any warranty as to their performance,
              merchantability, or fitness for any particular purpose. The City of Saint Paul does
              not represent or warrant that the data or the data documentation are error-free,
              complete, current, or accurate. You are responsible for any consequences resulting
              from your use of the data or your reliance on the data.
            </Typography>
          </CardContent>
        </Card>
      </Container>

      {/* Account Benefits Dialog */}
      <AccountBenefitsDialog open={showAccountDialog} onClose={handleCloseAccountDialog} />
    </Box>
  );
}
