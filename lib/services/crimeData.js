/**
 * Aggregate dashboard data for a given address/location
 * @param {string} address - Address to fetch data for
 * @param {string} userId - User ID (for access control)
 * @returns {Promise<Object>} Dashboard data
 */
export async function getDashboardDataForAddress(address, userId) {
  // For demo: find location by address, then aggregate stats
  // In production, you may want to geocode address to coordinates
  const client = await connectToDatabase();
  const db = client.db();
  const locations = db.collection('locations');
  const location = await locations.findOne({ address, userId });
  if (!location) throw new Error('Location not found');

  // Example: last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  // Get crimes in radius
  const crimes = await getCrimesInRadius(location, startDate, endDate);
  const totalIncidents = crimes.length;
  // Example safety score: fewer crimes = higher score
  const safetyScore = Math.max(100 - totalIncidents, 0);

  // Recent incidents
  const incidents = crimes.slice(0, 10).map((crime) => ({
    type: crime.TYPE || 'Unknown',
    date: crime.DATE ? new Date(Number(crime.DATE)).toLocaleDateString() : 'Unknown',
    location: crime.LOCATION || address,
  }));

  return {
    address,
    totalIncidents,
    safetyScore,
    incidents,
  };
}
import { connectToDatabase } from '../db/mongodb.js';

/**
 * @typedef {Object} CrimeCache
 * @property {Array|null} data - Cached crime documents
 * @property {number|null} lastFetched - Timestamp of last fetch
 * @property {number} ttl - Time to live in milliseconds
 */

/** @type {CrimeCache} Cache for crime documents to avoid repeated database queries */
let crimeCache = {
  data: null,
  lastFetched: null,
  ttl: parseInt(process.env.CRIME_CACHE_TTL || '300000'), // Default 5 minutes
};

/**
 * Get all crime documents from the database with caching
 * @returns {Array} Array of crime documents
 */
export async function getCrimeDocuments() {
  const now = Date.now();

  // Return cached data if it's still valid
  if (crimeCache.data && crimeCache.lastFetched && now - crimeCache.lastFetched < crimeCache.ttl) {
    return crimeCache.data;
  }

  try {
    const client = await connectToDatabase();
    const db = client.db();
    const crimes = db.collection('crimes');

    // Fetch all crime documents
    const crimeDocuments = await crimes.find({}).toArray();

    // Update cache
    crimeCache.data = crimeDocuments;
    crimeCache.lastFetched = now;

    console.log(`Crime data fetched and cached: ${crimeDocuments.length} documents`);
    return crimeDocuments;
  } catch (error) {
    console.error('Error fetching crime documents:', error);
    // Return cached data if available, even if stale
    if (crimeCache.data) {
      console.log('Returning stale cached data due to error');
      return crimeCache.data;
    }
    throw error;
  }
}

/**
 * Filter crimes by date range from cached documents
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered crimes
 */
export async function getCrimesByDateRange(startDate, endDate) {
  const crimeDocuments = await getCrimeDocuments();
  let crimes = [];

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  for (const doc of crimeDocuments) {
    if (doc.crimes && Array.isArray(doc.crimes)) {
      const docCrimes = doc.crimes.filter((crime) => {
        if (!crime.DATE) return false;
        const crimeTime = Number(crime.DATE);
        return crimeTime >= startTime && crimeTime <= endTime;
      });

      crimes = crimes.concat(docCrimes);
    }
  }

  return crimes;
}

/**
 * Get crimes within a radius of a location for a date range
 * @param {Object} location - Location object with coordinates and radius
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered crimes with distance
 */
export async function getCrimesInRadius(location, startDate, endDate) {
  const crimes = await getCrimesByDateRange(startDate, endDate);

  return crimes
    .map((crime) => {
      if (crime.LAT == null || crime.LON == null) return null;

      const distance = calculateDistance(
        location.coordinates.lat,
        location.coordinates.lng,
        Number(crime.LAT),
        Number(crime.LON)
      );

      if (distance > location.radius) return null;

      return {
        ...crime,
        distance: parseFloat(distance.toFixed(2)),
      };
    })
    .filter((crime) => crime !== null);
}

/**
 * Calculate distance between two points in miles
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Clear the crime data cache (useful for testing or manual refresh)
 */
export function clearCrimeCache() {
  crimeCache.data = null;
  crimeCache.lastFetched = null;
  console.log('Crime data cache cleared');
}

/**
 * Get cache status for monitoring
 */
export function getCacheStatus() {
  return {
    hasData: !!crimeCache.data,
    lastFetched: crimeCache.lastFetched,
    isStale: crimeCache.lastFetched ? Date.now() - crimeCache.lastFetched > crimeCache.ttl : true,
    documentCount: crimeCache.data ? crimeCache.data.length : 0,
  };
}
