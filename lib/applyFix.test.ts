import { describe, it, expect, beforeEach } from 'vitest';
import { applyFixPack } from './applyFix';
import { FunnelRecord, FixPack } from './types';
import { IncidentManager } from './incident';

describe('Apply Fix Logic', () => {
    beforeEach(() => {
        IncidentManager.clear();
    });

    it('should apply SLA fix by updating last_touch and next_step', () => {
        const records: FunnelRecord[] = [
            { id: '1', name: 'Test', last_touch_at: null, next_step: null, owner: null } as any
        ];
        const fixPack: FixPack = {
            fix_id: 'fix_1', title: 'Test Fix', steps: [], workflow_steps: [],
            automation_payload: { record_id: '1', action_type: 'SLA_BREACH_FIX' }
        };

        const { updatedRecords, affectedCount } = applyFixPack(records, fixPack);

        expect(affectedCount).toBe(1);
        expect(updatedRecords[0].last_touch_at).not.toBeNull();
        expect(updatedRecords[0].next_step).toBe('Follow up scheduled');
        expect(updatedRecords[0].owner).toBe('Auto-Routed (SRE)');
    });

    it('should apply merge duplicate logic', () => {
        const records: FunnelRecord[] = [
            { id: '1', name: 'Dupe', notes: 'Original', stage: 'New' } as any
        ];
        const fixPack: FixPack = {
            fix_id: 'fix_1', title: 'Test Fix', steps: [], workflow_steps: [],
            automation_payload: { record_id: '1', action_type: 'MERGE_DUPLICATE' }
        };

        const { updatedRecords } = applyFixPack(records, fixPack);

        expect(updatedRecords[0].notes).toContain('[MERGED]');
        expect(updatedRecords[0].stage).toBe('Archived');
    });

    it('should log an event to IncidentManager', () => {
        const records: FunnelRecord[] = [{ id: '1' } as any];
        const fixPack: FixPack = {
            fix_id: 'fix_1', title: 'Test Fix', steps: [], workflow_steps: [],
            automation_payload: { record_id: '1', action_type: 'ASSIGN_OWNER' }
        };
        applyFixPack(records, fixPack);

        const timeline = IncidentManager.getTimeline();
        expect(timeline).toHaveLength(1);
        expect(timeline[0].type).toBe('FIX_APPLIED');
    });
});
