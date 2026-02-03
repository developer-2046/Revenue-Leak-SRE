import { FunnelRecord } from './types';
import { differenceInDays, differenceInMinutes } from 'date-fns';

export interface SLOConfig {
    lead_response_time_hours: number;
    opp_freshness_days: number;
    max_stale_revenue_usd: number;
}

export const DEFAULT_SLO_CONFIG: SLOConfig = {
    lead_response_time_hours: 1, // 60 mins from previous SLA_MINUTES but stricter for SLO
    opp_freshness_days: 10,
    max_stale_revenue_usd: 50000
};

export interface ReliabilityMetrics {
    lead_slo_breach_count: number;
    lead_slo_compliance_rate: number; // 0-1
    opp_freshness_breach_count: number;
    opp_freshness_compliance_rate: number; // 0-1
    revenue_at_risk_stale: number;
    error_budget_remaining: number; // 0-1 (mock metric for demo)
    top_breaches: { id: string; name: string; reason: string; dollar_impact: number }[];
}

export function calculateReliabilityMetrics(
    records: FunnelRecord[],
    config: SLOConfig = DEFAULT_SLO_CONFIG
): ReliabilityMetrics {
    const now = new Date();

    let leadTotal = 0;
    let leadBreaches = 0;

    let oppTotal = 0;
    let oppBreaches = 0;
    let staleRevenue = 0;

    const breaches: { id: string; name: string; reason: string; dollar_impact: number }[] = [];

    records.forEach(record => {
        // Lead Response SLO
        if (record.type === 'lead') {
            leadTotal++;
            if (!record.last_touch_at) {
                const hoursOld = differenceInMinutes(now, new Date(record.created_at)) / 60.0;
                if (hoursOld > config.lead_response_time_hours) {
                    leadBreaches++;
                    breaches.push({
                        id: record.id,
                        name: record.name,
                        reason: `Lead untouched > ${config.lead_response_time_hours}h`,
                        dollar_impact: record.value_usd || 0
                    });
                }
            }
        }

        // Opp Freshness SLO
        if (record.type === 'opp' && !['Closed Won', 'Closed Lost'].includes(record.stage || '')) {
            oppTotal++;
            const lastActivity = record.last_touch_at || record.created_at;
            const daysStale = differenceInDays(now, new Date(lastActivity));

            if (daysStale > config.opp_freshness_days) {
                oppBreaches++;
                const val = record.value_usd || 0;
                staleRevenue += val;
                breaches.push({
                    id: record.id,
                    name: record.name,
                    reason: `Opp stale > ${config.opp_freshness_days}d`,
                    dollar_impact: val
                });
            }
        }
    });

    const leadCompliance = leadTotal === 0 ? 1 : 1 - (leadBreaches / leadTotal);
    const oppCompliance = oppTotal === 0 ? 1 : 1 - (oppBreaches / oppTotal);

    // Mock "Error Budget" logic: 
    // We allow 5% breach rate. 
    // Current breach rate = (leadBreaches + oppBreaches) / (leadTotal + oppTotal)
    // Budget Remaining = 1 - (Current Rate / Allowed Rate 0.05) ? 
    // tailored for visual impact.
    const totalRecs = leadTotal + oppTotal;
    const totalBreaches = leadBreaches + oppBreaches;
    const overallErrorRate = totalRecs === 0 ? 0 : totalBreaches / totalRecs;
    const allowedErrorRate = 0.10; // 10% tolerance
    const errorBudgetRemaining = Math.max(0, 1 - (overallErrorRate / allowedErrorRate));

    return {
        lead_slo_breach_count: leadBreaches,
        lead_slo_compliance_rate: leadCompliance,
        opp_freshness_breach_count: oppBreaches,
        opp_freshness_compliance_rate: oppCompliance,
        revenue_at_risk_stale: staleRevenue,
        error_budget_remaining: errorBudgetRemaining,
        top_breaches: breaches.sort((a, b) => b.dollar_impact - a.dollar_impact).slice(0, 5)
    };
}
