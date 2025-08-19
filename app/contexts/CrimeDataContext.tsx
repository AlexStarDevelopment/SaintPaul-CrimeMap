'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Crime } from '@/types';

interface CrimeDataState {
  items: Crime[];
  isLoading: boolean;
  selectedMonth: string;
  selectedYear: number;
  lastUpdated: Date | null;
}

interface CrimeDataContextType {
  crimeData: CrimeDataState;
  updateCrimeData: (data: {
    items: Crime[];
    isLoading: boolean;
    selectedMonth: string;
    selectedYear: number;
  }) => void;
  loadDefaultData: () => Promise<void>;
  getCrimesForLocation: (lat: number, lng: number, radiusKm?: number) => Crime[];
  getCrimeStats: (crimes: Crime[]) => {
    totalCrimes: number;
    crimesByType: Record<string, number>;
    crimesByNeighborhood: Record<string, number>;
    crimesByTimeOfDay: Record<string, number>;
  };
}

const CrimeDataContext = createContext<CrimeDataContextType | undefined>(undefined);

interface CrimeDataProviderProps {
  children: ReactNode;
}

export function CrimeDataProvider({ children }: CrimeDataProviderProps) {
  const [crimeData, setCrimeData] = useState<CrimeDataState>({
    items: [],
    isLoading: true,
    selectedMonth: '',
    selectedYear: new Date().getFullYear(),
    lastUpdated: null,
  });

  const updateCrimeData = useCallback(
    (data: { items: Crime[]; isLoading: boolean; selectedMonth: string; selectedYear: number }) => {
      setCrimeData((prevData) => {
        // Only update if the data has actually changed (simplified check)
        if (
          prevData.items.length === data.items.length &&
          prevData.isLoading === data.isLoading &&
          prevData.selectedMonth === data.selectedMonth &&
          prevData.selectedYear === data.selectedYear &&
          prevData.items.length > 0 // Don't skip if we're going from empty to populated
        ) {
          return prevData; // No change, return previous state
        }
        return {
          ...data,
          lastUpdated: new Date(),
        };
      });
    },
    []
  );

  // Filter crimes within radius of a location (in kilometers)
  const getCrimesForLocation = useCallback(
    (lat: number, lng: number, radiusKm: number = 1.0): Crime[] => {
      if (!crimeData.items.length) return [];

      return crimeData.items.filter((crime) => {
        if (!crime.LAT || !crime.LON) return false;

        const distance = calculateDistance(lat, lng, crime.LAT, crime.LON);
        return distance <= radiusKm;
      });
    },
    [crimeData.items]
  );

  // Calculate statistics from crime data
  const getCrimeStats = useCallback((crimes: Crime[]) => {
    const totalCrimes = crimes.length;
    const crimesByType: Record<string, number> = {};
    const crimesByNeighborhood: Record<string, number> = {};
    const crimesByTimeOfDay: Record<string, number> = {};

    crimes.forEach((crime) => {
      // Crime type
      const type = crime.INCIDENT || 'Unknown';
      crimesByType[type] = (crimesByType[type] || 0) + 1;

      // Neighborhood
      const neighborhood = crime.NEIGHBORHOOD_NAME || 'Unknown';
      crimesByNeighborhood[neighborhood] = (crimesByNeighborhood[neighborhood] || 0) + 1;

      // Time of day (requires parsing DATE field)
      if (crime.DATE) {
        const hour = new Date(parseInt(crime.DATE)).getHours();
        let timeOfDay: string;

        if (hour >= 6 && hour < 12) {
          timeOfDay = 'morning';
        } else if (hour >= 12 && hour < 18) {
          timeOfDay = 'afternoon';
        } else if (hour >= 18 && hour < 22) {
          timeOfDay = 'evening';
        } else {
          timeOfDay = 'night';
        }

        crimesByTimeOfDay[timeOfDay] = (crimesByTimeOfDay[timeOfDay] || 0) + 1;
      }
    });

    return {
      totalCrimes,
      crimesByType,
      crimesByNeighborhood,
      crimesByTimeOfDay,
    };
  }, []);

  // Function to load default crime data (most recent month)
  const loadDefaultData = useCallback(async () => {
    try {
      setCrimeData((prev) => ({ ...prev, isLoading: true }));

      // Use the same default data selection as the main page (first item = most recent)
      const defaultSelection = { month: 'june', year: 2025 }; // Most recent data

      // Get total crimes first to determine pagination
      const totalResponse = await fetch(
        `/api/total-crimes?type=${defaultSelection.month}&year=${defaultSelection.year}&limit=20000`
      );
      const totalData = await totalResponse.json();

      const numPages = totalData.totalPages;
      const promises = [];

      // Fetch all pages
      for (let i = 1; i <= numPages; i++) {
        promises.push(
          fetch(
            `/api/crimes?type=${defaultSelection.month}&year=${defaultSelection.year}&page=${i}&limit=20000`
          ).then((res) => res.json())
        );
      }

      const allResponses = await Promise.all(promises);
      const crimesArray: Crime[] = [];

      allResponses.forEach((res) => {
        res.crimes.forEach((crime: Crime) => {
          crimesArray.push(crime);
        });
      });

      setCrimeData({
        items: crimesArray,
        isLoading: false,
        selectedMonth: defaultSelection.month,
        selectedYear: defaultSelection.year,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setCrimeData((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  return (
    <CrimeDataContext.Provider
      value={{
        crimeData,
        updateCrimeData,
        loadDefaultData,
        getCrimesForLocation,
        getCrimeStats,
      }}
    >
      {children}
    </CrimeDataContext.Provider>
  );
}

export function useCrimeData() {
  const context = useContext(CrimeDataContext);
  if (context === undefined) {
    throw new Error('useCrimeData must be used within a CrimeDataProvider');
  }
  return context;
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
