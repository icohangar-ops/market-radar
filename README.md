# Market Radar

> Real-time market sentiment, Fed policy tracking, and sector rotation analysis — delivered as a Jira Dashboard Gadget. Powered by CockroachDB with Forge-first architecture.

![Market Radar Screenshot](docs/market-radar-screenshot.png)

---

## Overview

**Market Radar** transforms your Jira dashboard into a live financial intelligence terminal. It surfaces market sentiment indicators, Federal Reserve policy signals, and institutional sector rotation flows in a single, glanceable gadget — so your engineering and product teams can stay aligned with macro conditions without leaving Jira.

Built on the [Atlassian Forge](https://developer.atlassian.com/platform/forge/) platform, Market Radar connects to a CockroachDB-backed REST proxy that aggregates data from 10 financial databases spanning sentiment analysis, 13F hedge fund filings, and Fed speech NLP. When the proxy is unavailable, it gracefully falls back to Forge's built-in key-value store cache (5-minute TTL) and finally to rich embedded mock data — ensuring the gadget is always operational.

### Key Features

| Feature | Description |
|---------|-------------|
| **Composite Sentiment Score** | Weighted 0–1 score across VIX, credit spreads, yield curve, DXY, and put/call ratios with human-readable labels (Bullish, Cautiously Optimistic, Neutral, Cautious, Risk-Off) |
| **7+ Sentiment Indicators** | VIX, Investment-Grade Credit Spreads, 10Y-2Y Treasury Spread, US Dollar Index, Put/Call Ratio, AAII Bull-Bear Spread, High-Yield Spreads — each with directional trend signals |
| **Fed Policy Dashboard** | Current Fed Funds rate, next FOMC meeting date, implied rate cut probability, policy stance classification, dot plot projections (2026–2028), and latest Fed speech summary with tone analysis |
| **Sector Rotation Tracker** | 8-sector flow analysis (Technology, Healthcare, Financials, Energy, Utilities, Real Estate, Consumer Disc., Industrials) with inflow/outflow direction, dollar amounts, and portfolio weight percentages |
| **Smart Alerts** | Color-coded warning and information alerts for yield curve inversions, FOMC probabilities, and emerging market signals — each with an effective date |
| **Three-Tier Data Fallback** | CockroachDB REST Proxy → Forge KVS Cache (5-min TTL) → Rich Mock Data — zero-downtime guarantee |
| **Webtrigger Ingestion** | POST webhook endpoint for pushing real-time data updates from external systems (e.g., market data feeds, custom pipelines) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Jira Dashboard                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Market Radar Gadget                       │  │
│  │           (Custom UI — @forge/ui)                     │  │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────────┐    │  │
│  │  │Sentiment│  │Fed Policy│  │ Sector Rotation   │    │  │
│  │  │  Tab    │  │   Tab    │  │      Tab          │    │  │
│  │  └─────────┘  └──────────┘  └───────────────────┘    │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │ resolver (src/index.js)         │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Three-Tier Data Layer                     │  │
│  │  Tier 1: CockroachDB REST Proxy (/api/market-radar)   │  │
│  │  Tier 2: Forge KVS Cache (@forge/kvs, 5-min TTL)      │  │
│  │  Tier 3: Embedded Mock Data (always available)         │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ▲                                 │
│                           │ webtrigger (POST)               │
│  ┌────────────────────────┴──────────────────────────────┐  │
│  │              External Data Sources                      │  │
│  │  • market_sentiment_fedgpt DB (indicators, speeches)    │  │
│  │  • hedge_fund_13f_radar DB (13F filings, flows)        │  │
│  │  • Custom webhook feeds                                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Sources

Market Radar aggregates data from CockroachDB databases maintained in a [Cubiczan](https://github.com/Cubiczan) data platform:

| Database | Tables Used | Description |
|----------|-------------|-------------|
| `market_sentiment_fedgpt` | `sentiment_indicators`, `fed_speeches`, `sentiment_reports` | NLP-driven sentiment scoring, Fed speech tone analysis, composite sentiment reports |
| `hedge_fund_13f_radar` | `holdings`, `radar_reports` | Institutional 13F filings, sector rotation flow calculations, alert generation |

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS)
- [Forge CLI](https://developer.atlassian.com/platform/forge/getting-started/) v10+
- An Atlassian developer account with API token
- (Optional) A running [db-proxy](https://github.com/Cubiczan/db-proxy) instance for live CockroachDB data

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Cubiczan/market-radar.git
cd market-radar

# 2. Install dependencies
npm install

# 3. Authenticate with Forge
forge login

# 4. Deploy to development
forge deploy

# 5. Install on your Jira site
forge install --site <your-site>.atlassian.net --product jira
```

### Configuring the Data Proxy

To connect to live CockroachDB data, update the proxy URL in `src/index.js`:

```javascript
// src/index.js — line 4
const DB_PROXY = 'https://your-proxy-url.com';  // Replace with your db-proxy instance
```

You'll also need to update the `external.fetch` permission in `manifest.yml`:

```yaml
permissions:
  external:
    fetch:
      backend:
        - "https://your-proxy-url.com"
```

After updating, redeploy:

```bash
forge deploy
```

Without a proxy configured, Market Radar automatically serves rich mock data and is fully functional for demos and development.

---

## Usage

### Adding to a Jira Dashboard

1. Navigate to your Jira Dashboard
2. Click **Edit Dashboard** (top right)
3. Click **Add a gadget**
4. Search for **"Market Radar"**
5. Click **Add gadget**
6. Position and resize as desired
7. Click **Save**

### Reading the Sentiment Composite

| Score Range | Label | Interpretation |
|-------------|-------|----------------|
| 0.70 – 1.00 | **Bullish** | Broad risk-on conditions across most indicators |
| 0.60 – 0.69 | **Cautiously Optimistic** | Positive bias but with elevated risks (current reading) |
| 0.40 – 0.59 | **Neutral** | Mixed signals, no clear directional conviction |
| 0.30 – 0.39 | **Cautious** | Defensive positioning warranted, elevated uncertainty |
| 0.00 – 0.29 | **Risk-Off** | Significant stress signals across indicators |

### Understanding Signal Badges

| Badge | Color | Meaning |
|-------|-------|---------|
| **BULLISH** | Green | Indicator suggests favorable conditions |
| **NEUTRAL** | Gray | Indicator is within normal range |
| **BEARISH** | Red | Indicator suggests deteriorating conditions |

### Webtrigger (External Data Push)

The webtrigger endpoint accepts POST requests to update cached data:

```bash
curl -X POST "https://<webtrigger-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "sentiment": { "composite": 0.65, "label": "CAUTIOUSLY OPTIMISTIC", "indicators": [...] },
    "fedPolicy": { "currentRate": "5.25-5.50", "stance": "HAWKISH HOLD", ... },
    "sectorRotation": [{ "sector": "Technology", "flow": 4200000000, ... }]
  }'
```

---

## Project Structure

```
market-radar/
├── manifest.yml               # Forge app manifest (modules, permissions, resources)
├── package.json               # Dependencies (@forge/ui, @forge/api, @forge/kvs)
├── src/
│   ├── index.js               # Backend resolver — three-tier data fetch + cache
│   ├── webhook.js             # Webtrigger handler — POST data ingestion
│   ├── frontend/
│   │   ├── index.html         # Custom UI HTML shell
│   │   └── index.jsx          # Custom UI React component (tabs, tables, badges)
│   └── webhook-fn/
│       └── index.js           # Webtrigger function entry point
└── docs/
    └── market-radar-screenshot.png
```

---

## Technical Details

- **Runtime**: Node.js 24.x (Forge-managed)
- **UI Framework**: `@forge/ui` Custom UI (Forge's React-like component system)
- **Storage**: `@forge/kvs` (Forge Key-Value Store) — 5-minute TTL cache
- **HTTP Client**: `@forge/api` `fetch` (Forge's secure, permission-gated HTTP client)
- **Module Type**: `jira:dashboardGadget`
- **Scopes**: `read:jira-work`, `storage:app`
- **Permissions**: `external:fetch` to backend proxy URL

---

## Related Repositories

| Repository | Description |
|------------|-------------|
| [finance-cockpit](https://github.com/Cubiczan/finance-cockpit) | CFO-grade financial dashboard (Jira Project Page) |
| [decision-brief](https://github.com/Cubiczan/decision-brief) | CFO decision briefs with adversarial rounds (Jira Project Page) |
| [db-proxy](https://github.com/Cubiczan/db-proxy) | CockroachDB REST proxy serving all Forge apps |

---

## License

Private repository. All rights reserved.
