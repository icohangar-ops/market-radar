import { fetch } from '@forge/api';
import { getAll, set } from '@forge/kvs';

const DB_PROXY = 'https://db-proxy.example.com'; // Replace with actual CockroachDB REST proxy URL
const CACHE_KEY = 'market-radar-data';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const MOCK = {
  lastUpdated: new Date().toISOString(),
  sentiment: {
    composite: 0.62,
    label: 'CAUTIOUSLY OPTIMISTIC',
    indicators: [
      { name: 'VIX', value: 16.4, signal: 'neutral', direction: 'flat' },
      { name: 'Credit Spreads (IG)', value: 98, signal: 'bullish', direction: 'tightening' },
      { name: '10Y-2Y Spread', value: -18, signal: 'bearish', direction: 'flat' },
      { name: 'DXY', value: 104.2, signal: 'neutral', direction: 'weakening' },
      { name: 'Put/Call Ratio', value: 0.85, signal: 'bullish', direction: 'declining' },
      { name: 'AAII Bull-Bear', value: 28.5, signal: 'bearish', direction: 'declining' },
      { name: 'High-Yield Spread', value: 312, signal: 'neutral', direction: 'tightening' },
    ],
  },
  fedPolicy: {
    currentRate: '5.25-5.50',
    nextMeeting: '2026-06-18',
    impliedCut: 0.25,
    stance: 'HAWKISH HOLD',
    recentSpeech: {
      speaker: 'Chair Powell',
      date: '2026-05-14',
      summary: 'Labor market remains solid. Inflation moving toward 2% but not there yet. Need more confidence before cutting rates.',
      tone: 'cautious',
    },
    dotPlot: { median2026: 4.75, median2027: 3.75, median2028: 3.00 },
  },
  sectorRotation: [
    { sector: 'Technology', flow: 4.2e9, direction: 'inflow', weight: 29.1 },
    { sector: 'Healthcare', flow: 1.8e9, direction: 'inflow', weight: 13.4 },
    { sector: 'Financials', flow: 1.1e9, direction: 'inflow', weight: 12.8 },
    { sector: 'Energy', flow: -0.5e9, direction: 'outflow', weight: 4.2 },
    { sector: 'Utilities', flow: 0.8e9, direction: 'inflow', weight: 2.9 },
    { sector: 'Real Estate', flow: -1.2e9, direction: 'outflow', weight: 2.3 },
    { sector: 'Consumer Disc.', flow: -0.8e9, direction: 'outflow', weight: 10.5 },
    { sector: 'Industrials', flow: 0.3e9, direction: 'inflow', weight: 8.7 },
  ],
  alerts: [
    { type: 'warning', message: 'Yield curve inversion deepening — 10Y-2Y at -18bps', since: '2026-05-10' },
    { type: 'info', message: 'Fed funds futures imply 78% probability of July cut', since: '2026-05-14' },
  ],
};

async function getFromProxy() {
  try {
    const response = await fetch(`${DB_PROXY}/api/market-radar`);
    if (!response.ok) return null;
    const json = await response.json();
    // Validate the response has the expected shape
    if (!json.sentiment || !json.fedPolicy || !json.sectorRotation) return null;
    return json;
  } catch (e) {
    return null;
  }
}

async function getFromStorage() {
  try {
    const cached = await getAll(CACHE_KEY);
    if (!cached || !cached.timestamp) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached.data;
  } catch (e) {
    return null;
  }
}

export async function handler(request) {
  // Try proxy first, then storage cache, then mock
  let data = await getFromProxy();
  if (!data) data = await getFromStorage();
  if (!data) data = MOCK;

  // Cache the result
  try {
    await set(CACHE_KEY, { data, timestamp: Date.now() });
  } catch (e) {
    // Storage write failure is non-critical; still return data
  }

  return data;
}
