import React from 'react';
import { Package } from 'lucide-react';
import { OrderList } from '../components/OrderList';

export const MyOrdersPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
        <Package className="w-6 h-6 text-[#008060]" />
        Mes Commandes
      </h1>
      <OrderList />
    </div>
  );
};
