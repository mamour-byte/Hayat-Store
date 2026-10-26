import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCheckoutStatus, useVerifyBictorysPayment } from '../api/useCheckout';

/**
 * Page de retour après paiement.
 *
 * Règle de sécurité : revenir sur cette page ne prouve RIEN. L'état affiché
 * vient toujours du serveur (base de données), qui ne marque une commande
 * comme payée qu'après vérification d'une transaction valide.
 */
export const CheckoutSuccess: React.FC = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const orderNumber = params.get('orderNumber');

  const { data: status, isError, refetch } = useCheckoutStatus(orderId, orderNumber);
  const { mutateAsync: verifyPayment, isPending: isVerifying } = useVerifyBictorysPayment();

  // Sans identifiant de commande : commande enregistrée (paiement à la livraison).
  const isCashOnDelivery = !orderId;

  const isPaid = !isCashOnDelivery && status?.paid === true;
  const isFailed =
    !isCashOnDelivery &&
    (status?.paymentStatus === 'FAILED' ||
      status?.paymentStatus === 'EXPIRED' ||
      status?.paymentStatus === 'CANCELLED');
  const isPending =
    !isCashOnDelivery && !isPaid && !isFailed && !isError;

  const handleVerify = async () => {
    if (!orderId) return;
    try {
      const result = await verifyPayment(orderId);
      if (result.confirmed) {
        toast.success('Paiement confirmé.');
      } else {
        toast.info(result.reason || 'Le paiement est encore en cours de vérification.');
      }
    } catch {
      toast.error('Vérification du paiement impossible pour le moment.');
    }
  };

  const title = isCashOnDelivery
    ? 'Commande confirmée !'
    : isPaid
    ? 'Paiement confirmé !'
    : isFailed
    ? 'Paiement non abouti'
    : 'Vérification du paiement…';

  const subtitle = isCashOnDelivery
    ? 'Merci pour votre commande. Vous recevrez une confirmation par email.'
    : isPaid
    ? 'Merci pour votre commande. Vous recevrez une confirmation par email.'
    : isFailed
    ? 'Le paiement n’a pas abouti. Vous pouvez réessayer depuis votre commande.'
    : isError
    ? 'Impossible de récupérer le statut du paiement pour le moment.'
    : 'Nous confirmons votre paiement auprès de notre prestataire. Cette page ne vaut pas preuve de paiement : seule la confirmation serveur compte.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f6f7] px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl ${
            isCashOnDelivery || isPaid
              ? 'bg-[#008060] shadow-[#008060]/30'
              : isFailed
              ? 'bg-red-500 shadow-red-500/30'
              : 'bg-amber-500 shadow-amber-500/30'
          } ${isPending ? 'animate-pulse' : ''}`}
        >
          {isCashOnDelivery || isPaid ? (
            <CheckCircle2 className="w-14 h-14 text-white" />
          ) : isFailed ? (
            <XCircle className="w-14 h-14 text-white" />
          ) : (
            <Clock className="w-14 h-14 text-white" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">{title}</h1>
          <p className="text-[#6d7175]">{subtitle}</p>
        </div>

        {(orderNumber || status?.orderNumber) && (
          <div className="bg-white rounded-2xl border border-[#e1e3e5] px-6 py-4 inline-block">
            <p className="text-xs text-[#6d7175]">Numéro de commande</p>
            <p className="font-mono font-bold text-[#1a1a1a] text-lg mt-1">
              {status?.orderNumber || orderNumber}
            </p>
          </div>
        )}

        {!isCashOnDelivery && (isPending || isError) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex items-center justify-center gap-2 bg-[#008060] hover:bg-[#006e52] disabled:opacity-60 text-white font-medium py-3 px-6 rounded-2xl transition-colors shadow-md shadow-[#008060]/20"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Vérification…' : 'Vérifier le paiement'}
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center justify-center gap-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-[#f6f6f7] font-medium py-3 px-6 rounded-2xl transition-colors"
            >
              Actualiser
            </button>
          </div>
        )}

        {isFailed && (
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center gap-2 bg-[#008060] hover:bg-[#006e52] text-white font-medium py-3 px-6 rounded-2xl transition-colors shadow-md shadow-[#008060]/20"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer le paiement
          </Link>
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
