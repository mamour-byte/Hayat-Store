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
