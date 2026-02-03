import { v4 as uuidv4 } from 'uuid';

export interface AuditEvent {
    id: string;
    timestamp: string;
    action: string;
    details: string;
    user: string;
    entityId?: string;
}

// In-memory store for hackathon purposes. 
// In prod, this would be a DB table.
let AUDIT_LOG: AuditEvent[] = [];

export function logAuditEvent(action: string, details: string, entityId?: string) {
    const event: AuditEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        action,
        details,
        user: 'Antigravity (Demo User)',
        entityId
    };
    AUDIT_LOG.unshift(event);
    // Keep only last 50
    if (AUDIT_LOG.length > 50) AUDIT_LOG = AUDIT_LOG.slice(0, 50);
}

export function getAuditLog(): AuditEvent[] {
    return AUDIT_LOG;
}

export function clearAuditLog() {
    AUDIT_LOG = [];
}
