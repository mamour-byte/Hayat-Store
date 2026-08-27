import React from 'react';
import { Smartphone, Wallet, Banknote, Lock } from 'lucide-react';
import { PaymentProvider } from '../../../types/enums';

interface PaymentMethodSelectorProps {
  selectedProvider?: PaymentProvider;
  onSelect: (provider: PaymentProvider) => void;
}

const METHODS = [
  {
    provider: PaymentProvider.WAVE,
    label: 'Wave',
    description: 'Bientôt disponible',
    icon: "./assets/wave.jpeg",
    color: 'from-blue-400 to-blue-500',
    disabled: true,
  },
  {
    provider: PaymentProvider.ORANGE_MONEY,
    label: 'Orange Money',
    description: 'Bientôt disponible',
    icon: "./assets/om.png",
    color: 'from-orange-400 to-orange-500',
    disabled: true,
  },
  {
    provider: PaymentProvider.CASH_ON_DELIVERY,
    label: 'Paiement à la livraison',
    description: 'Payez en cash à la réception',
    icon: <Banknote className="w-6 h-6" />,
    color: 'from-[#008060] to-[#006e52]',
    disabled: false,
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedProvider,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      {METHODS.map((method) => {
        const isSelected = selectedProvider === method.provider;
        const isDisabled = method.disabled;
        return (
          <button
            key={method.provider}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(method.provider)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left relative ${
              isDisabled
                ? 'border-[#e1e3e5] bg-[#f6f6f7] cursor-not-allowed opacity-60'
                : isSelected
                ? 'border-[#008060] bg-[#f0f9f6] shadow-md shadow-[#008060]/10 cursor-pointer'
                : 'border-[#e1e3e5] bg-white hover:border-[#008060]/40 cursor-pointer'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm ${isDisabled ? 'opacity-50 grayscale' : ''}`}
            >
              {method.icon}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${isDisabled ? 'text-[#6d7175]' : 'text-[#1a1a1a]'}`}>
                {method.label}
              </p>
              <p className="text-xs text-[#6d7175]">{method.description}</p>
            </div>
            {isDisabled ? (
              <div className="flex items-center gap-1 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
            ) : (
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'border-[#008060] bg-[#008060]' : 'border-[#c9cccf]'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
