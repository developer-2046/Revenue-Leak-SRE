import { FunnelRecord, LeakIssue, IssueSeverity } from './types';
import { differenceInMinutes, differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const SLA_MINUTES = 30;
const STALE_DAYS = 7;

export function scanForLeaks(records: FunnelRecord[]): LeakIssue[] {
    const issues: LeakIssue[] = [];
    const now = new Date();

    // Helper map for duplicates
    const domainMap = new Map<string, string[]>();

    records.forEach(record => {
        // Populate maps for duplicates
        if (record.domain) {
            if (!domainMap.has(record.domain)) domainMap.set(record.domain, []);
            domainMap.get(record.domain)?.push(record.id);
        }

        // 1. SLA_BREACH_UNTOUCHED
        if (record.type === 'lead' && !record.last_touch_at) {
            const created = new Date(record.created_at);
            const diff = differenceInMinutes(now, created);
            if (diff > SLA_MINUTES) {
                issues.push(createIssue(record, 'SLA_BREACH_UNTOUCHED', 8, 'high',
                    `Lead untouched for ${diff} minutes (SLA: ${SLA_MINUTES}m)`, 'fix_sla_breach', 'SLO_LEAD_RESPONSE', 'Capacity Bottleneck', ['SDR_Team', 'Marketing']));
            }
        }

        // 2. UNASSIGNED_OWNER
        if (!record.owner) {
            issues.push(createIssue(record, 'UNASSIGNED_OWNER', 9, 'high', 'Record has no owner assigned', 'fix_assign_owner', 'SLO_UNOWNED_RECORDS', 'Routing Rule Failure', ['RevOps', 'Sales_Mgmt']));
        }

        // 3. NO_NEXT_STEP
        if (record.type === 'lead' && differenceInDays(now, new Date(record.created_at)) > 1 && !record.next_step) {
            issues.push(createIssue(record, 'NO_NEXT_STEP', 6, 'medium', 'Old lead with no next step detected', 'fix_next_step', 'SLO_NEXT_STEP_HYGIENE', 'Rep Process Gap', ['SDR_Team']));
        }
        if (record.type === 'opp' && !isClosed(record.stage) && !record.next_step) {
            issues.push(createIssue(record, 'NO_NEXT_STEP', 7, 'high', 'Open opportunity missing next step', 'fix_next_step', 'SLO_NEXT_STEP_HYGIENE', 'AE Process Gap', ['Sales_Team']));
        }

        // 4. STALE_OPP
        if (record.type === 'opp' && !isClosed(record.stage) && record.last_touch_at) {
            const days = differenceInDays(now, new Date(record.last_touch_at));
            if (days > STALE_DAYS) {
                issues.push(createIssue(record, 'STALE_OPP', 8, 'high', `Opportunity untouched for ${days} days`, 'fix_stale_opp', 'SLO_DEAL_VELOCITY', 'Stalled Deal / Ghosting', ['Sales_Team', 'Sales_Mgmt']));
            }
        }

        // 6. ROUTING_MISMATCH
        if (!record.region) {
            issues.push(createIssue(record, 'ROUTING_MISMATCH', 5, 'medium', 'Missing region', 'fix_routing', 'SLO_DATA_QUALITY', 'Enrichment Failure', ['RevOps', 'Data_Team']));
        } else if (record.owner) {
            // Simple mock check
            const validN = ['Alice', 'Bob', 'Dave'];
            const validE = ['Charlie'];
            if (record.region === 'NA' && !validN.includes(record.owner) && !validE.includes(record.owner)) {
                // Loose check
            }
        }
    });

    // 5. DUPLICATE_SUSPECT
    domainMap.forEach((ids, domain) => {
        if (ids.length > 1) {
            ids.forEach(id => {
                // Find the record
                const rec = records.find(r => r.id === id);
                if (rec) {
                    issues.push(createIssue(rec, 'DUPLICATE_SUSPECT', 5, 'medium', `Duplicate domain detected: ${domain}`, 'fix_merge_dupes', 'SLO_DUPLICATION', 'Integration Error', ['RevOps']));
                }
            });
        }
    });

    return issues;
}

function isClosed(stage: string | null | undefined) {
    if (!stage) return false;
    return ['Closed Won', 'Closed Lost'].includes(stage);
}

function createIssue(record: FunnelRecord, type: string, severity: number, severityLabel: IssueSeverity, explanation: string, fixId: string, slo?: string, rootCause?: string, blastRadius: string[] = []): LeakIssue {
    return {
        issue_id: `${record.id}_${type}`,
        record_id: record.id,
        issue_type: type,
        severity,
        severity_label: severityLabel,
        explanation,
        suggested_fix_id: fixId,
        estimated_loss_usd: 0,
        confidence: 0.9,
        associated_slo: slo,
        root_cause_guess: rootCause,
        blast_radius: blastRadius,
        error_budget_impact: severity * 100 // Simplified cost model
    };
}
