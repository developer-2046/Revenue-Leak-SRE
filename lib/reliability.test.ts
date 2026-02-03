import { describe, it, expect } from 'vitest';
import { calculateReliabilityMetrics, DEFAULT_SLO_CONFIG } from './reliability';
import { FunnelRecord } from './types';
import { subHours, subDays } from 'date-fns';

describe('Revenue Reliability Model', () => {
    it('calculates perfect compliance when no records breach', () => {
        const now = new Date();
        const records: FunnelRecord[] = [
            {
                id: '1', type: 'lead', name: 'Fresh', email: 'a@a.com', domain: 'a.com', company: 'A', source: 'web', region: 'NA', owner: 'Me', stage: 'New',
                created_at: now.toISOString(), last_touch_at: null, next_step: null, value_usd: 1000, notes: null
            },
            {
                id: '2', type: 'opp', name: 'Active', email: 'b@b.com', domain: 'b.com', company: 'B', source: 'web', region: 'NA', owner: 'Me', stage: 'Proposal',
                created_at: subDays(now, 5).toISOString(), last_touch_at: subDays(now, 1).toISOString(), next_step: 'Calls', value_usd: 5000, notes: null
            }
        ];

        const metrics = calculateReliabilityMetrics(records);
        expect(metrics.lead_slo_compliance_rate).toBe(1);
        expect(metrics.opp_freshness_compliance_rate).toBe(1);
        expect(metrics.error_budget_remaining).toBe(1);
    });

    it('detects lead breaches correctly', () => {
        const now = new Date();
        const records: FunnelRecord[] = [
            {
                id: '1', type: 'lead', name: 'Old', email: 'a@a.com', domain: 'a.com', company: 'A', source: 'web', region: 'NA', owner: null, stage: 'New',
                created_at: subHours(now, 2).toISOString(), // > 1h breach
                last_touch_at: null, next_step: null, value_usd: 1000, notes: null
            }
        ];
        const metrics = calculateReliabilityMetrics(records);
        expect(metrics.lead_slo_breach_count).toBe(1);
        expect(metrics.lead_slo_compliance_rate).toBe(0);
        // Error budget should drop. 1 breach / 1 record = 100% error rate. Allowed 10%. Budget 0.
        expect(metrics.error_budget_remaining).toBe(0);
    });

    it('aggregates stalemate revenue', () => {
        const now = new Date();
        const records: FunnelRecord[] = [
            {
                id: '1', type: 'opp', name: 'Stale', email: 'a@a.com', domain: 'a.com', company: 'A', source: 'web', region: 'NA', owner: 'Me', stage: 'Proposal',
                created_at: subDays(now, 20).toISOString(),
                last_touch_at: subDays(now, 15).toISOString(), // > 10d breach
                next_step: null, value_usd: 50000, notes: null
            }
        ];
        const metrics = calculateReliabilityMetrics(records);
        expect(metrics.revenue_at_risk_stale).toBe(50000);
        expect(metrics.top_breaches[0].id).toBe('1');
    });
});
