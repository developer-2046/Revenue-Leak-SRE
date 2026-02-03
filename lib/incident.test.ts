import { describe, it, expect, beforeEach } from 'vitest';
import { computeIncident, IncidentManager } from './incident';
import { LeakIssue, FunnelRecord } from './types';

describe('Incident Logic', () => {
    beforeEach(() => {
        IncidentManager.clear();
    });

    it('should not create an incident if no issues exist', () => {
        const incident = computeIncident([], []);
        expect(incident.status).toBe('resolved');
        expect(IncidentManager.getTimeline()).toHaveLength(0); // Only creates events on open/resolve transitions
    });

    it('should create an OPEN incident when issues exist', () => {
        const issues: LeakIssue[] = [{
            issue_id: '1', record_id: 'r1', issue_type: 'SLA_BREACH', estimated_loss_usd: 1000,
            severity: 1, severity_label: 'high', explanation: 'test', suggested_fix_id: 'f1', confidence: 1
        }];
        const records: FunnelRecord[] = [];

        const incident = computeIncident(issues, records);
        expect(incident.status).toBe('open');
        expect(incident.total_at_risk_usd).toBe(1000);
        expect(incident.incident_id).toContain('INC-');

        const timeline = IncidentManager.getTimeline();
        expect(timeline).toHaveLength(1);
        expect(timeline[0].type).toBe('DETECTED');
    });

    it('should determine severity based on burn rate', () => {
        // Sev 1: > 2.0 burn rate
        const issues: LeakIssue[] = [{
            issue_id: '1', record_id: 'r1', issue_type: 'HUGE_LOSS', estimated_loss_usd: 150000,
            severity: 1, severity_label: 'high', explanation: 'test', suggested_fix_id: 'f1', confidence: 1
        }];
        // Budget 50k
        const incident = computeIncident(issues, [], 50000);
        expect(incident.burn_rate).toBe(3.0);
        expect(incident.severity).toBe(1);
    });
});
