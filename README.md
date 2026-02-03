# Revenue Leak SRE - Hackathon Demo (2026)

> **Metric**: 40% Impact, 30% Innovation, 20% Presentation, 10% People's Choice.

## 🚀 The Pitch (30 Seconds)
Revenue Leaks are "silent outages" in your GTM factory. We treat them like SRE incidents.
Instead of dashboards people ignore, we use **SLOs**, **Error Budgets**, and **Fix Packs** to make revenue reliability deterministic.

## 🎥 How to Run the Demo

1. **Start the App**: `npm run dev`
2. **Open**: `http://localhost:3000`
3. **Click "Start Demo Mode"**: This executes the "One-Click Wow" flow:
   - Loads 20 sample records (SLA breaches, Stale Opps, Duplicates).
   - Scans and detects $1.2M at risk.
   - Triggers a "Severity 1" incident in the War Room.
4. **Navigate**:
   - Show the **SLO Gauges** (Lead Response 0% -> red).
   - Show **Top Causes** and **Blast Radius** (Marketing & Sales affected).
5. **Fix**:
   - Click "View Fix" on the top issue.
   - Show **Root Cause Guess** and **Fix Pack DSL Viewer** (the "code" behind the fix).
   - Click **Generate Fix Pack**.
   - Click **Approve & Apply**.
6. **Verify**:
   - Watch the **Saved Revenue Counter** go up.
   - See the **Verification Report** confirm "No regressions".
   - Toggle **Presentation Mode** for a clearer view.

## 🛠 Architecture & Innovation

### 1. Revenue SLOs & Error Budgets
We mapped GTM metrics to SRE concepts:
- **Lead Response Time** = Latency SLO
- **Deal Stagnation** = Availability SLO (deal is "down" if stuck)
- **Data Quality** = Error Rate SLO

### 2. Fix Pack DSL
Fixes are defined as code (`lib/fixpack-dsl.ts`), allowing:
- **Dry Runs**: Simulate the blast radius before applying.
- **Audit Logs**: Traceability of every revenue operation.
- **Version Control**: Infrastructure-as-Code for GTM logic.

### 3. Impact Estimation
We don't just count records; we price them based on stage probability and deal value, giving a "Revenue at Risk" dollar amount that Executives care about.

## ✅ Technology Stack
- **Next.js 16** (App Router)
- **TypeScript** (Strict Mode)
- **Tailwind CSS** (Vibe & Polish)
- **Vitest** (Unit Testing Rules)
