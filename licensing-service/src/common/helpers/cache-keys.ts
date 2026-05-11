export const cacheKeys = {
  dept: (id: string) => `dept:${id}`,
  instType: (id: string) => `inst-type:${id}`,
  licenseType: (id: string) => `license-type:${id}`,
};

export const LOOKUP_TTL = 300;
