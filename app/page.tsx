'use client';
import dynamic from 'next/dynamic';
import { ChangeEvent, useEffect, useState } from 'react';
import ReactGA from 'react-ga';
import { dataSelection, themes } from './const';
import { Crime } from './models/models';
import DrawerBasic from './components/drawer';
import { getCrimes, getTotalCrimes } from './api/getCrimes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { Box } from '@mui/material';
import { Dayjs } from 'dayjs';
ReactGA.initialize('G-8VSBZ6SFBZ');

const MyMap = dynamic(() => import('./components/map'), {
  ssr: false,
});

export default function Home() {
  const handleClick = () => {
    ReactGA.event({
      category: 'Click',
      action: 'coffeeClick',
      label: 'coffee',
    });
    window.open('https://buy.stripe.com/fZeg14aol2JRgnu8ww', '_blank');
  };

  const [option, setOption] = useState<number>(dataSelection[0].id);
  const [theme, setTheme] = useState<string>('');
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'cmyk'; // Default to cmyk
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [items, setItems] = useState<Crime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [crimeType, setCrimeType] = useState('ALL');
  const [neighborhood, setNeighborhood] = useState('ALL');

  const filteredItems = (): Crime[] => {
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
      } catch (error) {
        console.error('Error fetching crime data:', error);
        setItems([]); // Clear items on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrimeData();
    setCrimeType('ALL');
    setNeighborhood('ALL');
    setStartDate(null);
    setEndDate(null);
  }, [currentPage, option]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral text-neutral-content">
      <Box sx={{ width: '100%', padding: '0.5rem' }} className="bg-primary text-primary-content">
        <Box sx={{ width: '100%' }} className="inline-block">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <h1 className="text-base p-0 bg-transparent text-left">Saint Paul Crime Map</h1>
          </Box>
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label htmlFor="data-select" className="text-sm font-bold mb-1">
                Select Data:
              </label>
              <select
                id="data-select"
                aria-label="Select data option"
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setOption(Number(e.target.value))}
                className="select select-primary select-sm w-full max-w-xs bg-base-100 text-base-content border border-primary"
                value={option}
              >
                {dataSelection.map((x) => {
                  return (
                    <option key={x.id} value={x.id}>
                      {x.month.toUpperCase() + ' - ' + x.year}
                    </option>
                  );
                })}
              </select>
              <label htmlFor="theme-select" className="text-sm font-bold mb-1">
                Select Theme:
              </label>
              <select
                id="theme-select"
                aria-label="Select theme"
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTheme(e.target.value)}
                className="select select-primary select-sm w-full max-w-xs bg-base-100 text-base-content border border-primary"
                value={theme}
              >
                {themes.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </Box>
            <Box
              sx={{ margin: '0.25rem' }}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              aria-label="Toggle filters"
            >
              <FontAwesomeIcon height={20} width={14} icon={faFilter} color="black" />
            </Box>
          </Box>
        </Box>
      </Box>
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
      <div className="flex justify-center items-center h-[70vh] w-[75vw] border-2 m-2 z-1">
        <MyMap items={filteredItems()} isLoading={isLoading} />
      </div>
      <button
        className="btn btn-primary bg-primary text-primary-content border border-primary hover:bg-primary-focus"
        onClick={handleClick}
      >
        Buy me a latte at Amore
      </button>
      <div className="card w-full bg-primary text-primary-content m-1">
        <div className="card-body items-center text-center">
          <h3 className="card-title">About</h3>
          <p className="m-2">
            My name is Alex and I live on the Westside in Saint Paul. I can never find good crime
            maps of Saint Paul, and the public data access spreadsheets are really buggy and hard to
            work with. I figured if I was having trouble navigating these resources, others would be
            too. Building this app, it was still very difficult to work with the data that the city
            provides, and I had to do a lot of cleanup to get the data usable for mapping on this
            app. I have spent many hours correcting incorrect data and looking up gps coordinates
            for cross streets by hand!
          </p>
          <p className="m-2">
            I have loved living here for the past 4 years and have never had any serious run-ins
            with crime. However, I like to stay informed! I make no claims with this app, and the
            purpose is not political or to perpetuate fear - it is simply to stay informed. If you
            like this app, please let me know. If you REALLY like it and want to buy me a cup of
            coffee from Amore on Annapolis and Smith, I have included a button above. Please do not
            feel obligated and only do so if you want and are able! THANK YOU!
          </p>
        </div>
      </div>
      <div className="card w-full bg-primary text-primary-content m-2">
        <div className="card-body items-center text-center">
          <h3 className="card-title">Limitations</h3>
          <p className="m-2">
            Data provided by the city is not exact and locations are approximate. Addresses from the
            city are obfuscated for privacy so I round dates to the middle. Ex: 1XX Robert St will
            become 150 Robert St. Only crimes that have been reported and entered into the cities
            database will be displayed
          </p>
        </div>
      </div>
      <div className="card w-full bg-primary text-primary-content m-2">
        <div className="card-body items-center text-center">
          <h3 className="card-title">Change Log</h3>
          <p className="m-2">
            07/03/25 2.0.0 - We have added June 2025 data, cleaned up old data, and made sure you
            can select your own theme and it stays just how you like it. Enjoy the fresh new look
            and feel!
          </p>
          <p className="m-2">
            06/10/25 1.9 - May data added. All 2025 updated as of today. Thank you for one year
            theme!
          </p>
          <p className="m-2">
            05/13/25 1.8.9 - March / April data added. All 2025 updated as of today
          </p>
          <p className="m-2">03/30/25 1.8.9 - February data added. All 2025 updated as of today</p>
          <p className="m-2">
            02/17/25 1.8.8 - Sorry for the delay in the most recent data. I have a new job now and I
            am settling in well so I took some time to come back to this app and was thrilled to see
            all the traffic and its #1 google ranking! I have updated the app to add december 2024,
            january 2025, and all 2024 is now all of 2024! Another year in the books! Thanks for the
            support.
          </p>
          <p className="m-2">12/11/24 1.8.7 - November data added - All 2024 Data updated</p>
          <p className="m-2">11/18/24 1.8.6 - October data added - All 2024 Data updated</p>
          <p className="m-2">10/15/24 1.8.5 - September data added - All 2024 Data updated</p>
          <p className="m-2">10/4/24 1.8.4 - September data added</p>
          <p className="m-2">9/14/24 1.8.3 - August data added</p>
          <p className="m-2">8/8/24 1.8.2 - Second half of July data added</p>
          <p className="m-2">7/22/24 1.8.1 - Data fixes for university ave</p>
          <p className="m-2">7/18/24 1.8.0 - Added July data and locations to each incident</p>
          <p className="m-2">
            7/15/24 1.7.0 - Filter menu added with support for filtering by date
          </p>
          <p className="m-2">
            7/14/24 1.6.0 - Filter menu added with support for filtering by neighborhood
          </p>
          <p className="m-2">
            7/10/24 1.5.0 - Filter menu added with support for filtering by crime types
          </p>
          <p className="m-2">7/4/24 1.4.1 - Fixed loading issues for years 2015-2022</p>
          <p className="m-2">7/3/24 1.4.0 - All data for 2014 - 2022 added.</p>
          <p className="m-2">
            7/2/24 1.3.0 - June 2024 data added. April, March, February, and January data added. All
            available for 2024 expanded to entire city. All 2023 data added.
          </p>
          <p className="m-2">
            6/20/24 1.2.0 - Expanded May 2024 data to include the entire city of Saint Paul. Widened
            text cards on desktop
          </p>
          <p className="m-2">
            6/19/24 1.1.0 - Added new dropdown feature which allows switching between May 2024 and
            All 2024 data available. Fixed minor issue with addresses on HALL. Crimes provided by
            the city via cross streets are now more accurate. Added change log.
          </p>
          <p className="m-2">6/18/24 1.0.2 - Added new icons for each offense</p>
          <p className="m-2">6/17/24 1.0.1 - Added dates to each offense</p>
          <p className="m-2">6/14/24 1.0.0 - Initial Release</p>
        </div>
      </div>
      <div className="card w-full bg-primary text-primary-content m-2">
        <div className="card-body items-center text-center">
          <h3 className="card-title">Disclaimer</h3>
          <p className="m-2">
            City of Saint Paul Disclaimer: This data is public domain. This data are provided to you
            “as is” and without any warranty as to their performance, merchantability, or fitness
            for any particular purpose. The City of Saint Paul does not represent or warrant that
            the data or the data documentation are error-free, complete, current, or accurate. You
            are responsible for any consequences resulting from your use of the data or your
            reliance on the data.
          </p>
        </div>
      </div>
    </main>
  );
}
