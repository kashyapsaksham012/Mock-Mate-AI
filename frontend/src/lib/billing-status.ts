export type BillingAccessStatus = 'active' | 'past_due' | 'canceled' | 'expired' | 'inactive';

export type BillingStatusResponse = {
  status: BillingAccessStatus;
  subscription?: {
    planName: string | null;
    periodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
};
