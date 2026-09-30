// Static FX table: deliberate simplification (see docs/ARCHITECTURE.md, trade-off T3).
export const COUNTRIES = {
  IN: { name: 'India', currency: 'INR', usdRate: 0.012 },
  US: { name: 'United States', currency: 'USD', usdRate: 1 },
  GB: { name: 'United Kingdom', currency: 'GBP', usdRate: 1.27 },
  DE: { name: 'Germany', currency: 'EUR', usdRate: 1.08 },
  SG: { name: 'Singapore', currency: 'SGD', usdRate: 0.74 },
} as const;
export type CountryCode = keyof typeof COUNTRIES;
export const COUNTRY_CODES = Object.keys(COUNTRIES) as [CountryCode, ...CountryCode[]];
export const toUsd = (amount: number, c: CountryCode) => Math.round(amount * COUNTRIES[c].usdRate);
