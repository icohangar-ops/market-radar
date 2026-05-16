# Market Radar

Jira dashboard gadget for real-time market sentiment, Federal Reserve policy tracking, and institutional sector rotation analysis -- powered by CockroachDB with a three-tier data resolution architecture ensuring zero-downtime operation.

[![Atlassian Forge](https://img.shields.io/badge/Atlassian-Forge-0052CC?logo=jira)](https://developer.atlassian.com/platform/forge/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Node.js_24-yellow?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

Market Radar transforms a Jira dashboard into a live financial intelligence terminal. It surfaces market sentiment indicators, Federal Reserve policy signals, and institutional sector rotation flows in a single, glanceable gadget -- so engineering and product teams can stay aligned with macro conditions without leaving Jira.

Built on the Atlassian Forge platform, Market Radar connects to a CockroachDB-backed REST proxy that aggregates data from financial databases spanning sentiment analysis, 13F hedge fund filings, and Fed speech NLP. The gadget uses a three-tier data resolution strategy: it first attempts to fetch live data from the CockroachDB proxy, falls back to Forge's built-in key-value store cache with a 5-minute TTL, and finally serves rich embedded mock data -- ensuring the gadget is always operational regardless of backend availability.

The interface presents three tabbed views: **Sentiment Indicators** showing seven market signals (VIX, credit spreads, yield curve, DXY, put/call ratio, AAII bull-bear spread, high-yield spreads) with directional trend badges; **Fed Policy** displaying the current rate, next FOMC meeting, implied cut probability, dot plot projections through 2028, and the latest Fed speech summary with tone analysis; and **Sector Rotation** tracking eight sectors with inflow/outflow direction, dollar amounts, and portfolio weight percentages.

## Architecture

```
+-------------------------------------------------------------------+
|                      Jira Dashboard                                |
|  +-----------------------------------------------------------+    |
|  |                Market Radar Gadget                          |    |
|  |             (Custom UI -- @forge/ui)                       |    |
|  |  +-----------+  +-----------+  +--------------------+    |    |
|  |  | Sentiment |  | Fed Policy|  | Sector Rotation    |    |    |
|  |  |   Tab     |  |    Tab    |  |      Tab           |    |    |
|  |  +-----------+  +-----------+  +--------------------+    |    |
|  +------------------------------+------------------------------+  |
|                                 | resolver (src/index.js)        |
|                                 v                                |
|  +-----------------------------------------------------------+    |
|  |               Three-Tier Data Layer                        |    |
|  |  Tier 1: CockroachDB REST Proxy (/api/market-radar)      |    |
|  |  Tier 2: Forge KVS Cache (@forge/kvs, 5-min TTL)          |    |
|  |  Tier 3: Embedded Mock Data (always available)            |    |
|  +-----------------------------------------------------------+    |
|                                 ^                                |
|                                 | webtrigger (POST)                |
|  +------------------------------+------------------------------+  |
|  |               External Data Sources                       |    |
|  |  market_sentiment_fedgpt DB (indicators, speeches)         |    |
|  |  hedge_fund_13f_radar DB (13F filings, flows)              |    |
|  |  Custom webhook feeds                                        |    |
|  +-----------------------------------------------------------+    |
+-------------------------------------------------------------------+
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Platform | Atlassian Forge |
| Runtime | Node.js 24.x (Forge-managed) |
| UI Framework | @forge/ui (Custom UI -- React-like component system) |
| HTTP Client | @forge/api (permission-gated fetch) |
| Cache | @forge/kvs (Forge Key-Value Store, 5-min TTL) |
| Database | CockroachDB (via REST proxy) |
| Module Type | jira:dashboardGadget |
| Scopes | read:jira-work, storage:app |

## Key Features

- **Composite Sentiment Score** -- Weighted 0-1 score across VIX, credit spreads, yield curve, DXY, and put/call ratios with human-readable labels (Bullish, Cautiously Optimistic, Neutral, Cautious, Risk-Off) and a color-coded progress bar.

- **Seven Sentiment Indicators** -- VIX, Investment-Grade Credit Spreads, 10Y-2Y Treasury Spread, US Dollar Index, Put/Call Ratio, AAII Bull-Bear Spread, and High-Yield Spreads. Each indicator displays its current value, a directional signal badge (BULLISH/BEARISH/NEUTRAL), and a trend direction label.

- **Fed Policy Dashboard** -- Current Fed Funds rate, next FOMC meeting date, implied rate cut probability, policy stance classification (e.g., HAWKISH HOLD), dot plot median projections for 2026-2028, and the latest Fed speech summary with speaker name, date, and tone classification.

- **Sector Rotation Tracker** -- Eight-sector flow analysis (Technology, Healthcare, Financials, Energy, Utilities, Real Estate, Consumer Discretionary, Industrials) with dollar-denominated flow amounts, inflow/outflow direction badges, and portfolio weight percentages.

- **Smart Alerts** -- Color-coded warning and information alerts for yield curve inversions, FOMC probability changes, and emerging market signals. Each alert includes an effective date for temporal context.

- **Three-Tier Data Resolution** -- CockroachDB REST Proxy (Tier 1) for live data, Forge KVS cache with 5-minute TTL (Tier 2) for resilience against proxy failures, and rich embedded mock data (Tier 3) as a final fallback -- guaranteeing the gadget always renders meaningful content.

- **Webtrigger Ingestion** -- POST webhook endpoint for pushing real-time data updates from external systems such as market data feeds or custom processing pipelines. Updates are written to the KVS cache for subsequent reads.

## Getting Started

### Prerequisites

- Node.js 20+ (LTS)
- Forge CLI v10+
- An Atlassian developer account with API token
- (Optional) A running CockroachDB REST proxy instance for live data

### Installation

```bash
# Clone the repository
git clone https://github.com/Cubiczan/market-radar.git
cd market-radar

# Install dependencies
npm install

# Authenticate with Forge
forge login

# Deploy to development
forge deploy

# Install on your Jira site
forge install --site <your-site>.atlassian.net --product jira
```

### Configuring the Data Proxy

To connect to live CockroachDB data, update the proxy URL in `src/index.js`:

```javascript
// src/index.js -- line 4
const DB_PROXY = 'https://your-proxy-url.com';
```

Update the `external.fetch` permission in `manifest.yml`:

```yaml
permissions:
  external:
    fetch:
      backend:
        - "https://your-proxy-url.com"
```

Redeploy after updating:

```bash
forge deploy
```

Without a proxy configured, Market Radar automatically serves rich mock data and is fully functional for demos and development.

## Usage

### Adding to a Jira Dashboard

1. Navigate to your Jira Dashboard
2. Click "Edit Dashboard" (top right)
3. Click "Add a gadget"
4. Search for "Market Radar"
5. Click "Add gadget"
6. Position and resize as desired
7. Click "Save"

### Reading the Sentiment Composite

| Score Range | Label | Interpretation |
|-------------|-------|----------------|
| 0.70 - 1.00 | Bullish | Broad risk-on conditions across most indicators |
| 0.60 - 0.69 | Cautiously Optimistic | Positive bias but with elevated risks |
| 0.40 - 0.59 | Neutral | Mixed signals, no clear directional conviction |
| 0.30 - 0.39 | Cautious | Defensive positioning warranted |
| 0.00 - 0.29 | Risk-Off | Significant stress signals across indicators |

### Understanding Signal Badges

| Badge | Meaning |
|-------|---------|
| BULLISH (green) | Indicator suggests favorable conditions |
| NEUTRAL (gray) | Indicator is within normal range |
| BEARISH (red) | Indicator suggests deteriorating conditions |

### Webtrigger Data Push

External systems can push data updates via the webtrigger endpoint:

```bash
curl -X POST "https://<webtrigger-url>" \
  -H "Content-Type: application/json" \
  -d '{
    "sentiment": {
      "composite": 0.65,
      "label": "CAUTIOUSLY OPTIMISTIC",
      "indicators": [
        {"name": "VIX", "value": 16.4, "signal": "neutral", "direction": "flat"},
        {"name": "Credit Spreads (IG)", "value": 98, "signal": "bullish", "direction": "tightening"}
      ]
    },
    "fedPolicy": {
      "currentRate": "5.25-5.50",
      "nextMeeting": "2026-06-18",
      "impliedCut": 0.25,
      "stance": "HAWKISH HOLD"
    },
    "sectorRotation": [
      {"sector": "Technology", "flow": 4200000000, "direction": "inflow", "weight": 29.1}
    ],
    "alerts": [
      {"type": "warning", "message": "Yield curve inversion deepening", "since": "2026-05-10"}
    ]
  }'
```

## Project Structure

```
market-radar/
├── manifest.yml               # Forge app manifest (modules, permissions, resources)
├── package.json               # Dependencies (@forge/ui, @forge/api, @forge/kvs)
├── package-lock.json
├── LICENSE                    # MIT license
├── src/
│   ├── index.js               # Backend resolver -- three-tier data fetch + cache
│   ├── webhook.js             # Webtrigger handler -- POST data ingestion
│   ├── frontend/
│   │   ├── index.html         # Custom UI HTML shell
│   │   └── index.jsx          # React component (tabs, tables, badges, progress)
│   └── webhook-fn/
│       └── index.js           # Webtrigger function entry point
├── docs/
│   ├── market-radar-screenshot.png   # Gadget screenshot
│   └── market-radar-mockup.html      # HTML mockup of the gadget layout
└── demos/
    └── market-radar_demo.mp4         # Feature walkthrough video
```

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Test locally with `forge deploy` to a development environment
5. Commit your changes with descriptive messages
6. Open a Pull Request against the `main` branch

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.
