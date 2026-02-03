import { FunnelRecord } from './types';

export type FixActionType = 'SLACK_ALERT' | 'CREATE_TASK' | 'DRAFT_EMAIL' | 'REASSIGN_OWNER' | 'UPDATE_FIELD' | 'MERGE_RECORDS';

export interface FixAction {
    type: FixActionType;
    description: string;
    payload: any;
    status: 'pending' | 'applied' | 'failed';
}

export interface ImpactedRecord {
    recordId: string;
    changes: { field: keyof FunnelRecord; oldValue: any; newValue: any }[];
}

export interface ExtendedFixPack {
    id: string;
    createdAt: string;
    ruleId: string;
    title: string;
    description: string;

    // Impact
    issues: {
        recordId: string;
        dollarImpact: number;
    }[];
    totalDollarsAtRisk: number;
    expectedRecoveryDollars: number;

    // Execution
    actions: FixAction[];
    impactedRecords: ImpactedRecord[]; // Computed diffs for preview

    status: 'draft' | 'approved' | 'applied';
}
