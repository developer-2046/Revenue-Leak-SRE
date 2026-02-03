import { FunnelRecord, FixPack } from './types';
import { IncidentManager } from './incident';

export interface FixResult {
    updatedRecords: FunnelRecord[];
    appliedActionSummary: string;
    affectedCount: number;
}

export function applyFixPack(records: FunnelRecord[], fixPack: FixPack): FixResult {
    let affectedCount = 0;
    const issueType = fixPack.fix_id.split('_').slice(1).join('_'); // rough heuristic based on fix_id convention "fix_<type>_<id>" or just "fix_<id>" 
    // Actually fix_id in current gen is 'fix_' + issue.issue_id. 
    // We should rely on what the fix pack title implies or pass context.
    // For simplicity in this demo, we infer logic from the *content* of the fix pack title or use a passed-in type if we refactored.
    // BUT checking `issue.issue_type` would be cleaner. 
    // Since we don't have the issue type explicitly in FixPack, we will interpret the *actions* we know we generated in `IssueDrawer`,
    // OR we can make this function generic enough to apply changes based on a "payload" we define.

    // To make this robust: We'll modify `generateFixPack` to include `record_id` and `action_type` in the payload 
    // so we can read it here.
    // For now, let's assume we pass the *target record ID* via the payload or we search for the specific issue.

    // Let's trust the input record list is the source. The FixPack likely targets the record that generated it.
    // We need to know WHICH record to fix. 
    // Hack: We'll assume the caller passes only the relevant fix pack and we search for the record match if possible, 
    // OR more reliably, we update the `FixPack` type or payload to carry the `recordId`.

    const targetRecordId = fixPack.automation_payload?.record_id;
    const actionType = fixPack.automation_payload?.action_type;

    if (!targetRecordId) {
        console.warn("FixPack missing target record_id", fixPack);
        return { updatedRecords: records, appliedActionSummary: "Failed: No target record", affectedCount: 0 };
    }

    const updatedRecords = records.map(r => {
        if (r.id !== targetRecordId) return r;

        affectedCount++;
        const copy = { ...r };

        if (actionType === 'SLA_BREACH_FIX') {
            copy.last_touch_at = new Date().toISOString();
            if (!copy.owner) copy.owner = 'Auto-Routed (SRE)';
            copy.next_step = 'Follow up scheduled';
        }
        else if (actionType === 'ASSIGN_OWNER') {
            copy.owner = 'Auto-Routed (SRE)';
        }
        else if (actionType === 'RESCUE_STALE') {
            copy.last_touch_at = new Date().toISOString();
            copy.notes = (copy.notes || '') + ' [Rescued by SRE]';
            copy.next_step = 'Rescue sequence initiated';
        }
        else if (actionType === 'MERGE_DUPLICATE') {
            // In a real app we'd delete this one or the other.
            // Here we mark it merged.
            copy.notes = (copy.notes || '') + ' [MERGED]';
            copy.stage = 'Archived';
            // Ideally we'd remove it, but soft delete is safer for visual demo diff
        }
        else if (actionType === 'ADD_NEXT_STEP') {
            copy.next_step = 'Discovery Call';
        }

        return copy;
    });

    // If it was a merge, we might want to actually filter out the archived one?
    // Let's keep it but maybe the scanner ignores 'Archived' stage.
    // Validation: Update scanner to ignore 'Archived'.

    IncidentManager.addEvent('FIX_APPLIED', `Applied ${actionType} to record ${targetRecordId}`);

    return {
        updatedRecords,
        appliedActionSummary: `Applied ${actionType} to 1 record.`,
        affectedCount
    };
}
