import { describe, it, expect } from 'vitest';
import { calculateImpact } from './impact';
import { FunnelRecord } from './types';
import { CONFIG } from './config';

describe('Impact Logic', () => {
    it('should calculate SLA violation impact as 50% of value', () => {
        const record = { value_usd: 1000 } as FunnelRecord;
        const impact = calculateImpact(record, 'SLA_BREACH_UNTOUCHED');
        expect(impact).toBe(500);
    });

    it('should calculate unassigned owner impact as 100% of value', () => {
        const record = { value_usd: 2000 } as FunnelRecord;
        const impact = calculateImpact(record, 'UNASSIGNED_OWNER');
        expect(impact).toBe(2000);
    });

    it('should decay stale opp probability over time', () => {
        // Base prob for Proposal is 0.45
        // Halflife is 14 days
        // If stale for 14 days, prob should simulate dropping significantly 
        // Logic: prob = base * exp(-k * days)
        // Delta = base - prob

        const now = new Date();
        const created14DaysAgo = new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString();

        const record: FunnelRecord = {
            id: '1', type: 'opp', stage: 'Proposal', value_usd: 10000,
            created_at: created14DaysAgo, last_touch_at: created14DaysAgo,
        } as any;

        const impact = calculateImpact(record, 'STALE_OPP');

        // Base Prob = 0.45
        // Decayed Prob after 1 halflife = 0.45 * 0.5 = 0.225
        // Loss = (0.45 - 0.225) * 10000 = 2250

        // Due to rounding or exact date diff moments, allow small margin via calculation check
        const k = Math.log(2) / 14;
        const factor = Math.exp(-k * 14); // should be 0.5
        const expectedLoss = Math.round(10000 * (0.45 - (0.45 * factor)));

        expect(impact).toBeCloseTo(expectedLoss, -1);
    });
});
