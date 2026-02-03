import { LeakIssue, FunnelRecord, FixPack } from './types';
import { CONSTANTS } from './constants';

export function generateFixPack(issue: LeakIssue, record: FunnelRecord): FixPack {
    const pack: FixPack = {
        fix_id: `fix_${issue.issue_id}`,
        title: '',
        steps: [],
        automation_payload: {},
        verification_check: '',
    };

    switch (issue.issue_type) {
        case 'SLA_BREACH_UNTOUCHED':
            pack.title = 'SLA Breach Rapid Response';
            pack.steps = [
                'Assign yourself as owner immediately.',
                'Call the lead using the number in CRM.',
                'If no answer, send the "Quick Connect" email template.',
                'Log activity to reset the timer.'
            ];
            pack.verification_check = 'Check if "last_touch_at" is updated within 10 mins.';
            pack.email_draft = {
                subject: `Re: Your inquiry at ${record.company || 'our site'}`,
                body: `Hi ${record.name.split(' ')[0]},\n\nI just saw your inquiry come in and wanted to reach out personally. I have a few minutes to chat if you're free?\n\nBest,\n[Your Name]`
            };
            pack.slack_message = `🚨 SLA BREACH: ${record.name} from ${record.company} is untouched! >${CONSTANTS.SLA_MINUTES}m overdue.`;
            break;

        case 'STALE_OPP':
            pack.title = 'Opportunity Rescue Operation';
            pack.steps = [
                'Review last notes.',
                'Check LinkedIn for job changes.',
                'Send "breakup" value email.',
                'Schedule internal blocker review if value > $10k.'
            ];
            pack.verification_check = 'Check if Stage moves or Activity logged.';
            pack.email_draft = {
                subject: `Thinking of you / ${record.company}`,
                body: `Hi ${record.name.split(' ')[0]},\n\nI haven't heard back in a week. Should we assume this project is paused for now?\n\nChecking in,\n[Your Name]`
            };
            pack.slack_message = `⚠️ STALE OPP: ${record.name} (${record.company}) - $${record.value_usd} at risk. Action required.`;
            break;

        case 'DUPLICATE_SUSPECT':
            pack.title = 'Duplicate Resolution';
            pack.steps = [
                `Compare with existing records for domain ${record.domain}.`,
                'Identify primary record (most recent activity or filled fields).',
                'Merge notes and history.',
                'Archive this record.'
            ];
            pack.verification_check = 'Check if domain has only 1 active record.';
            pack.automation_payload = {
                action: 'merge',
                target_domain: record.domain,
                strategy: 'newest_wins'
            };
            break;

        case 'UNASSIGNED_OWNER':
            pack.title = 'Round Robin Assignment';
            pack.title = 'Auto-Routing';
            pack.steps = ['Route to Round Robin'];
            pack.verification_check = 'Owner field is not null.';
            pack.automation_payload = {
                record_id: record.id,
                action_type: 'ASSIGN_OWNER'
            };
            break;

        case 'NO_NEXT_STEP':
            pack.title = 'Enforce Hygiene';
            pack.steps = ['Set next step to Discovery'];
            pack.automation_payload = {
                record_id: record.id,
                action_type: 'ADD_NEXT_STEP'
            };
            break;

        default:
            pack.title = 'General Data Fix';
            pack.steps = ['Review record manually.', 'Update missing fields.'];
            pack.verification_check = 'Manual review.';
            pack.slack_message = `🚨 SLA BREACH: ${record.name} from ${record.company} is untouched!`;
            pack.automation_payload = {
                flow_name: `Auto-Fix: ${pack.title}`,
                record_id: record.id,
                action_type: 'SLA_BREACH_FIX',
                nodes: [
                    { type: 'trigger', event: 'on_fix_click' },
                ]
            };
            break;
    }

    // Standard Automation Payload (n8n style)
    // This block is now largely superseded by case-specific automation_payloads.
    // If a case explicitly sets automation_payload, this will not overwrite it.
    // If a case does NOT set automation_payload, this will still apply.
    if (!pack.automation_payload.action_type) { // Check for the new action_type to determine if payload was set
        pack.automation_payload = {
            flow_name: `Auto-Fix: ${pack.title}`,
            nodes: [
                { type: 'trigger', event: 'on_fix_click' },
                { type: 'filter', condition: { issue_type: issue.issue_type } },
                { type: 'slack', channel: '#revenue-alerts', message: pack.slack_message || 'Fix triggered' },
                { type: 'crm', action: 'create_task', subject: pack.title },
                { type: 'email', draft: pack.email_draft || null }
            ]
        };
    }

    return pack;
}
