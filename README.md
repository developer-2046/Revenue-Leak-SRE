# Revenue Leak SRE (GTM Stack Doctor)

A hackathon-ready product to detect revenue leaks in a GTM funnel, quantify impact, and generate/execute fixes.

## What It Is
Revenue Leak SRE acts as a doctor for your GTM stack. It scans your leads and opportunities (imported via CSV) for common "leaks" such as:
- SLA Breaches (untouched leads)
- Stale Opportunities
- Missing Owners
- Duplicates

It calculates the potential revenue at risk and provides "Fix Packs" to resolve them—including live Slack alerts.

## Setup Steps

1.  **Prerequisites**: Node.js 18+.
2.  **Install**:
    ```bash
    npm install
    ```
3.  **Environment**:
    ```bash
    cp .env.example .env
    ```
    Add `SLACK_WEBHOOK_URL` if you want to test the live Slack integration.
4.  **Run**:
    ```bash
    npm run dev
    ```

## Demo Script
(See `docs/DEMO_SCRIPT.md` for full details)

1.  Load the app.
2.  Click "Load Sample".
3.  See the leaks appear with $ amounts.
4.  Click "Generate Fix Pack" on an SLA Breach.
5.  Click "Run Fix #1" to see the Slack alert.

## Screenshots
![Dashboard Placeholder](placeholder.png)
