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
    verification_check: string;
    slack_message?: string;
    email_draft?: {
        subject: string;
        body: string;
    };
}
