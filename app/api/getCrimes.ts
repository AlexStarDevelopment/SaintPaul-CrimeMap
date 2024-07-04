export const getCrimes = async (
  type: string,
  year: number,
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
  type: string,
  year: number,
  limit: number
) => {
  const res = await fetch(
    `/api/getTotalCrimes?type=${type}&year=${year}&limit=${limit}`
  );
  const data = await res.json();
  return data;
};
