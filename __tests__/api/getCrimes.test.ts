import { getCrimes, getTotalCrimes } from '../../app/api/getCrimes';

// Mock the global fetch function
global.fetch = jest.fn();

describe('getCrimes', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (fetch as jest.Mock).mockClear();
  });

  it('should fetch crimes correctly', async () => {
    const mockResponse = {
      crimes: [{ CASE_NUMBER: '123', INCIDENT_TYPE: 'Theft' }],
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getCrimes('june', 2024, 1, 10);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/crimes?type=june&year=2024&page=1&limit=10');
    expect(result).toEqual(mockResponse);
  });

  it('should handle empty crime data', async () => {
    const mockResponse = {
      crimes: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getCrimes('june', 2024, 1, 10);

    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(getCrimes('june', 2024, 1, 10)).rejects.toThrow('Network error');
  });
});

describe('getTotalCrimes', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should fetch total crimes correctly', async () => {
    const mockResponse = {
      totalItems: 100,
      totalPages: 10,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getTotalCrimes('june', 2024, 10);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/total-crimes?type=june&year=2024&limit=10');
    expect(result).toEqual(mockResponse);
  });

  it('should handle empty total crimes data', async () => {
    const mockResponse = {
      totalItems: 0,
      totalPages: 0,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getTotalCrimes('june', 2024, 10);

    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(getTotalCrimes('june', 2024, 10)).rejects.toThrow('Network error');
  });
});
