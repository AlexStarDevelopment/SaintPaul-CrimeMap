export const getCrimes = async (
  type: string | undefined,
  year: number | undefined,
  page: number,
  limit: number
) => {
  const res = await fetch(
    `/api/getCrimes?type=${type}&year=${year}&page=${page}&limit=${limit}`
  );
  const data = await res.json();
  return data;
};

export const getTotalCrimes = async (
  type: string | undefined,
  year: number | undefined,
  limit: number
) => {
  const res = await fetch(
    `/api/getTotalCrimes?type=${type}&year=${year}&limit=${limit}`
  );
  const data = await res.json();
  return data;
};
