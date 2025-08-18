# Saint Paul Crime Map API Documentation

## Overview

This document describes the REST API endpoints for the Saint Paul Crime Map application.

## Authentication

Most endpoints require authentication via NextAuth session cookies. Protected endpoints return `401 Unauthorized` if no valid session exists.

## Base URL

- Development: `http://localhost:3000`
- Production: `[YOUR_PRODUCTION_URL]`

## Endpoints

### Dashboard APIs

#### GET `/api/dashboard/stats`

Fetches crime statistics for a saved location.

**Authentication:** Required

**Query Parameters:**

- `locationId` (string, required): ID of the saved location
- `period` (string, optional): Time period - `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response:**

```json
{
  "stats": {
    "locationId": "string",
    "locationLabel": "string",
    "period": "string",
    "totalCrimes": "number",
    "crimesByType": {
      "[crimeType]": "number"
    },
    "trendsData": {
      "percentChange": "number",
      "direction": "up|down|stable",
      "previousPeriodTotal": "number"
    },
    "safetyScore": {
      "score": "number (0-100)",
      "rating": "safe|moderate|caution|high-risk",
      "factors": {
        "frequency": "number",
        "severity": "number",
        "trends": "number",
        "timePatterns": "number"
      }
    }
  }
}
```

---

#### GET `/api/dashboard/safety-score`

Calculates safety score for a location.

**Authentication:** Required

**Query Parameters:**

- `locationId` (string, required): ID of the saved location

**Response:**

```json
{
  "locationId": "string",
  "locationLabel": "string",
  "safetyScore": {
    "score": "number (0-100)",
    "rating": "safe|moderate|caution|high-risk",
    "factors": {
      "frequency": "number",
      "severity": "number",
      "trends": "number",
      "timePatterns": "number"
    }
  }
}
```

---

#### GET `/api/dashboard/incidents`

Fetches recent crime incidents near a location.

**Authentication:** Required

**Query Parameters:**

- `locationId` (string, required): ID of the saved location
- `limit` (number, optional): Maximum incidents to return (default: 20)

**Response:**

```json
{
  "incidents": [
    {
      "CASE_NUMBER": "string",
      "INCIDENT": "string",
      "DATE": "string",
      "LAT": "number",
      "LON": "number",
      "BLOCK": "string",
      "distance": "number"
    }
  ],
  "location": {
    "id": "string",
    "label": "string",
    "radius": "number"
  }
}
```

---

#### GET `/api/dashboard/bulk`

Fetches all dashboard data in a single request (optimized).

**Authentication:** Required

**Query Parameters:**

- `locationId` (string, required): ID of the saved location
- `period` (string, optional): Time period (default: `30d`)

**Response:** Combined data from stats, safety-score, and incidents endpoints.

---

### Location Management APIs

#### GET `/api/locations`

Fetches all saved locations for the authenticated user.

**Authentication:** Required

**Response:**

```json
{
  "locations": [
    {
      "_id": "string",
      "userId": "string",
      "label": "string",
      "address": "string",
      "coordinates": {
        "lat": "number",
        "lng": "number"
      },
      "radius": "number",
      "isActive": "boolean",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

---

#### POST `/api/locations`

Creates a new saved location.

**Authentication:** Required

**Request Body:**

```json
{
  "label": "string (required)",
  "address": "string (required)",
  "coordinates": {
    "lat": "number (required)",
    "lng": "number (required)"
  },
  "radius": "number (required, 0.5-5)",
  "notifications": {
    "enabled": "boolean",
    "types": ["string"],
    "severity": "string"
  },
  "isActive": "boolean"
}
```

**Response:**

```json
{
  "location": {
    /* location object */
  }
}
```

---

#### PUT `/api/locations/[id]`

Updates an existing location.

**Authentication:** Required

**URL Parameters:**

- `id` (string): Location ID

**Request Body:** Partial location object with fields to update

**Response:**

```json
{
  "location": {
    /* updated location object */
  }
}
```

---

#### DELETE `/api/locations/[id]`

Deletes a saved location.

**Authentication:** Required

**URL Parameters:**

- `id` (string): Location ID

**Response:**

```json
{
  "success": true
}
```

---

### User APIs

#### PUT `/api/user/theme`

Updates user's theme preference.

**Authentication:** Required

**Request Body:**

```json
{
  "theme": "light|dark|sage|navy"
}
```

**Response:**

```json
{
  "user": {
    /* updated user object */
  }
}
```

---

### Crime Data APIs

#### GET `/api/crimes`

Fetches crime data (public endpoint).

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 100, max: 1000)
- `startDate` (string, optional): ISO date string
- `endDate` (string, optional): ISO date string
- `incidentType` (string, optional): Filter by incident type
- `neighborhood` (string, optional): Filter by neighborhood

**Response:**

```json
{
  "crimes": [
    /* array of crime objects */
  ],
  "totalItems": "number",
  "totalPages": "number",
  "currentPage": "number"
}
```

---

### Admin APIs

#### GET `/api/admin/cache-status`

Checks the status of the crime data cache.

**Authentication:** Required

**Response:**

```json
{
  "cache": {
    "hasData": "boolean",
    "lastFetched": "timestamp",
    "isStale": "boolean",
    "documentCount": "number"
  },
  "timestamp": "ISO date"
}
```

---

#### DELETE `/api/admin/cache-status`

Clears the crime data cache.

**Authentication:** Required

**Response:**

```json
{
  "message": "Cache cleared successfully",
  "timestamp": "ISO date"
}
```

---

#### GET `/api/admin/rate-limit-stats`

Gets current rate limiting statistics.

**Authentication:** Required

**Response:**

```json
{
  "rateLimitStats": {
    "totalEntries": "number",
    "activeClients": "number",
    "topClients": [
      {
        "key": "string",
        "count": "number",
        "resetTime": "number"
      }
    ]
  },
  "timestamp": "ISO date",
  "environment": {
    "rateLimitingEnabled": "boolean",
    "limits": {
      "authenticated": "string",
      "unauthenticated": "string",
      "bulk": "string"
    }
  }
}
```

---

#### DELETE `/api/admin/rate-limit-stats`

Clears all rate limit data (useful for testing).

**Authentication:** Required

**Response:**

```json
{
  "message": "Rate limit store cleared successfully",
  "timestamp": "ISO date"
}
```

---

#### GET `/api/admin/db-stats`

Gets database connection and performance statistics.

**Authentication:** Required

**Response:**

```json
{
  "databaseStats": {
    "totalConnections": "number",
    "activeConnections": "number",
    "cacheHits": "number",
    "cacheMisses": "number",
    "poolSize": "number",
    "lastAccessed": "ISO date"
  },
  "recommendations": [
    {
      "type": "performance|scalability|resource|optimization",
      "message": "string",
      "severity": "info|low|medium|high"
    }
  ],
  "timestamp": "ISO date"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Description of validation error"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": "number (seconds)"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated users**: 100 requests per minute
- **Unauthenticated users**: 20 requests per minute
- **Bulk endpoints**: 10 requests per minute

## Subscription Tiers

Some endpoints have different limits based on subscription tier:

### Free Tier

- 3 saved locations
- 7-day crime history
- 5 recent incidents

### Supporter Tier

- 10 saved locations
- 30-day crime history
- 10 recent incidents

### Pro Tier

- Unlimited saved locations
- 1-year crime history
- 20 recent incidents
- Advanced analytics
