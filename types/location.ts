export interface SavedLocation {
  _id?: string;
  userId: string;
  label: string; // "Home", "Work", "Mom's House"
  address: string; // Full address
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number; // in miles (0.25, 0.5, 1)
  notifications: {
    enabled: boolean;
    types: string[]; // Crime types to notify about
    severity: 'all' | 'serious' | 'violent';
  };
  isActive: boolean; // Whether to show on map
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  locationId: string;
  locationLabel: string;
  period: '7d' | '30d' | '90d' | '1y';
  totalCrimes: number;
  crimesByType: Record<string, number>;
  trendsData: {
    percentChange: number;
    direction: 'up' | 'down' | 'stable';
    previousPeriodTotal: number;
  };
  safetyScore: {
    score: number; // 0-100
    rating: 'safe' | 'moderate' | 'caution' | 'high-risk';
    factors: {
      frequency: number;
      severity: number;
      trends: number;
      timePatterns: number;
    };
  };
  timeDistribution: {
    hour: number;
    count: number;
  }[];
  dayDistribution: {
    day: string;
    count: number;
  }[];
}

export interface LocationLimits {
  free: number;
  supporter: number;
  pro: number;
}

export const LOCATION_LIMITS: LocationLimits = {
  free: 2,
  supporter: 5,
  pro: -1, // unlimited
};

export const RADIUS_OPTIONS = [
  { value: 0.25, label: '1/4 mile' },
  { value: 0.5, label: '1/2 mile' },
  { value: 1, label: '1 mile' },
];

export const CRIME_SEVERITY = {
  HOMICIDE: 10,
  RAPE: 9,
  AGGRAVATED_ASSAULT: 8,
  ROBBERY: 7,
  BURGLARY: 6,
  ARSON: 6,
  AUTO_THEFT: 5,
  THEFT: 4,
  SIMPLE_ASSAULT: 4,
  VANDALISM: 3,
  NARCOTICS: 3,
  GRAFFITI: 2,
  DISCHARGE: 2,
  PROACTIVE_POLICE_VISIT: 1,
  COMMUNITY_ENGAGEMENT_EVENT: 0,
};

export const calculateSeverityWeight = (crimeType: string): number => {
  const upperType = crimeType.toUpperCase().replace(/ /g, '_');
  return CRIME_SEVERITY[upperType as keyof typeof CRIME_SEVERITY] || 3;
};
