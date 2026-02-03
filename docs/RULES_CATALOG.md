# Rules Catalog

These rules are implemented in `lib/scanner.ts`.

## 1. SLA_BREACH_UNTOUCHED
- **Logic**: Lead created > 30 mins ago AND `last_touch_at` is null.
- **Severity**: High (8-10).
- **Impact**: Value decays with time.
- **Fix**: Immediate task creation + Email draft + Slack alert.

## 2. UNASSIGNED_OWNER
- **Logic**: `owner` field is null/empty.
- **Severity**: High (9).
- **Impact**: Flat penalty factor (50% of lead value).
- **Fix**: Application assigns owner (Robin Robin or self).

## 3. NO_NEXT_STEP
- **Logic**: 
    - Lead > 1 day old with no `next_step`.
    - Open Opportunity with no `next_step`.
- **Severity**: Medium/High (6-7).
- **Impact**: Flat penalty factor (30%).
- **Fix**: Task to define next step.

## 4. STALE_OPP
- **Logic**: Open Opportunity with `last_touch_at` > 7 days ago.
- **Severity**: High (8).
- **Impact**: Probability decay based on days inactive.
- **Fix**: Rescue sequence checklist + Slack escalation.

## 5. DUPLICATE_SUSPECT
- **Logic**: Same `domain` appears in multiple active records.
- **Severity**: Medium (5).
- **Impact**: Wasted rep hours.
- **Fix**: Merge recommendation (keep newest/fullest).

## 6. ROUTING_MISMATCH
- **Logic**: `region` is missing.
- **Severity**: Medium (5).
- **Impact**: Low/Medium efficiency loss.
- **Fix**: Manual review/update.
