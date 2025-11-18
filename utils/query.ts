export const query = async (uri: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/${uri}`,
  );

  if (!response.ok) {
    throw new Error('Network request failed');
  }
  return response.json();
};

export const portalQuery = async (uri: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_PORTAL_PATH}/${uri}`);

  if (!response.ok) {
    throw new Error('Network request failed');
  }
  return response.json();
};

export const validateSeason = (season: string): boolean => {
  const seasonRegex = /^\d{1,3}$/; // rip season 1000
  return seasonRegex.test(season);
};
