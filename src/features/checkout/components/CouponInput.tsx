import React, { useState } from 'react';
import { Tag, CheckCircle2, XCircle } from 'lucide-react';
import { useValidateCoupon } from '../api/useCheckout';
import type { ValidateCouponResponse } from '../../../types';
import { formatPrice } from '../../../lib/utils/currency';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface CouponInputProps {
  subtotal: number;
  shippingAmount?: number;
  onValidated: (result: ValidateCouponResponse | null) => void;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  subtotal,
  shippingAmount = 0,
  onValidated,
}) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidateCouponResponse | null>(null);
  const { mutateAsync, isPending } = useValidateCoupon();

  const handleApply = async () => {
    if (!code.trim()) return;
    const res = await mutateAsync({ code: code.trim(), subtotal, shippingAmount });
    setResult(res);
    onValidated(res);
  };

  const handleRemove = () => {
    setCode('');
    setResult(null);
    onValidated(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Code promo"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          leftIcon={<Tag className="w-4 h-4" />}
          disabled={!!result}
        />
        {result ? (
          <Button variant="outline" onClick={handleRemove} className="flex-shrink-0">
            Retirer
          </Button>
        ) : (
          <Button onClick={handleApply} isLoading={isPending} className="flex-shrink-0">
            Appliquer
          </Button>
        )}
      </div>
      {result && result.isValid && (
        <div className="flex items-center gap-2 text-[#008060] text-sm font-medium bg-[#f0f9f6] rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Code valide — Réduction de {formatPrice(result.discountAmount)} appliquée
        </div>
      )}
      {result && !result.isValid && (
        <div className="flex items-center gap-2 text-rose-500 text-sm font-medium bg-rose-50 rounded-xl px-3 py-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          Code invalide ou expiré
        </div>
      )}
    </div>
  );
};
