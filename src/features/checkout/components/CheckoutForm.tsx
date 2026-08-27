import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Truck, User, MapPin, CreditCard, ShoppingBag, Store } from 'lucide-react';
import { useCreateOrder, useInitiatePayment, useShippingZones } from '../api/useCheckout';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CouponInput } from './CouponInput';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils/currency';
import { useCart } from '../../../app/providers/CartProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { ValidateCouponResponse } from '../../../types';
import { PaymentProvider } from '../../../types/enums';
import type { DeliveryMethod } from '../../../types';

const schema = z.object({
  customerEmail: z.email('Email invalide'),
  customerPhone: z.string().min(8, 'Téléphone requis'),
  shippingFirstName: z.string().min(2, 'Prénom requis'),
  shippingLastName: z.string().min(2, 'Nom requis'),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const CheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { data: shippingZones, isLoading: isLoadingZones } = useShippingZones();
  const { mutateAsync: createOrder, isPending: isCreating } = useCreateOrder();
  const { mutateAsync: initiatePayment, isPending: isPaying } = useInitiatePayment();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('DELIVERY');
  const [selectedShippingZoneId, setSelectedShippingZoneId] = useState<string>();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(PaymentProvider.CASH_ON_DELIVERY);
  const [couponResult, setCouponResult] = useState<ValidateCouponResponse | null>(null);

  const selectedShippingZone = shippingZones?.find((zone) => zone.id === selectedShippingZoneId);
  const shippingCost = deliveryMethod === 'DELIVERY' && selectedShippingZone
    ? parseFloat(String(selectedShippingZone.price))
    : 0;
  const discount = couponResult?.discountAmount ?? 0;
  const total = subtotal + shippingCost - discount;

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

  const onSubmit = async (formData: FormValues) => {
    if (!cart) { toast.error('Panier vide'); return; }
    if (deliveryMethod === 'DELIVERY' && (!selectedShippingZoneId || !formData.shippingAddress || !formData.shippingCity)) {
      toast.error('Sélectionnez une zone et renseignez votre adresse de livraison');
      return;
    }

    const order = await createOrder({
      cartId: cart.id,
      ...formData,
      deliveryMethod,
      shippingZoneId: deliveryMethod === 'DELIVERY' ? selectedShippingZoneId : undefined,
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
                    <label key={value} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${deliveryMethod === value ? 'border-[#008060] bg-[#f0f9f6]' : 'border-[#e1e3e5]'}`}>
                      <input type="radio" name="deliveryMethod" checked={deliveryMethod === value} onChange={() => setDeliveryMethod(value)} />
                      <Icon className="w-5 h-5 text-[#008060]" />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {deliveryMethod === 'DELIVERY' && (
                <div className="bg-white border border-[#e1e3e5] rounded-2xl p-6 space-y-4 shadow-sm">
                  <h2 className="font-bold text-[#1a1a1a] flex items-center gap-2"><MapPin className="w-4 h-4 text-[#008060]" /> Zone de livraison</h2>
                  <select value={selectedShippingZoneId ?? ''} onChange={(event) => setSelectedShippingZoneId(event.target.value || undefined)} className="w-full rounded-lg border border-[#e1e3e5] bg-white px-3 py-2.5 text-sm">
                    <option value="">{isLoadingZones ? 'Chargement des zones...' : 'Choisir une zone'}</option>
                    {shippingZones?.filter((zone) => zone.isActive !== false).map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {formatPrice(zone.price)}</option>)}
                  </select>
                  <Input label="Adresse" placeholder="Rue, Quartier, Villa..." error={errors.shippingAddress?.message} {...register('shippingAddress')} />
                  <Input label="Ville" placeholder="Dakar" error={errors.shippingCity?.message} {...register('shippingCity')} />
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
                    <span>Livraison</span><span>{formatPrice(shippingCost)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Réduction</span><span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-bold text-[#1a1a1a] pt-3 border-t border-[#e1e3e5]">
                  <span>Total</span><span>{formatPrice(total)}</span>
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
