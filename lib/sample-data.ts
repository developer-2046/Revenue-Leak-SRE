import { FunnelRecord } from './types';
import { v4 as uuidv4 } from 'uuid';
import { subMinutes, subDays, format } from 'date-fns';

export function generateSampleData(): FunnelRecord[] {
    const records: FunnelRecord[] = [];
    const now = new Date();

    // 1. SLA Breach Candidates (Leads > 30 mins old, untouched)
    records.push({
        id: uuidv4(),
        type: 'lead',
        name: 'John Doe',
        email: 'john@acme.com',
        domain: 'acme.com',
        company: 'Acme Corp',
        source: 'inbound',
        region: 'NA',
        owner: 'Alice',
        stage: 'New',
        created_at: subMinutes(now, 45).toISOString(), // Breach
        last_touch_at: null,
        next_step: null,
        value_usd: 1200,
        notes: 'Interesting inquiry'
    });

    // 2. Unassigned Owner
    records.push({
        id: uuidv4(),
        type: 'lead',
        name: 'Jane Smith',
        email: 'jane@start.up',
        domain: 'start.up',
        company: 'StartUp Inc',
        source: 'website',
        region: 'EMEA',
        owner: null, // Unassigned
        stage: 'New',
        created_at: subMinutes(now, 10).toISOString(),
        last_touch_at: null,
        next_step: null,
        value_usd: 1000,
        notes: 'Needs assignment'
    });

    // 3. Stale Opportunity (Older than 7 days untouched)
    records.push({
        id: uuidv4(),
        type: 'opp',
        name: 'Big Deal Q1',
        email: 'ceo@bigcorp.com',
        domain: 'bigcorp.com',
        company: 'BigCorp',
        source: 'outbound',
        region: 'NA',
        owner: 'Bob',
        stage: 'Proposal',
        created_at: subDays(now, 14).toISOString(),
        last_touch_at: subDays(now, 10).toISOString(), // Stale (> 7 days)
        next_step: 'Send contract',
        value_usd: 50000,
        notes: 'Radio silence'
    });

    // 4. Duplicate Suspect (Same domain as item 1)
    records.push({
        id: uuidv4(),
        type: 'lead',
        name: 'J. Doe',
        email: 'john.doe@acme.com',
        domain: 'acme.com', // Duplicate domain
        company: 'Acme',
        source: 'event',
        region: 'NA',
        owner: 'Alice',
        stage: 'New',
        created_at: subMinutes(now, 5).toISOString(),
        last_touch_at: null,
        next_step: null,
        value_usd: 1200,
        notes: 'Met at event'
    });

    // 5. No Next Step (Opp)
    records.push({
        id: uuidv4(),
        type: 'opp',
        name: 'Renewal 2026',
        email: 'procurement@client.com',
        domain: 'client.com',
        company: 'Client Co',
        source: 'upsell',
        region: 'APAC',
        owner: 'Charlie',
        stage: 'Negotiation',
        created_at: subDays(now, 2).toISOString(),
        last_touch_at: subHours(now, 2).toISOString(),
        next_step: null, // Missing
        value_usd: 15000,
        notes: ' Discussing terms'
    });

    // Fill more to reach ~50
    for (let i = 0; i < 45; i++) {
        records.push({
            id: uuidv4(),
            type: Math.random() > 0.7 ? 'opp' : 'lead',
            name: `Lead ${i}`,
            email: `lead${i}@example${i}.com`,
            domain: `example${i}.com`,
            company: `Example ${i} Ltd`,
            source: 'marketing',
            region: ['NA', 'EMEA', 'APAC'][Math.floor(Math.random() * 3)],
            owner: Math.random() > 0.1 ? 'Dave' : null,
            stage: 'New',
            created_at: subDays(now, Math.floor(Math.random() * 20)).toISOString(),
            last_touch_at: Math.random() > 0.5 ? subDays(now, Math.floor(Math.random() * 5)).toISOString() : null,
            next_step: Math.random() > 0.3 ? 'Call' : null,
            value_usd: 1000 + Math.floor(Math.random() * 10000),
            notes: null
        });
    }

    return records;
}

function subHours(date: Date, hours: number) {
    const d = new Date(date);
    d.setHours(d.getHours() - hours);
    return d;
}
