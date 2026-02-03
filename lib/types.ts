export type RecordType = 'lead' | 'opp';

export interface FunnelRecord {
    id: string;
    type: RecordType;
    name: string;
    email: string;
    domain: string;
    company: string;
    source: string;
    region: string;
    owner: string | null;
    stage: string | null;
    created_at: string; // ISO timestamp
    last_touch_at: string | null; // ISO timestamp
    next_step: string | null;
    value_usd: number | null;
    notes: string | null;
}

export type IssueSeverity = 'high' | 'medium' | 'low';

export interface LeakIssue {
    issue_id: string;
    record_id: string;
    issue_type: string;
    severity: number; // 1-10
    severity_label: IssueSeverity;
    explanation: string;
    suggested_fix_id: string;
    estimated_loss_usd: number;
    confidence: number; // 0-1
}

export interface FixPack {
    fix_id: string;
    title: string;
    steps: string[];
    automation_payload: any;
    verification_check?: string;
    email_draft?: {
        subject: string;
        body: string;
    };
    slack_message?: string;
}

export type IncidentStatus = 'open' | 'resolved';
export type IncidentSeverity = 1 | 2 | 3 | 4 | 5;
export type PagingState = 'OK' | 'WARN' | 'PAGE';

export interface Incident {
    incident_id: string;
    created_at: string;
    status: IncidentStatus;
    severity: IncidentSeverity;
    total_at_risk_usd: number;
    burn_rate: number; // 0-1 (or >1 if burned)
    error_budget_usd: number;
    top_causes: { issue_type: string; count: number; at_risk_usd: number }[];
    affected_segments: { key: string; value: string; at_risk_usd: number }[]; // e.g. Owner: Alice
}

export type TimelineEventType = 'DETECTED' | 'FIXPACK_GENERATED' | 'FIX_APPLIED' | 'RESOLVED' | 'MANUAL_NOTE';

export interface TimelineEvent {
    id: string;
    ts: string;
    type: TimelineEventType;
    message: string;
    data?: any;
}
