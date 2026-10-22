import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ValidateCouponPayload, CreateOrderPayload, InitiatePaymentPayload } from '../../../types';
import { checkoutService } from './checkout.service';
export const useShippingMethods = () => {
  return useQuery({
    queryKey: ['shipping-methods'],
    queryFn: checkoutService.getShippingMethods,
    staleTime: 10 * 60 * 1000,
  });
};

export const useShippingZones = () => {
  return useQuery({
    queryKey: ['shipping-zones'],
    queryFn: checkoutService.getShippingZones,
    staleTime: 10 * 60 * 1000,
  });
};

export const useNeighborhoods = () => {
  return useQuery({
    queryKey: ['shipping-neighborhoods'],
    queryFn: checkoutService.getNeighborhoods,
    staleTime: 10 * 60 * 1000,
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: (payload: ValidateCouponPayload) => checkoutService.validateCoupon(payload),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => checkoutService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
};

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: (payload: InitiatePaymentPayload) => checkoutService.initiatePayment(payload),
  });
};

/**
 * État réel du paiement, interrogé auprès du serveur.
 * Le client ne décide jamais seul : il affiche ce que le serveur confirme.
 */
export const useCheckoutStatus = (orderId?: string | null, orderNumber?: string | null) => {
  return useQuery({
    queryKey: ['checkout-status', orderId, orderNumber],
    queryFn: () => checkoutService.getCheckoutStatus(orderId as string, orderNumber ?? undefined),
    enabled: !!orderId,
    // On continue d'interroger le serveur tant que le paiement n'est pas définitif.
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus;
      return status === 'PAID' || status === 'FAILED' || status === 'CANCELLED' ? false : 4000;
    },
    retry: 2,
  });
};

/** Vérification serveur du paiement Bictorys (action manuelle). */
export const useVerifyBictorysPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => checkoutService.verifyBictorysPayment(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['checkout-status', orderId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
};
