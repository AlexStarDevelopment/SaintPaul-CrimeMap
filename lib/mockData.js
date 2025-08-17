/**
 * Mock data service for dashboard functionality
 * Provides realistic test data without MongoDB calls
 */

// Mock crime incidents data
const mockCrimeIncidents = [
  {
    CASE_NUMBER: 'PC240001234',
    INCIDENT: 'THEFT',
    DATE: Date.now() - 86400000, // 1 day ago
    LAT: 44.9537,
    LON: -93.09,
    BLOCK: '100 E 7TH ST',
    distance: 0.2,
  },
  {
    CASE_NUMBER: 'PC240001235',
    INCIDENT: 'VANDALISM',
    DATE: Date.now() - 172800000, // 2 days ago
    LAT: 44.952,
    LON: -93.089,
    BLOCK: '200 W 6TH ST',
    distance: 0.3,
  },
  {
    CASE_NUMBER: 'PC240001236',
    INCIDENT: 'BURGLARY',
    DATE: Date.now() - 259200000, // 3 days ago
    LAT: 44.955,
    LON: -93.092,
    BLOCK: '300 N WABASHA ST',
    distance: 0.4,
  },
  {
    CASE_NUMBER: 'PC240001237',
    INCIDENT: 'ASSAULT',
    DATE: Date.now() - 345600000, // 4 days ago
    LAT: 44.954,
    LON: -93.088,
    BLOCK: '400 E 5TH ST',
    distance: 0.1,
  },
  {
    CASE_NUMBER: 'PC240001238',
    INCIDENT: 'THEFT',
    DATE: Date.now() - 432000000, // 5 days ago
    LAT: 44.956,
    LON: -93.091,
    BLOCK: '500 CEDAR ST',
    distance: 0.5,
  },
];

// Mock crime statistics by type
const mockCrimesByType = {
  THEFT: 45,
  VANDALISM: 23,
  BURGLARY: 18,
  ASSAULT: 12,
  'DRUG OFFENSE': 8,
  'VEHICLE THEFT': 6,
  FRAUD: 4,
  ROBBERY: 3,
  WEAPONS: 2,
  OTHER: 5,
};

// Mock locations data
const mockLocations = [
  {
    _id: 'mock-location-1',
    userId: 'mock-user-1',
    label: 'Home',
    address: '123 Main St, Saint Paul, MN',
    coordinates: { lat: 44.9537, lng: -93.09 },
    radius: 1.0,
    notifications: { enabled: true, types: ['THEFT', 'BURGLARY'], severity: 'medium' },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    _id: 'mock-location-2',
    userId: 'mock-user-1',
    label: 'Work',
    address: '456 Business Ave, Saint Paul, MN',
    coordinates: { lat: 44.952, lng: -93.088 },
    radius: 0.5,
    notifications: { enabled: false, types: [], severity: 'low' },
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
  },
];

// Mock safety scores
const mockSafetyScores = {
  'mock-location-1': {
    score: 75,
    rating: 'moderate',
    factors: {
      frequency: 70,
      severity: 80,
      trends: 75,
      timePatterns: 85,
    },
  },
  'mock-location-2': {
    score: 88,
    rating: 'safe',
    factors: {
      frequency: 90,
      severity: 85,
      trends: 88,
      timePatterns: 90,
    },
  },
};

/**
 * Mock service for crime data operations
 */
export const MockCrimeService = {
  /**
   * Get crimes in radius for a location (mock version)
   * @param {Object} location - Location object with coordinates and radius
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Mock crime data
   */
  async getCrimesInRadius(location, startDate, endDate) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Filter mock incidents by date range
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return mockCrimeIncidents.filter((crime) => {
      const crimeTime = crime.DATE;
      return crimeTime >= startTime && crimeTime <= endTime;
    });
  },

  /**
   * Get crime statistics for multiple locations
   * @param {Array} locations - Array of location objects
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Mock statistics for each location
   */
  async getCrimeStatsForLocations(locations, startDate, endDate) {
    await new Promise((resolve) => setTimeout(resolve, 150));

    return locations.map((location) => ({
      locationId: location._id,
      totalCrimes: Object.values(mockCrimesByType).reduce((sum, count) => sum + count, 0),
      crimesByType: mockCrimesByType,
      crimes: mockCrimeIncidents,
    }));
  },

  /**
   * Get all crime data for date range (cached mock version)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Mock crime data
   */
  async getCrimesByDateRange(startDate, endDate) {
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Return filtered mock incidents
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return mockCrimeIncidents.filter((crime) => {
      const crimeTime = crime.DATE;
      return crimeTime >= startTime && crimeTime <= endTime;
    });
  },
};

/**
 * Mock service for location operations
 */
export const MockLocationService = {
  /**
   * Get location by ID
   * @param {string} locationId - Location ID
   * @param {string} userId - User ID
   * @returns {Object|null} Mock location object
   */
  async getLocationById(locationId, userId) {
    await new Promise((resolve) => setTimeout(resolve, 50));

    return mockLocations.find((loc) => loc._id === locationId && loc.userId === userId) || null;
  },

  /**
   * Get all user locations
   * @param {string} userId - User ID
   * @returns {Array} Mock locations array
   */
  async getUserLocations(userId) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    return mockLocations.filter((loc) => loc.userId === userId && loc.isActive);
  },

  /**
   * Create a new location (mock)
   * @param {Object} locationData - Location data
   * @returns {Object} Created location with ID
   */
  async createLocation(locationData) {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const newLocation = {
      ...locationData,
      _id: `mock-location-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    // Add to mock array (in real app this would persist)
    mockLocations.push(newLocation);

    return newLocation;
  },

  /**
   * Update location (mock)
   * @param {string} locationId - Location ID
   * @param {string} userId - User ID
   * @param {Object} updates - Update data
   * @returns {Object} Updated location
   */
  async updateLocation(locationId, userId, updates) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const locationIndex = mockLocations.findIndex(
      (loc) => loc._id === locationId && loc.userId === userId
    );

    if (locationIndex === -1) {
      throw new Error('Location not found');
    }

    mockLocations[locationIndex] = {
      ...mockLocations[locationIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return mockLocations[locationIndex];
  },

  /**
   * Delete location (mark as inactive)
   * @param {string} locationId - Location ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async deleteLocation(locationId, userId) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const locationIndex = mockLocations.findIndex(
      (loc) => loc._id === locationId && loc.userId === userId
    );

    if (locationIndex === -1) {
      throw new Error('Location not found');
    }

    mockLocations[locationIndex].isActive = false;
    mockLocations[locationIndex].updatedAt = new Date();

    return true;
  },
};

/**
 * Mock dashboard service for complete dashboard data
 */
export const MockDashboardService = {
  /**
   * Get complete dashboard data for a user and location
   * @param {string} userId - User ID
   * @param {string} locationId - Location ID
   * @param {string} period - Time period (7d, 30d, 90d, 1y)
   * @returns {Object} Complete dashboard data
   */
  async getCompleteDashboardData(userId, locationId, period) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const location = await MockLocationService.getLocationById(locationId, userId);
    if (!location) {
      throw new Error('Location not found');
    }

    // Calculate date ranges
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    // Get mock data
    const crimes = await MockCrimeService.getCrimesInRadius(location, start, end);
    const safetyScore = mockSafetyScores[locationId] || mockSafetyScores['mock-location-1'];

    // Calculate trends (mock previous period)
    const previousTotal = Math.floor(crimes.length * (0.8 + Math.random() * 0.4)); // ±20% variation
    const percentChange =
      previousTotal > 0 ? ((crimes.length - previousTotal) / previousTotal) * 100 : 0;

    return {
      location: {
        id: location._id,
        label: location.label,
        address: location.address,
        radius: location.radius,
        coordinates: location.coordinates,
      },
      period,
      stats: {
        totalCrimes: crimes.length,
        crimesByType: mockCrimesByType,
        trendsData: {
          percentChange: Math.round(percentChange * 10) / 10,
          direction: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable',
          previousPeriodTotal: previousTotal,
        },
      },
      safetyScore,
      incidents: crimes.sort((a, b) => b.DATE - a.DATE).slice(0, 20),
      timestamp: new Date().toISOString(),
      mock: true, // Flag to indicate this is mock data
    };
  },
};

/**
 * Get mock cache status
 */
export function getMockCacheStatus() {
  return {
    hasData: true,
    lastFetched: Date.now() - 60000, // 1 minute ago
    isStale: false,
    documentCount: mockCrimeIncidents.length,
  };
}

/**
 * Clear mock cache (no-op for mock)
 */
export function clearMockCache() {
  console.log('Mock cache cleared (no-op)');
}

export default {
  MockCrimeService,
  MockLocationService,
  MockDashboardService,
  getMockCacheStatus,
  clearMockCache,
};
