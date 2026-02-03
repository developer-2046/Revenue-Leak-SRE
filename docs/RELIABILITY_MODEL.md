# Revenue Reliability Model

## Core Concepts

### 1. Revenue Error Budget
We define a financial tolerance for operational failure. 
-   **Default Budget**: $50,000 / month (configurable).
-   **Usage**: Every dollar "at risk" due to a leak subtracts from this budget.
-   **Burn Rate**: `Total At Risk / Budget`. 
    -   Burn Rate = 1.0 means you've exhausted tolerance.
    -   Burn Rate > 2.0 is a SEV 1 Incident.

### 2. Paging States
-   **OK**: Burn Rate < 0.25 (Budget is healthy).
-   **WARN**: Burn Rate 0.25 - 0.50 (Investigation needed).
-   **PAGE**: Burn Rate > 0.50 (Immediate intervention required).

### 3. Impact Estimation Model
We calculate "At Risk" value using a Stage Probability Decay model.

-   **Base Probability**:
    -   New: 10%
    -   Qualified: 25%
    -   Proposal: 45%
    -   Negotiation: 65%

-   **Staleness Decay**:
    -   Formula: `P_current = P_base * e^(-k * t)`
    -   Half-life: 14 days (Probability of winning halves every 2 weeks of silence).
    
This provides a mathematically defensible "Dollar Value" for every day of inaction.

### 4. SLOs (Service Level Objectives)
-   **Lead Response**: 30 Minutes.
-   **Opp Freshness**: 7 Days.
-   **Data Hygiene**: Key fields (Next Step) populated within 24h.
