export interface DashboardUserSection {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
}

export interface DashboardWalletSection {
    balance: string;
    currency: string;
    isFrozen: boolean;
    walletStatus: string;
}

export interface KycInfo {
    status: string;
    tier: string;
}

export interface AccountActions {
    canTopUp: boolean;
    canTransfer: boolean;
    canWithdraw: boolean;
}

export interface DashboardAccountOverview {
    isActive: boolean;
    isEmailVerified: boolean;
    kyc: KycInfo;
    actions: AccountActions;
}

export interface DashboardMonthlyStatistics {
    period: {
        type: string;
        startDate: string;
        endDate: string;
    };
    totalTopUp: string;
    totalTransfer: string;
    totalWithdrawal: string;
}

export interface CashFlowSeriesItem {
    date: string;
    income: string;
    expense: string;
    net: string;
}

export interface DashboardCashFlow {
    period: string;
    income: string;
    expense: string;
    net: string;
    currency: string;
    series: CashFlowSeriesItem[];
}

export interface LimitDetail {
    limit: string;
    used: string;
    remaining: string;
    percentageUsed: number;
}

export interface DashboardLimits {
    dailyTransfer: LimitDetail;
    monthlyTransfer: LimitDetail;
}

export interface RecentTransaction {
    id: string;
    type: string;
    description: string | null;
    amount: string;
    currency: string;
    direction: string;
    status: string;
    reference: string | null;
    createdAt: string;
}

export interface PendingActivity {
    id: string;
    type: string;
    description: string | null;
    amount: string;
    currency: string;
    status: string;
    createdAt: string;
}

export interface DashboardResponse {
    user: DashboardUserSection;
    wallet: DashboardWalletSection;
    accountOverview: DashboardAccountOverview;
    monthlyStatistics: DashboardMonthlyStatistics;
    cashFlow: DashboardCashFlow;
    limits: DashboardLimits;
    recentTransactions: RecentTransaction[];
    pendingActivities: PendingActivity[];
}
