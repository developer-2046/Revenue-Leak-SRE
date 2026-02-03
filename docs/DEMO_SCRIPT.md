# Demo Script

**Narrative**: "Today I'm going to show you how we can stop revenue leaks in our GTM funnel using Revenue Leak SRE."

## Step 1: The Setup
1. Open the Dashboard. It is empty.
2. Say: "We start with a blank slate. I can upload a CSV export from Salesforce, or for this demo, I'll generate a messy sample funnel."

## Step 2: Ingest Data
1. Click **"Load Messy Funnel"**.
2. 50+ records appear.
3. Show the table: "We have leads and opps, but many are neglected."

## Step 3: Scan for Leaks
1. Click **"Scan for Leaks"** (Red Button).
2. The UI transforms. Issues appear.
3. Point to **KPI Cards**:
   - "We found X leaks."
   - "There is $X,XXX,XXX at risk."
   - "We estimate we can recover 40% of that."
4. Scroll to the **Issue List**: "Here are the specific problems."

## Step 4: Fix an SLA Breach (High Urgency)
1. Find an `SLA_BREACH_UNTOUCHED` issue (High Priority).
2. Click it to open the **Drawer**.
3. Read the context: "This lead from Acme Corp is 45 mins old and untouched."
4. Click **"Generate Fix Pack"**.
5. Show the generated artifacts:
   - **Steps**: "Here is the checklist for the rep."
   - **Email Draft**: "It wrote a context-aware email to John."
   - **Automation Payload**: "This JSON is ready for n8n/Zapier."
6. Click **"Run Fix #1 (Live)"**.
7. **Action**: An alert is sent to Slack (show Slack window if possible, or observe the browser alert success).
8. **Result**: The UI updates. The issue disappears from the list or the record updates to showing "Antigravity" as owner and "Just now" as last touch.
9. "The leak is plugged."

## Step 5: Fix a Duplicate
1. Find a `DUPLICATE_SUSPECT`.
2. Click, Generate Fix, Run Fix.
3. Explain: "The system identifies the winner and merges the records."

## Step 6: KPI Update
1. Close the drawer.
2. Point out that "Revenue at Risk" has decreased.
