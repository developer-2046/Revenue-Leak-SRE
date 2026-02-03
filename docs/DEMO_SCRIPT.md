# Hackathon Demo Script (10 Mins max)

## Phase 1: The Hook (0:00 - 1:00)
- **Speaker**: "Revenue leaks are just system outages that we haven't instrumented yet. Today, we bring SRE discipline to the GTM stack."
- **Action**: Open App. It's clean, empty.
- **Action**: Click **"Start Demo Mode"**.
- **Voiceover**: "In one click, we mount the entire funnel, scan for reliability issues, and declare a Revenue Incident."
- **Effect**: War Room banner drops down. Siren pulses. Red numbers everywhere.

## Phase 2: Diagnose (1:00 - 3:00)
- **Speaker**: "We don't just list rows. We calculate Revenue at Risk and Blast Radius."
- **Action**: Hover over **SLO Gauges**.
- **Voiceover**: "Our 'Lead Response' SLO is breached. our 'Deal Velocity' Error Budget is exhausted."
- **Action**: Point to **Top Causes** widget.
- **Voiceover**: "The root cause isn't 'bad reps', it's a 'Capacity Bottleneck' in the SDR team, affecting $500k pipeline."

## Phase 3: Remediate (3:00 - 6:00)
- **Speaker**: "Now, let's fix it with code."
- **Action**: Click "View Fix" on the top 'SLA Breach' issue.
- **Action**: Show **Root Cause Guess** in the drawer.
- **Action**: Scroll to **Fix Pack DSL Viewer**.
- **Voiceover**: "Here is the 'Fix Pack'. It's not a black box. It's a deterministic workflow defined in TypeScript."
- **Action**: Click **Generate Fix Pack**.
- **Action**: Click **Approve & Apply**.
- **Effect**: Loading state -> Success -> **Verification Report** Modal appears.

## Phase 4: Verify & Close (6:00 - 8:00)
- **Speaker**: "We verified the fix in simulation. No regressions."
- **Action**: Dismiss modal.
- **Action**: Point to **Saved Revenue Counter** (Top right).
- **Voiceover**: "We just recovered $150k in pipeline value mechanically."
- **Action**: Toggle **Presentation Mode** button (Monitor icon).
- **Voiceover**: "This is Revenue Leak SRE. Production reliability for your revenue engine."

## Phase 5: Q&A / Backup
- If asked about integrations: "We support CSV import for the hackathon, but the `Scanner` is designed to be an Adapter pattern for Salesforce/HubSpot APIs."
- If asked about "Blast Radius": "It scans the 'Owner' and 'Team' fields to map graph dependencies."
