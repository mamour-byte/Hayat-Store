import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Truck, User, MapPin, CreditCard, ShoppingBag, Store } from 'lucide-react';
import { useCreateOrder, useInitiatePayment, useNeighborhoods } from '../api/useCheckout';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CouponInput } from './CouponInput';
import { NeighborhoodCombobox } from './NeighborhoodCombobox';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils/currency';
import { useCart } from '../../../app/providers/CartProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { ValidateCouponResponse } from '../../../types';
import { PaymentProvider } from '../../../types/enums';
import type { DeliveryMethod, DeliveryNeighborhood } from '../../../types';

const schema = z.object({
  customerEmail: z.string().email('Email invalide'),
  customerPhone: z.string().min(8, 'Téléphone requis'),
  shippingFirstName: z.string().min(2, 'Prénom requis'),
  shippingLastName: z.string().min(2, 'Nom requis'),
  shippingAddress: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const CheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { data: neighborhoods, isLoading: isLoadingNeighborhoods } = useNeighborhoods();
  const { mutateAsync: createOrder, isPending: isCreating } = useCreateOrder();
  const { mutateAsync: initiatePayment, isPending: isPaying } = useInitiatePayment();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('DELIVERY');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<DeliveryNeighborhood | undefined>();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(PaymentProvider.CASH_ON_DELIVERY);
  const [couponResult, setCouponResult] = useState<ValidateCouponResponse | null>(null);
  const [neighborhoodError, setNeighborhoodError] = useState<string | null>(null);

  // Determine active zone and shipping cost
  const activeZone = selectedNeighborhood?.deliveryZone ?? (
    selectedNeighborhoodId ? neighborhoods?.find((n) => n.id === selectedNeighborhoodId)?.deliveryZone : undefined
  );
  
  const shippingCost = deliveryMethod === 'DELIVERY' && activeZone
    ? parseFloat(String(activeZone.price))
    : 0;

  const discount = couponResult?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + shippingCost - discount);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerEmail: user?.email ?? '',
      customerPhone: user?.phone ?? '',
      shippingFirstName: user?.firstName ?? '',
      shippingLastName: user?.lastName ?? '',
    },
  });

  const handleNeighborhoodSelect = (neighborhood: DeliveryNeighborhood | undefined) => {
    setSelectedNeighborhood(neighborhood);
    setSelectedNeighborhoodId(neighborhood?.id);
    setNeighborhoodError(null);
  };

  const onSubmit = async (formData: FormValues) => {
    if (!cart) {
      toast.error('Panier vide');
      return;
    }

    const isDelivery = deliveryMethod === 'DELIVERY';

    if (isDelivery) {
      if (!selectedNeighborhoodId) {
        setNeighborhoodError('Veuillez sélectionner un quartier de livraison');
        toast.error('Veuillez choisir un quartier de livraison');
        return;
      }
      if (!formData.shippingAddress || formData.shippingAddress.trim() === '') {
        toast.error('Veuillez renseigner votre adresse de livraison exacte');
        return;
      }
    }

    try {
      const order = await createOrder({
        cartId: cart.id,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingFirstName: formData.shippingFirstName,
        shippingLastName: formData.shippingLastName,
        fulfillmentType: deliveryMethod,
        deliveryMethod,
        shippingAddress: isDelivery ? formData.shippingAddress : undefined,
        shippingCity: isDelivery ? (selectedNeighborhood?.name || 'Dakar') : undefined,
        deliveryNeighborhoodId: isDelivery ? selectedNeighborhoodId : undefined,
        deliveryZoneId: isDelivery ? (selectedNeighborhood?.deliveryZoneId || activeZone?.id) : undefined,
        shippingZoneId: isDelivery ? (selectedNeighborhood?.deliveryZoneId || activeZone?.id) : undefined,
        couponCode: couponResult?.coupon?.code,
      });

      const payment = await initiatePayment({ orderId: order.id, provider: selectedProvider });

      // Vider le panier après validation réussie de la commande
      try {
        await clearCart();
      } catch {
        // Silently ignore cart clearing errors
      }

      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      } else {
        navigate(`/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la création de la commande';
      toast.error(msg);
    }
  };

  const isLoading = isCreating || isPaying;

  return (
    <div className="min-h-screen bg-[#f6f6f7] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-8">Finaliser la commande</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-4 shadow-sm">
                <h2 className="font-bold text-[#1a1a1a] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#008060]" /> Informations client
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Prénom" error={errors.shippingFirstName?.message} {...register('shippingFirstName')} />
                  <Input label="Nom" error={errors.shippingLastName?.message} {...register('shippingLastName')} />
                </div>
                <Input label="Email" type="email" error={errors.customerEmail?.message} {...register('customerEmail')} />
                <Input label="Téléphone" type="tel" placeholder="+221 77 000 00 00" error={errors.customerPhone?.message} {...register('customerPhone')} />
              </div>

              {/* Fulfillment method */}
              <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-4 shadow-sm">
                <h2 className="font-bold text-[#1a1a1a] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#008060]" /> Réception de la commande
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { value: 'DELIVERY' as const, label: 'Livraison à domicile', icon: Truck },
                    { value: 'PICKUP' as const, label: 'Retrait en magasin', icon: Store },
                  ]).map(({ value, label, icon: Icon }) => (
                    <label key={value} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryMethod === value ? 'border-[#008060] bg-[#f0f9f6]' : 'border-[#e1e3e5] hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === value}
                        onChange={() => {
                          setDeliveryMethod(value);
                          setNeighborhoodError(null);
                        }}
                      />
                      <Icon className="w-5 h-5 text-[#008060]" />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {deliveryMethod === 'DELIVERY' && (
                <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-[#1a1a1a] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#008060]" /> Destination & Adresse de livraison
                    </h2>
                  </div>

                  {/* Searchable Neighborhood Combobox */}
                  <NeighborhoodCombobox
                    neighborhoods={neighborhoods || []}
                    selectedNeighborhoodId={selectedNeighborhoodId}
                    onSelect={handleNeighborhoodSelect}
                    isLoading={isLoadingNeighborhoods}
                    error={neighborhoodError || undefined}
                  />

                  <Input
                    label="Adresse précise"
                    placeholder="Rue, numéro de villa, immeuble, étage, repère..."
                    error={errors.shippingAddress?.message}
                    {...register('shippingAddress')}
                  />
                </div>
              )}

              {/* Payment */}
              <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-4 shadow-sm">
                <h2 className="font-bold text-[#1a1a1a] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#008060]" /> Mode de paiement
                </h2>
                <PaymentMethodSelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />
              </div>
            </div>

            {/* Right: Summary */}
            <div className="space-y-4">
              <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-4 sticky top-24 shadow-sm">
                <h2 className="font-bold text-[#1a1a1a] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#008060]" /> Votre commande
                </h2>

                {cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#1a1a1a] line-clamp-1 flex-1 mr-2">
                      {item.product?.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-[#1a1a1a] whitespace-nowrap">
                      {formatPrice(parseFloat(String(item.unitPrice)) * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="pt-3 border-t border-[#e1e3e5] space-y-2 text-sm">
                  <div className="flex justify-between text-[#1a1a1a]">
                    <span>Sous-total</span><span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#1a1a1a]">
                    <div className="flex flex-col">
                      <span>Livraison</span>
                      {deliveryMethod === 'DELIVERY' && selectedNeighborhood && (
                        <span className="text-[11px] text-[#6d7175]">
                          {selectedNeighborhood.name} {activeZone ? `(${activeZone.name})` : ''}
                        </span>
                      )}
                      {deliveryMethod === 'PICKUP' && (
                        <span className="text-[11px] text-[#6d7175]">Retrait en magasin</span>
                      )}
                    </div>
                    <span className="font-semibold text-[#008060]">
                      {shippingCost === 0 ? 'Gratuit' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Réduction</span><span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-bold text-[#1a1a1a] pt-3 border-t border-[#e1e3e5]">
                  <span>Total</span><span className="text-lg text-[#008060]">{formatPrice(total)}</span>
                </div>

                {/* Coupon */}
                <CouponInput subtotal={subtotal} shippingAmount={shippingCost} onValidated={setCouponResult} />

                <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                  Confirmer la commande
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

