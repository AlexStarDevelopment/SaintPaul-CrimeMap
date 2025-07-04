import { GetCrimesResponse, GetTotalCrimesResponse } from '../models/models';

/**
 * Fetches crime data from the API.
 * @param type - The type of crime data to fetch (e.g., month).
 * @param year - The year for which to fetch crime data.
 * @param page - The page number of the results to fetch.
 * @param limit - The maximum number of results per page.
 * @returns A promise that resolves to an object containing crime data, total items, total pages, and current page.
 */
export const getCrimes = async (
  type: string | undefined,
  year: number | undefined,
  page: number,
  limit: number
): Promise<GetCrimesResponse> => {
  const res = await fetch(`/api/crimes?type=${type}&year=${year}&page=${page}&limit=${limit}`);
  const data: GetCrimesResponse = await res.json();
  return data;
};

/**
 * Fetches the total number of crimes from the API.
 * @param type - The type of crime data to fetch (e.g., month).
 * @param year - The year for which to fetch crime data.
 * @param limit - The maximum number of results per page.
 * @returns A promise that resolves to an object containing total items and total pages.
 */
export const getTotalCrimes = async (
  type: string | undefined,
  year: number | undefined,
  limit: number
): Promise<GetTotalCrimesResponse> => {
  const res = await fetch(`/api/total-crimes?type=${type}&year=${year}&limit=${limit}`);
  const data: GetTotalCrimesResponse = await res.json();
  return data;
};
