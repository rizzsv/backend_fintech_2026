export enum ReverificationTrigger {
    RISK_SCORE_INCREASED = 'RISK_SCORE_INCREASED',
    DEVICE_CHANGED = 'DEVICE_CHANGED',
    GEOLOCATION_ANOMALY = 'GEOLOCATION_ANOMALY',
    SANCTION_MATCH = 'SANCTION_MATCH',
    DOCUMENT_EXPIRED = 'DOCUMENT_EXPIRED',
    PROFILE_CHANGED = 'PROFILE_CHANGED',
}

export interface ReverificationTriggerInput {
    kycId: string;
    userId: string;
    trigger: ReverificationTrigger;
    reason?: string;
    metadata?: Record<string, unknown>;
}

export interface ReverificationTriggerResult {
    triggerId: string;
    kycId: string;
    userId: string;
    previousStatus: string;
    currentStatus: string;
    triggered: boolean;
    trigger?: ReverificationTrigger;
    reason?: string;
    triggeredAt: string;
}