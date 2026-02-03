# Rules Catalog

The Revenue Leak SRE engine currently supports the following detection rules. Each rule maps to a Revenue SLO.

## 1. SLA Breach (Untouched Lead)
- **Code**: `SLA_BREACH_UNTOUCHED`
- **SLO Mapping**: `SLO_LEAD_RESPONSE` (Latency)
- **Severity**: High (SEV-2)
- **Logic**: `Type == Lead` AND `TimeSinceCreation > 30 mins` AND `LastTouch == null`
- **Fix Pack**: **"Rapid Response Protocol"**
  - Auto-assign owner
  - Send "Apology/Nudge" email
  - Alert #revenue-leak-alerts channel

## 2. Stale Opportunity (Ghosting)
- **Code**: `STALE_OPP`
- **SLO Mapping**: `SLO_DEAL_VELOCITY` (Availability)
- **Severity**: High (SEV-2)
- **Logic**: `Type == Opp` AND `Stage != Closed` AND `LastTouch > 7 Days`
- **Fix Pack**: **"Opportunity Rescue"**
  - Check LinkedIn signal
  - Draft "Breakup" email
  - Offer discount hook

## 3. Duplicate Suspect
- **Code**: `DUPLICATE_SUSPECT`
- **SLO Mapping**: `SLO_DATA_QUALITY` (Error Rate)
- **Severity**: Medium (SEV-3)
- **Logic**: Same `domain` exists on multiple active records.
- **Fix Pack**: **"Dedupe & Merge"**
  - Identify primary record (newest activity)
  - Merge notes
  - Archive secondary

## 4. Unassigned Owner
- **Code**: `UNASSIGNED_OWNER`
- **SLO Mapping**: `SLO_UNOWNED_RECORDS`
- **Severity**: Critical (SEV-1)
- **Logic**: `Owner == null`
- **Fix Pack**: **"Round Robin Routing"**
  - Assign to next available rep (mocked as 'Round Robin Bot')

## 5. No Next Step (Hygiene)
- **Code**: `NO_NEXT_STEP`
- **SLO Mapping**: `SLO_NEXT_STEP_HYGIENE`
- **Severity**: Medium (SEV-3)
- **Logic**: Active deal with `NextStep == null`
- **Fix Pack**: **"Enforce Hygiene"**
  - Set default next step based on Stage
