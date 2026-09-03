import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Package, Tag, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useProductBySlug } from '../api/useProducts';
import { VariantSelector } from './VariantSelector';
import { ReviewList } from '../../reviews/components/ReviewList';
import { ReviewForm } from '../../reviews/components/ReviewForm';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { formatPrice } from '../../../lib/utils/currency';
import { useCart } from '../../../app/providers/cart-context';
import { useAuth } from '../../../app/providers/auth-context';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProductBySlug(slug ?? '');
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [selectedVariantId, setSelectedVariantId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <Package className="w-16 h-16 text-[#1a1a1a]" />
        <h2 className="text-xl font-semibold text-[#1a1a1a]">
          Produit introuvable
        </h2>
        <button onClick={() => history.back()} className="flex items-center gap-2 text-emerald-600 hover:underline cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
      </div>
    );
  }

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = selectedVariant?.price ?? product.price;

  const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;
  const tracksInventory = (
    selectedVariant?.trackInventory ??
    product.trackInventory ??
    (hasVariants ? product.variants!.some((v) => v.trackInventory !== false) : true)
  ) !== false;

  // Stock is always tracked at the variant level when the product has variants.
  // The base product.quantity is only meaningful for simple (non-variant) products.
  const currentStock = selectedVariant
    ? Number(selectedVariant.quantity) || 0
    : hasVariants
      ? product.variants!.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0)
      : Number(product.quantity) || 0;

  const handleAddToCart = async () => {
    if (product.hasVariants && !selectedVariantId) {
      toast.error('Veuillez sélectionner une variante');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem({ productId: product.id, variantId: selectedVariantId, quantity });
      toast.success(`"${product.name}" ajouté au panier !`);
    } catch {
      // handled by interceptor
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="space-y-3 lg:max-w-[520px] lg:justify-self-center">
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#f6f6f7]">
            {product.images?.[activeImage] ? (
              <img
                src={product.images[activeImage].url}
                alt={product.images[activeImage].alt ?? product.name}
                loading="lazy"
                decoding="async"
                width={520}
                height={520}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#f6f6f7]">
                <Package className="w-20 h-20 text-[#008060]/30" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    i === activeImage
                      ? 'border-emerald-500'
                      : 'border-[#e1e3e5] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" loading="lazy" decoding="async" width={64} height={64} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {/* {product.category && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 ">
              {product.category.name}
            </Badge>
          )} */}
          <h1 className="text-3xl font-bold text-[#1a1a1a]">{product.name}</h1>

          {product.brand && (
            <div className="flex items-center gap-2 text-sm text-[#6d7175]">
              <Tag className="w-4 h-4" />
              {product.brand.name}
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-[#008060]">
              {formatPrice(currentPrice)}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-[#6d7175] line-through mb-0.5">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Stock */}
          {tracksInventory ? (
            hasVariants && !selectedVariant ? (
              <div className="flex items-center gap-2 text-sm font-medium text-[#6d7175]">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Sélectionnez une variante pour voir le stock
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-sm font-medium ${currentStock > 0 ? 'text-[#008060]' : 'text-rose-500'}`}>
                <span className={`w-2 h-2 rounded-full ${currentStock > 0 ? 'bg-[#008060]' : 'bg-rose-500'}`} />
                {currentStock > 0 ? `${currentStock} en stock` : 'Rupture de stock'}
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-[#6d7175]">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Disponible (stock non suivi)
            </div>
          )}

          {product.description && (
            <p className="text-[#6d7175] leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Variants */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#1a1a1a]">Quantité</span>
            <div className="flex items-center border border-[#e1e3e5] rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 hover:bg-[#f6f6f7] transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold text-[#1a1a1a]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => (tracksInventory ? Math.min(currentStock, q + 1) : q + 1))}
                className="p-2.5 hover:bg-[#f6f6f7] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full"
            leftIcon={<ShoppingCart className="w-5 h-5" />}
            isLoading={addingToCart}
            disabled={
              (tracksInventory && currentStock === 0) ||
              (tracksInventory && hasVariants && !selectedVariant)
            }
            onClick={handleAddToCart}
          >
            {tracksInventory && currentStock === 0
              ? 'Rupture de stock'
              : tracksInventory && hasVariants && !selectedVariant
              ? 'Sélectionnez une variante'
              : 'Ajouter au panier'}
          </Button>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Avis clients</h2>
        <ReviewList productId={product.id} />
        {isAuthenticated && <ReviewForm productId={product.id} />}
      </div>
    </div>
  );
};
