import { OrderStatus, PaymentProvider, PaymentStatus } from './enums';

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

/**
 * État réel du paiement d'une commande, tel que connu par le serveur.
 * La redirection du navigateur (page de succès Bictorys) ne constitue PAS
 * une preuve : seul cet état fait foi.
 */
export interface CheckoutStatus {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paid: boolean;
  amount: number;
  currency: string;
  paidAt: string | null;
  payment: {
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt: string | null;
  } | null;
}

export interface VerifyPaymentResponse {
  confirmed: boolean;
  status: PaymentStatus;
  orderStatus: OrderStatus;
  reason?: string;
}
