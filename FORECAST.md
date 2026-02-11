# Forecast Engine

The ad sales forecasting engine predicts revenue, orders, and units for Talabat Mart campaigns based on historical performance data.

## How It Works

### Overview

1. A **build script** (`scripts/build-forecast-model.ts`) queries the database and generates a JSON model file with precomputed coefficients
2. The **forecast service** (`src/lib/forecast.ts`) loads this model and runs predictions based on user inputs
3. The **forecast page** (`/forecast`) provides the UI for selecting parameters and viewing results

### Building the Model

Run `bun run db:build-forecast` to regenerate `static/forecast-model-v2.json`.

The build script queries the `reports` and `sellout` tables to compute:

| Data                      | Source                                              | Description                                                               |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| **Per-product metrics**   | `reports` GROUP BY productName                      | Total spend, revenue, clicks, orders, units, active days, ROAS, CTR, CVR  |
| **Per-product per-type**  | `reports` GROUP BY productName, assetType           | Same metrics split by AD_TYPE_LISTING and AD_TYPE_SEARCH                  |
| **Category coefficients** | `reports` WHERE assetType=LISTING GROUP BY category | ROAS, orders per keyword, CTR, CVR (listing campaigns only)               |
| **Keyword coefficients**  | `reports` WHERE assetType=SEARCH GROUP BY keyword   | ROAS, orders per keyword, CTR, CVR (search campaigns, min 1 KWD spend)    |
| **Seasonality index**     | `reports` GROUP BY month                            | Monthly ROAS relative to overall average (12 values)                      |
| **Day-of-week index**     | `reports` GROUP BY day-of-week                      | Daily ROAS relative to overall average (7 values, Mon=0)                  |
| **Organic baseline**      | `sellout` GROUP BY SKU                              | Daily average units and revenue per product (matched by substring name)   |
| **Global averages**       | `reports`                                           | Overall, listing-specific, and search-specific ROAS/orders/units averages |
| **Product associations**  | `reports`                                           | Which categories and keywords each product appears in                     |

**Spend utilization rate:** Hardcoded at 0.5941 (historically, only ~59% of allocated budget gets spent).

### Running a Forecast

When a user submits the forecast form, the engine:

#### 1. Budget Allocation

Budget is split **evenly** across selected products.

```
budgetPerProduct = totalBudget / numberOfProducts
dailyBudget = budgetPerProduct / numberOfDays
```

#### 2. Coefficient Resolution (per product)

The engine resolves ROAS and order rates using a **fallback chain**:

```
Product type-specific data (listing or search)
  ↓ (if < 5 KWD spend for that type)
Product overall data
  ↓ (if < 5 KWD total spend)
Global type average (listing or search)
```

#### 3. Category & Keyword Modifiers

- **Listing + category selected:** If the product has limited listing data (< 10 KWD), ROAS is adjusted by `categoryRoas / globalListingRoas`
- **Search + keywords selected:** ROAS is scaled by `avgSelectedKeywordRoas / globalSearchRoas`

These modifiers only apply when the product lacks sufficient historical data for the selected campaign type.

#### 4. Day-by-Day Simulation

For each day in the date range:

```
seasonFactor = monthlySeasonality[month]
dowFactor = dayOfWeekIndex[dayOfWeek]
combinedFactor = seasonFactor * dowFactor

dailySpend = dailyBudget * spendUtilizationRate * combinedFactor
diminishing = diminishingReturns(dailySpend, historicalDailySpend)

dayRevenue = dailySpend * ROAS * diminishing * combinedFactor
dayOrders = ordersPerDay * combinedFactor * diminishing
dayUnits = unitsPerDay * combinedFactor * diminishing
```

#### 5. Seasonality

A combined multiplier of monthly and day-of-week performance relative to the overall average.

- **Monthly:** Each month has a ROAS ratio (e.g., 1.08 means 8% above average)
- **Day-of-week:** Each day has a ROAS ratio (e.g., Sunday might be 0.92 = 8% below average)
- **Combined:** `monthFactor * dowFactor` — a value of 1.0 is average, above 1.0 is better, below is worse

#### 6. Diminishing Returns

When daily spend exceeds the product's historical daily average, returns decrease logarithmically:

```
if ratio > 1: factor = 1 / ratio^0.15
if ratio <= 1: factor = 1.0 (no penalty)
```

This prevents the model from linearly extrapolating revenue for budgets much larger than historical spend.

#### 7. Organic Baseline

Each product has an organic daily revenue estimate from the sellout table (matched by SKU substring). This is added separately, scaled only by monthly seasonality (not by ad spend).

### Confidence Levels

Based on how much historical data exists for the product in the selected campaign type:

| Level      | Criteria                          | Meaning                                    |
| ---------- | --------------------------------- | ------------------------------------------ |
| **High**   | 50+ active days AND 30+ KWD spend | Strong per-product coefficients            |
| **Medium** | 20+ active days AND 10+ KWD spend | Reasonable data, some fallback             |
| **Low**    | Less than above                   | Relies heavily on global/category averages |

### Output

The forecast returns:

- **Summary:** Total revenue, orders, units, spend, clicks, ROAS, organic revenue
- **Per-product breakdown:** Each product's forecast with confidence level
- **Daily breakdown:** Day-by-day spend, revenue, orders, and seasonality factor

### Rebuilding the Model

After uploading new report or sellout data, rebuild the model:

```bash
bun run db:build-forecast
```

This regenerates `static/forecast-model-v2.json`. The app must be rebuilt (`bun run build`) or the dev server restarted for changes to take effect.
