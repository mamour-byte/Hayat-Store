import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from './orders.service';

interface MyOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const useMyOrders = (params?: MyOrdersParams) => {
  return useQuery({
    queryKey: ['my-orders', params],
    queryFn: () => ordersService.getMyOrders(params),
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => ordersService.cancelMyOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
};

