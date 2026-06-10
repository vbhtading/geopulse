export type Category = 'geopolitics' | 'markets';

export type Region =
  | 'Americas'
  | 'Europe'
  | 'Middle East'
  | 'Africa'
  | 'Asia-Pacific'
  | 'Russia & Central Asia'
  | 'Global';

export type Topic =
  | 'Defense & Security'
  | 'Energy & Oil'
  | 'Trade & Tariffs'
  | 'Central Banks & Policy'
  | 'Commodities'
  | 'Equities & Indices'
  | 'Supply Chains'
  | 'Diplomacy'
  | 'Sanctions'
  | 'Technology & Export Controls'
  | 'Shipping & Logistics'
  | 'Elections & Politics'
  | 'Conflict Zones';

export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  source: string;
  url: string;
  publishedAt: string; // ISO string
  category: Category;
  regions: Region[];
  topics: Topic[];
  impact: 'High' | 'Medium' | 'Low';
}

export interface MarketInstrument {
  symbol: string;
  name: string;
  price: number;
  change: number; // percentage
  type: 'index' | 'commodity' | 'fx' | 'crypto';
  history: number[]; // mini sparkline last 12 points
}

export interface RegionRisk {
  region: Region;
  level: 'High' | 'Elevated' | 'Moderate' | 'Low';
  score: number; // 0-100
  storyCount: number;
}
