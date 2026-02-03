import { FunnelRecord } from './types';
import { differenceInDays, differenceInMinutes } from 'date-fns';

export interface SLOConfig {
    lead_response_time_hours: number;
    opp_freshness_days: number;
import { FunnelRecord, PagingState } from './types';
import { differenceInMinutes, differenceInDays } from 'date-fns';
import { CONFIG } from './config';

export interface ReliabilityMetrics {
    lead_slo_compliance_rate: number; // % of leads contacted within SLA
    opp_freshness_compliance_rate: number; // % of opps touched recently
    error_budget_remaining: number; // 0-1 percentage
    top_breaches: { id: string; name: string; dollar_impact: number; reason: string }[];
    paging_state: PagingState;
}

export function calculateReliabilityMetrics(records: FunnelRecord[], totalAtRisk: number = 0, budgetUsd: number = CONFIG.DEFAULT_ERROR_BUDGET_USD): ReliabilityMetrics {
    const now = new Date();

    // 1. Lead Response SLO
    const leads = records.filter(r => r.type === 'lead');
    let validLeads = 0;
    let slaCompliantLeads = 0;

    leads.forEach(l => {
        if (!l.last_touch_at && !l.created_at) return;
        validLeads++;
        const created = new Date(l.created_at);
        // If untouched, check if currently breaching
        if (!l.last_touch_at) {
            if (differenceInMinutes(now, created) <= CONFIG.SLA_LEAD_RESPONSE_MINS) slaCompliantLeads++;
        } else {
            // touched, check if touched within SLA
            const firstTouch = new Date(l.last_touch_at);
            if (differenceInMinutes(firstTouch, created) <= CONFIG.SLA_LEAD_RESPONSE_MINS) slaCompliantLeads++;
        }
    });

    const leadSlo = validLeads === 0 ? 1 : slaCompliantLeads / validLeads;

    // 2. Opp Freshness SLO
    const opps = records.filter(r => r.type === 'opp' && r.stage !== 'Closed Won' && r.stage !== 'Closed Lost');
    let freshOpps = 0;
    opps.forEach(o => {
        const lastTouch = o.last_touch_at ? new Date(o.last_touch_at) : new Date(o.created_at);
        if (differenceInDays(now, lastTouch) <= CONFIG.OPP_STALENESS_DAYS) freshOpps++;
    });

    const oppSlo = opps.length === 0 ? 1 : freshOpps / opps.length;

    // 3. Error Budget & Paging
    const burnRate = totalAtRisk / budgetUsd;
    const remaining = Math.max(0, 1 - burnRate);

    let paging_state: PagingState = 'OK';
    if (burnRate > CONFIG.PAGING_THRESHOLD_PAGE) paging_state = 'PAGE';
    else if (burnRate > CONFIG.PAGING_THRESHOLD_WARN) paging_state = 'WARN';

    // Breaches logic remains similar but simplified return mostly for UI
    return {
        lead_slo_compliance_rate: leadSlo,
        opp_freshness_compliance_rate: oppSlo,
        error_budget_remaining: remaining,
        top_breaches: [], // Populated by main impact logic usually, kept for compat
        paging_state
    };
}
