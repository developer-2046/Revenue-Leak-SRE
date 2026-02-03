import { LeakIssue, FunnelRecord } from './types';
import { CONSTANTS } from './constants';
import { differenceInMinutes, differenceInDays } from 'date-fns';

export function estimateImpact(issues: LeakIssue[], records: FunnelRecord[]): LeakIssue[] {
    return issues.map(issue => {
        const record = records.find(r => r.id === issue.record_id);
        if (!record) return issue;

        let loss = 0;
        const now = new Date();

        switch (issue.issue_type) {
            case 'SLA_BREACH_UNTOUCHED': {
                const minutesLate = differenceInMinutes(now, new Date(record.created_at)) - CONSTANTS.SLA_MINUTES;
                const decay = Math.min(0.6, 0.15 + 0.02 * Math.floor(minutesLate / 15));
                loss = CONSTANTS.BASE_LEAD_VALUE_USD * decay;
                break;
            }
            case 'STALE_OPP': {
                const daysStale = differenceInDays(now, new Date(record.last_touch_at || record.created_at)) - CONSTANTS.STALE_DAYS;
                const value = record.value_usd || CONSTANTS.BASE_LEAD_VALUE_USD;
                // stage_probability_decay(d) = clamp(0.9 - 0.05*d, 0.2, 0.9) ... actually risk is (1 - prob) * value?
                // User said: expected_loss = value_usd * stage_probability_decay(days_inactive)
                // implying the decay factor is the % lost?
                const decayFactor = Math.min(0.9, Math.max(0.2, 0.05 * daysStale));
                // using simple heuristic: risk increases with days.
                loss = value * decayFactor;
                break;
            }
            case 'UNASSIGNED_OWNER':
                loss = CONSTANTS.BASE_LEAD_VALUE_USD * CONSTANTS.UNASSIGNED_PENALTY_FACTOR;
                break;
            case 'NO_NEXT_STEP':
                const val = record.value_usd || CONSTANTS.BASE_LEAD_VALUE_USD;
                loss = val * CONSTANTS.NO_NEXT_STEP_PENALTY_FACTOR;
                break;
            case 'DUPLICATE_SUSPECT':
                loss = CONSTANTS.AVG_DUPLICATE_WASTED_HOURS * CONSTANTS.REP_HOURLY_COST_USD;
                break;
            default:
                loss = 0;
        }

        return {
            ...issue,
            estimated_loss_usd: Math.round(loss)
        };
    });
}
