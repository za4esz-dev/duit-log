export const CATEGORIES = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Lifestyle',
  'Other'
] as const;

export const METHODS = ['Daily Bank', 'Primary Bank', 'Digital Bank'] as const;

export const SOURCES = ['Personal', 'Business'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Method = (typeof METHODS)[number];
export type Source = (typeof SOURCES)[number];
