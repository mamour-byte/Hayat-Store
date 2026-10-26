import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { PaymentProvider } from '../../../types/enums';
import {
  useCheckoutStatus,
  useInitiatePayment,
  useVerifyBictorysPayment,
} from '../api/useCheckout';

/**
 * Page de retour après échec du paiement (redirection `errorRedirectUrl`).
 *
 * Comme pour la page de succès, l'affichage est piloté par le serveur :
 * un échec de redirection ne prouve pas un échec de paiement, et inversement.
 */
export const CheckoutFailed: React.FC = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const orderNumber = params.get('orderNumber');

  const { data: status } = useCheckoutStatus(orderId, orderNumber);
  const { mutateAsync: verifyPayment, isPending: isVerifying } = useVerifyBictorysPayment();
  const { mutateAsync: initiatePayment, isPending: isRetrying } = useInitiatePayment();

  const isPaid = status?.paid === true;
  const isFailed =
    status?.paymentStatus === 'FAILED' ||
    status?.paymentStatus === 'EXPIRED' ||
    status?.paymentStatus === 'CANCELLED';
  const isPending = !isPaid && !isFailed;

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

  const handleRetry = async () => {
    if (!orderId) return;
    try {
      const payment = await initiatePayment({
        orderId,
        provider: PaymentProvider.BICTORYS,
      });
      if (payment.paymentUrl) {
        window.location.assign(payment.paymentUrl);
      } else {
        toast.error('Impossible de relancer le paiement.');
      }
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string } } };
      toast.error(
        res?.response?.data?.message || 'Impossible de relancer le paiement.'
      );
    }
  };

  const title = isPaid
    ? 'Paiement confirmé !'
    : isFailed
    ? 'Paiement non abouti'
    : 'Vérification du paiement…';

  const subtitle = isPaid
    ? 'Le paiement a bien été enregistré. Votre commande est confirmée.'
    : isFailed
    ? 'Votre paiement n’a pas abouti. Aucun montant n’a été débité.'
    : 'Nous vérifions auprès de notre prestataire si le paiement a abouti. Cette page ne vaut pas preuve de paiement : seule la confirmation serveur compte.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f6f7] px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl ${
            isPaid
              ? 'bg-[#008060] shadow-[#008060]/30'
              : isFailed
              ? 'bg-red-500 shadow-red-500/30'
              : 'bg-amber-500 shadow-amber-500/30'
          } ${isPending ? 'animate-pulse' : ''}`}
        >
          {isPaid ? (
            <CheckCircle2 className="w-14 h-14 text-white" />
          ) : isFailed ? (
            <AlertTriangle className="w-14 h-14 text-white" />
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

        {isFailed && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center gap-2 bg-[#008060] hover:bg-[#006e52] disabled:opacity-60 text-white font-medium py-3 px-6 rounded-2xl transition-colors shadow-md shadow-[#008060]/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Redirection…' : 'Réessayer le paiement'}
          </button>
        )}

        {isPending && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="inline-flex items-center justify-center gap-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-white font-medium py-3 px-6 rounded-2xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Vérification…' : 'Vérifier le paiement'}
          </button>
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
            className="flex items-center justify-center gap-2 border border-[#e1e3e5] text-[#1a1a1a] hover:bg-white font-medium py-3 px-6 rounded-2xl transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
};
