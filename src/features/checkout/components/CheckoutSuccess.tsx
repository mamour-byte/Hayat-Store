import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Package } from 'lucide-react';

export const CheckoutSuccess: React.FC = () => {
  const [params] = useSearchParams();
  const orderNumber = params.get('orderNumber');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f6f7] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-[#008060] rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-[#008060]/30 animate-bounce">
          <CheckCircle2 className="w-14 h-14 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">
            Commande confirmée !
          </h1>
          <p className="text-[#6d7175]">
            Merci pour votre commande. Vous recevrez une confirmation par email.
          </p>
        </div>

        {orderNumber && (
          <div className="bg-white rounded-2xl border border-[#e1e3e5] px-6 py-4 inline-block">
            <p className="text-xs text-[#6d7175]">Numéro de commande</p>
            <p className="font-mono font-bold text-[#1a1a1a] text-lg mt-1">
              {orderNumber}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/account/orders"
            className="flex items-center justify-center gap-2 bg-[#008060] hover:bg-[#006e52] text-white font-medium py-3 px-6 rounded-2xl transition-colors shadow-md shadow-[#008060]/20"
          >
            <Package className="w-4 h-4" />
            Mes commandes
          </Link>
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-medium py-3 px-6 rounded-2xl transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
};
