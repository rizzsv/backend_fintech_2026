export interface VelocityContext {
    userId: string;

    transactionType: 
    | "TRANSFER"
    | "WITHDRAWAL"
    | "TOPUP"

    amount: number;
    ipAddress?: string;
    deviceId?: string;
}

export interface VelocityResult {
    allowed: boolean;

    riskScore: number;

    reasons: string[];

    metrics: {
        transactionCount1m: number;
        transactionCount1h: number;
        amount1h: number;
        amount24h: number;
    }
}

export interface AnomalyContext {
    amount: number;
    averageAmount: number;
    transactionCount24h: number;
    averageTransactionCount24h: number;
}

export interface AnomalyResult {
    detected: boolean;
    riskScore: number;
    reasons: string[];
}

export interface RiskScoringContext {
    velocity: RiskScoringBaseSignal;
    anomaly: RiskScoringBaseSignal;
    geolocation?: RiskScoringSignal;
    device?: RiskScoringSignal;
    suspiciousActivity?: RiskScoringSignal;
}

export interface RiskScoringBaseSignal {
    score?: number;
    riskScore?: number;
    reasons: string[];
}

export interface RiskScoringSignal {
    score: number;
    reasons: string[];
}

export interface RiskScoringResult {
    score: number;
    level: FraudRiskLevel;
    reasons: string[];
}

export type FraudRiskLevel =
| "LOW"
| "MEDIUM"
| "HIGH"
| "CRITICAL"

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export interface GeolocationContext {
    currentLocation: GeoPoint;
    previousLocation?: GeoPoint;
    previousLocations?: GeoPoint[];
    trustedLocations?: GeoPoint[];
    previousTransactionAt?: Date;
}

export interface GeolocationResult {
    suspicious: boolean;
    riskScore: number;
    reasons: string[];
    distanceFromPreviousKm?: number;
    distanceFromTrustedKm?: number;
    travelSpeedKmh?: number;
}

export interface DeviceFingerprintContext {
    userId: string;
    deviceId: string;
    fingerprint: string;
    ipAddress?: string;
    userAgent?: string;
    isKnownDevice: boolean;
    deviceTransactionCount24h: number;
    userDeviceCount: number;
}

export interface DeviceFingerprintResult {
    suspicious: boolean;
    riskScore: number;
    reasons: string[];
}

export interface SuspiciousActivityContext {
    userId: string;
    transactionCount1m: number;
    transactionCount1h: number;
    failedTransactionCount1h: number;
    currentAmount: number;
    averageTransactionAmount24h: number;
    lastActivityAt?: Date;
    currentActivityAt: Date;
}

export interface suspiciousActivityResult {
    suspicious: boolean;
    riskScore: number;
    reasons: string[];
}

