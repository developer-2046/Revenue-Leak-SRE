import { describe, it, expect } from 'vitest';
import { calculateReliabilityMetrics } from './reliability';
import { FunnelRecord } from './types';
import { subHours, subDays } from 'date-fns';
import { CONFIG } from './config';

describe('Revenue Reliability Model', () => {
    it('calculates perfect compliance when no records breach', () => {
        const now = new Date();
        const records: FunnelRecord[] = [
            { id: '1', type: 'lead', created_at: now.toISOString(), last_touch_at: null } as any,
            { id: '2', type: 'opp', created_at: subDays(now, 5).toISOString(), last_touch_at: subDays(now, 1).toISOString() } as any
        ];

        const metrics = calculateReliabilityMetrics(records, 0, 50000);
        expect(metrics.lead_slo_compliance_rate).toBe(1);
        expect(metrics.opp_freshness_compliance_rate).toBe(1);
        expect(metrics.error_budget_remaining).toBe(1);
        expect(metrics.paging_state).toBe('OK');
    });

    it('detects lead breaches correctly', () => {
        const now = new Date();
        const records: FunnelRecord[] = [
            {
                id: '1', type: 'lead',
                created_at: subHours(now, 2).toISOString(), // > 1h breach
                last_touch_at: null
            } as any
        ];

        // Pass 0 risk for this test just to check compliance rate
        const metrics = calculateReliabilityMetrics(records, 0, 50000);
        expect(metrics.lead_slo_compliance_rate).toBe(0);
    });

    it('calculates paging state based on burn rate', () => {
        const records: FunnelRecord[] = [];
        // Budget 50k. Risk 30k. Burn rate = 0.6 (> 0.5 PAGE threshold)
        const metrics = calculateReliabilityMetrics(records, 30000, 50000);

        expect(metrics.error_budget_remaining).toBe(0.4); // 1 - 0.6
        expect(metrics.paging_state).toBe('PAGE');
    });

    it('calculates WARN state', () => {
        const records: FunnelRecord[] = [];
        // Budget 50k. Risk 15k. Burn rate = 0.3 (> 0.25 WARN threshold)
        const metrics = calculateReliabilityMetrics(records, 15000, 50000);

        expect(metrics.paging_state).toBe('WARN');
    });
});
