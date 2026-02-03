import { FunnelRecord, IssueSeverity, SLO } from './types';
import { CONFIG } from './config';

export const DEFINED_SLOS: SLO[] = [
    {
        id: 'SLO_LEAD_RESPONSE',
        name: 'Lead Response Time',
        target: 0.95,
        current: 1.0,
        error_budget_total_usd: CONFIG.DEFAULT_ERROR_BUDGET_USD * 0.3,
        description: `95% of leads contacted within ${CONFIG.SLA_LEAD_RESPONSE_MINS} minutes`
    },
    {
        id: 'SLO_DEAL_VELOCITY',
        name: 'Deal Velocity',
        target: 0.90,
        current: 1.0,
        error_budget_total_usd: CONFIG.DEFAULT_ERROR_BUDGET_USD * 0.4,
        description: `No deals in stage > ${CONFIG.OPP_STALENESS_DAYS} days without activity`
    },
    {
        id: 'SLO_DATA_QUALITY',
        name: 'Data Hygiene',
        target: 0.99,
        current: 1.0,
        error_budget_total_usd: CONFIG.DEFAULT_ERROR_BUDGET_USD * 0.1,
        description: 'Records must have valid Region, Owner, and Next Step'
    }
];

export class SLOManager {
    static calculateSLOStatus(records: FunnelRecord[], issues: any[]): SLO[] {
        // Clone the definitions
        const slos = DEFINED_SLOS.map(s => ({ ...s }));

        // 1. Lead Response
        const leads = records.filter(r => r.type === 'lead');
        const breaches = issues.filter(i => i.associated_slo === 'SLO_LEAD_RESPONSE');
        if (leads.length > 0) {
            slos[0].current = 1 - (breaches.length / leads.length);
        }

        // 2. Deal Velocity
        const opps = records.filter(r => r.type === 'opp');
        const velocityBreaches = issues.filter(i => i.associated_slo === 'SLO_DEAL_VELOCITY');
        if (opps.length > 0) {
            slos[1].current = 1 - (velocityBreaches.length / opps.length);
        }

        // 3. Data Hygiene
        const hygieneBreaches = issues.filter(i =>
            ['SLO_DATA_QUALITY', 'SLO_UNOWNED_RECORDS', 'SLO_NEXT_STEP_HYGIENE'].includes(i.associated_slo)
        );
        if (records.length > 0) {
            slos[2].current = 1 - (hygieneBreaches.length / records.length);
        }

        return slos;
    }

    static getOverallBudgetBurn(issues: any[], totalBudget: number): number {
        const totalRisk = issues.reduce((acc, i) => acc + (i.estimated_loss_usd || 0), 0);
        return totalRisk / totalBudget;
    }
}
