# Revenue Reliability Model

## Why Revenue Reliability?
Traditional SRE teams monitor uptime and latency. GTM SREs monitor **revenue consistency**. 
We apply Site Reliability Engineering principles to the sales funnel.

## Service Level Objectives (SLOs)

We measure two key indicators of funnel health:

### 1. Lead Response Latency
- **Indicator**: Time from `created_at` to first `last_touch_at`.
- **Target**: 90% of leads engaged within 1 hour.
- **Why**: "Speed to lead" is the #1 predictor of conversion.

### 2. Opportunity Freshness
- **Indicator**: Time since `last_touch_at` for open opportunities.
- **Target**: 90% of open opps touched within the last 10 days.
- **Why**: Deal momentum kills deals. Silence is a leading indicator of churn.

## Error Budgets
We calculate an "Error Budget" based on the 10% tolerance (1 - 0.90).
- If your team ignores too many leads, the **Error Budget burns down**.
- When the budget hits 0, we treat it like a P0 outage: automated alerts go out, and potentially we freeze "new lead distribution" until the backlog is cleared (simulating circuit breakers).

## Architecture
The calculations are performed deterministically in `lib/reliability.ts`.
- **Input**: Raw `FunnelRecord[]` from CSV.
- **Output**: `ReliabilityMetrics` (compliance rates, dollar impact, budget burn).
