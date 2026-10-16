export interface PaymentAccount {
  id: string;
  kind: 'bank' | 'momo';
  provider: string;
  account_name: string;
  account_number: string;
  branch: string;
  instructions: string;
  is_active: boolean;
  sort_order: number;
}

export type PaymentStatus = 'submitted' | 'confirmed' | 'rejected';

export interface OrderPayment {
  status: PaymentStatus;
  rejection_reason: string;
}

export interface PaymentSubmission {
  id: string;
  status: PaymentStatus;
  amount_expected: string;
  account: PaymentAccount;
  reference: string;
  sender_name: string;
  sender_number: string;
  screenshot_url: string | null;
  rejection_reason: string;
  reviewed_at: string | null;
  created_at: string;
  orders: string[];
}

export interface AdminPaymentSubmission extends PaymentSubmission {
  user_email: string;
  user_name: string;
  order_details: { id: string; total: string; status: string }[];
}
