import { PaymentProvider, PaymentStatus } from './enums';

export interface Payment {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  transactionId?: string | null;
  providerReference?: string | null;
  amount: string | number;
  currency: string;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
}

export interface InitiatePaymentPayload {
  orderId: string;
  provider: PaymentProvider;
}

export interface PaymentInitiateResponse {
  paymentId: string;
  provider: PaymentProvider;
  paymentUrl: string | null;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  message?: string;
}
