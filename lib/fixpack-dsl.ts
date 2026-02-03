import { FunnelRecord, FixPackStep, DSLAction } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionContext {
    records: FunnelRecord[];
    logs: string[];
    sideEffects: {
        slack_messages: any[];
        emails: any[];
        tasks: any[];
    };
    dryRun: boolean;
}

export function executeFixPackDSL(steps: FixPackStep[], context: ExecutionContext): FunnelRecord[] {
    let currentRecords = [...context.records];

    for (const step of steps) {
        context.logs.push(`[${context.dryRun ? 'DRY-RUN' : 'EXEC'}] Action: ${step.action} - ${step.description}`);

        switch (step.action) {
            case 'identify_records':
                // Usually this is filtered beforehand, but we could refine here
                // For now, assume context.records are the identified ones
                break;

            case 'add_next_step':
                if (!context.dryRun) {
                    currentRecords = currentRecords.map(r => ({
                        ...r,
                        next_step: step.params.value || 'Follow-up required (Automated)'
                    }));
                }
                break;

            case 'reassign_owner':
                if (!context.dryRun) {
                    const newOwner = step.params.owner || 'Unassigned_Queue';
                    currentRecords = currentRecords.map(r => ({
                        ...r,
                        owner: newOwner
                    }));
                }
                break;

            case 'write_back_task':
                if (context.dryRun) {
                    context.logs.push(`  -> Would create CRM task: "${step.params.subject}"`);
                } else {
                    context.sideEffects.tasks.push({
                        title: step.params.subject,
                        due: step.params.due_date
                    });
                }
                break;

            case 'notify_slack':
                if (context.dryRun) {
                    context.logs.push(`  -> Would post to Slack channel ${step.params.channel}`);
                } else {
                    context.sideEffects.slack_messages.push({
                        channel: step.params.channel,
                        text: step.params.message
                    });
                }
                break;

            case 'set_sla_timer':
                context.logs.push(`  -> SLA Timer reset/updated for ${currentRecords.length} records`);
                break;

            default:
                context.logs.push(`  -> Unknown action ${step.action}, skipping.`);
        }
    }

    return currentRecords;
}

export function generateDSLForFix(fixType: string, record: FunnelRecord): FixPackStep[] {
    const steps: FixPackStep[] = [];

    // Always identify context first
    steps.push({
        action: 'identify_records',
        params: { id: record.id },
        description: `Target record ${record.name}`
    });

    switch (fixType) {
        case 'fix_sla_breach':
            steps.push({
                action: 'notify_slack',
                params: { channel: '#rev-leak-alerts', message: `SLA Breach detected on ${record.name}. Immediate action required.` },
                description: 'Alert urgency to #rev-leak-alerts'
            });
            steps.push({
                action: 'write_back_task',
                params: { subject: 'SLA Breach Recovery Call', due_date: 'TODAY' },
                description: 'Create high-priority CRM task'
            });
            break;

        case 'fix_assign_owner':
            steps.push({
                action: 'reassign_owner',
                params: { owner: 'Round_Robin_Bot' },
                description: 'Assign to Round Robin queue'
            });
            steps.push({
                action: 'notify_slack',
                params: { channel: '#sales-ops', message: `Record ${record.name} was unowned. Assigned to RR Bot.` },
                description: 'Notify Ops of assignment'
            });
            break;

        case 'fix_next_step':
            steps.push({
                action: 'add_next_step',
                params: { value: 'Review Account Status' },
                description: 'Set default next step'
            });
            break;

        default:
            steps.push({
                action: 'draft_email',
                params: { subject: 'Action Required', recipient: record.owner || 'Manager' },
                description: 'Draft nudge email to owner'
            });
    }

    return steps;
}
