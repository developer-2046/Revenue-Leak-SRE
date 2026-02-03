import { FunnelRecord, IssueSeverity, LeakIssue } from './types';
import { CONFIG } from './config';
import { differenceInDays } from 'date-fns';

const STAGE_PROBS = CONFIG.WIN_PROBABILITY as Record<string, number>;
const HALFLIFE = CONFIG.DECAY_HALFLIFE_DAYS;
const K = Math.log(2) / HALFLIFE; // Decay constant

function decayFactor(daysInactive: number): number {
    if (daysInactive <= 0) return 1.0;
    return Math.exp(-K * daysInactive);
}

export function calculateImpact(record: FunnelRecord, issueType: string): number {
    const value = record.value_usd || 0;
    const now = new Date();
    const lastTouch = record.last_touch_at ? new Date(record.last_touch_at) : new Date(record.created_at);
    const daysInactive = differenceInDays(now, lastTouch);

    switch (issueType) {
        case 'STALE_OPP': {
            const baseProb = STAGE_PROBS[record.stage || 'New'] || 0.1;
            const currentProb = baseProb * decayFactor(daysInactive);
            // Loss is the probability delta * value
            return Math.round(value * (baseProb - currentProb));
        }

        case 'SLA_BREACH_UNTOUCHED':
            // High probability of loss if not touched immediately.
            // Assume 50% chance of losing the lead entirely if breached.
            return Math.round(value * 0.5);

        case 'UNASSIGNED_OWNER':
            // Unassigned leads/opps have 0 velocity.
            // Assume 100% at risk if it remains unassigned.
            return value;

        case 'DUPLICATE_SUSPECT':
            // The "loss" isn't the whole value, but the operational waste + confusion risk.
            // Or, we count it as "at risk" because we might lose the deal due to double-calling.
            // Let's take 20% of value as incident risk.
            return Math.round(value * 0.2);

        case 'NO_NEXT_STEP':
            // Similar to stale, but purely process risk.
            // Flat 25% risk.
            return Math.round(value * 0.25);

        default:
            return 0;
    }
}
