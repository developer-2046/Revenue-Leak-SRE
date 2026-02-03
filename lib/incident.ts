import { FunnelRecord, LeakIssue, Incident, TimelineEvent, IncidentSeverity } from './types';
import { CONFIG } from './config';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for the session
let TIMELINE_STORE: TimelineEvent[] = [];
let ACTIVE_INCIDENT_ID: string | null = null;
let START_TIME: string = new Date().toISOString();

export class IncidentManager {
    static getTimeline(): TimelineEvent[] {
        return TIMELINE_STORE;
    }

    static addEvent(type: TimelineEvent['type'], message: string, data?: any) {
        const event: TimelineEvent = {
            id: uuidv4(),
            ts: new Date().toISOString(),
            type,
            message,
            data
        };
        TIMELINE_STORE.unshift(event); // Newest first
        return event;
    }

    static clear() {
        TIMELINE_STORE = [];
        ACTIVE_INCIDENT_ID = null;
        START_TIME = new Date().toISOString();
    }
}

export function computeIncident(issues: LeakIssue[], records: FunnelRecord[], errorBudgetUsd: number = CONFIG.DEFAULT_ERROR_BUDGET_USD): Incident {
    const totalAtRisk = issues.reduce((sum, issue) => sum + (issue.estimated_loss_usd || 0), 0);
    const count = issues.length;

    // Determine Severity
    // Sev 1: > 200% budget burn OR > 50 critical issues
    // Sev 2: > 100% budget burn
    // Sev 3: > 50% budget burn
    // Sev 4: > 0 issues
    // Sev 5: 0 issues (Resolved)

    let severity: IncidentSeverity = 5;
    let status: 'open' | 'resolved' = 'resolved';

    if (count > 0) {
        status = 'open';
        const burnRate = totalAtRisk / errorBudgetUsd;

        if (burnRate > 2.0 || issues.filter(i => i.severity_label === 'high').length > 50) severity = 1;
        else if (burnRate > 1.0) severity = 2;
        else if (burnRate > 0.5) severity = 3;
        else severity = 4;

        // Ensure we have an active incident ID if open
        if (!ACTIVE_INCIDENT_ID) {
            ACTIVE_INCIDENT_ID = `INC-${uuidv4().substring(0, 6).toUpperCase()}`;
            IncidentManager.addEvent('DETECTED', `Incident ${ACTIVE_INCIDENT_ID} detected. ${count} leaks found.`, { totalAtRisk });
        }
    } else {
        if (ACTIVE_INCIDENT_ID) {
            IncidentManager.addEvent('RESOLVED', `Incident ${ACTIVE_INCIDENT_ID} resolved. All leaks fixed.`);
            ACTIVE_INCIDENT_ID = null;
        }
    }

    // Top Causes
    const causeMap = new Map<string, { count: number, usd: number }>();
    issues.forEach(i => {
        const curr = causeMap.get(i.issue_type) || { count: 0, usd: 0 };
        curr.count++;
        curr.usd += (i.estimated_loss_usd || 0);
        causeMap.set(i.issue_type, curr);
    });
    const topCauses = Array.from(causeMap.entries())
        .map(([type, stats]) => ({ issue_type: type, count: stats.count, at_risk_usd: stats.usd }))
        .sort((a, b) => b.at_risk_usd - a.at_risk_usd)
        .slice(0, 5);

    // Affected Segments (simple heuristic: Owner)
    const segmentMap = new Map<string, number>();
    issues.forEach(i => {
        const record = records.find(r => r.id === i.record_id);
        const owner = record?.owner || 'Unassigned';
        segmentMap.set(owner, (segmentMap.get(owner) || 0) + (i.estimated_loss_usd || 0));
    });
    const affectedSegments = Array.from(segmentMap.entries())
        .map(([owner, usd]) => ({ key: 'Owner', value: owner, at_risk_usd: usd }))
        .sort((a, b) => b.at_risk_usd - a.at_risk_usd)
        .slice(0, 5);

    return {
        incident_id: ACTIVE_INCIDENT_ID || 'N/A',
        created_at: START_TIME,
        status,
        severity,
        total_at_risk_usd: totalAtRisk,
        burn_rate: totalAtRisk / errorBudgetUsd,
        error_budget_usd: errorBudgetUsd,
        top_causes: topCauses,
        affected_segments: affectedSegments
    };
}
