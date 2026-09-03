import React from 'react';
import { useCategories, useProducts } from '../features/products/api/useProducts';
import { ProductGrid } from '../features/products/components/ProductGrid';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Slider from '../components/layout/Slider';
import type { SlideItem } from '../components/layout/Slider';

const sliderItems: SlideItem[] = [
  {
    id: 1,
    image: '../assets/img1.png',
    eyebrow: 'Hayat Store',
    title: 'Nouveautés',
    description: 'Découvrez notre sélection de produits d\'exception livrés chez vous.',
  },
  {
    id: 2,
    image: '../assets/macbook.png',
    eyebrow: 'Hayat Store',
    title: 'Promotions',
    description: 'Des offres exclusives sur une large gamme de produits garantis.',
  },
  {
    id: 3,
    image: '../assets/img2.png',
    eyebrow: 'Hayat Store',
    title: 'Promotions',
    description: 'Des offres exclusives sur une large gamme de produits garantis.',
  },
  {
    id: 4,
    image: '../assets/img3.png',
    eyebrow: 'Hayat Store',
    title: 'Livraison Express',
    description: 'Commandez maintenant et recevez votre colis sous 24h à 48h.',
  },
];

export const HomePage: React.FC = () => {
  const { data: categories } = useCategories();
  const { data: featuredProducts, isLoading } = useProducts({ limit: 8, status: 'ACTIVE' });
  const categoryList = Array.isArray(categories) ? categories : [];

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section Minimalist */}
      <Slider items={sliderItems} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[#e1e3e5] rounded-2xl p-8 sm:p-14 flex flex-col items-start gap-6 max-w-full">
          {/* <span className="text-xs font-semibold text-[#008060] uppercase tracking-wider bg-[#f0f9f6] px-3 py-1 rounded-full border border-[#008060]/20">
            Nouveautés Hayat Store
          </span> */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1a1a1a] max-w-2xl leading-tight">
            Des produits d'exception, livrés chez vous .
          </h1>
          <p className="text-base text-[#6d7175] max-w-xl leading-relaxed">
            Une sélection épurée et garantie. Commandez en quelques clics et payez en toute sécurité via Wave, Orange Money ou à la livraison.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#008060] hover:bg-[#006e52] text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Voir la Boutique
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#f6f6f7] text-[#1a1a1a] border border-[#e1e3e5] font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges Minimalist
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Truck, title: 'Livraison express', desc: 'Sous 24h à 48h sur tout Dakar' },
            { icon: ShieldCheck, title: 'Paiement garanti', desc: 'Wave, Orange Money ou cash à réception' },
            { icon: Headphones, title: 'Service client dédié', desc: 'Disponible par téléphone et WhatsApp' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 bg-white border border-[#e1e3e5] rounded-xl p-5">
              <div className="w-10 h-10 bg-[#f0f9f6] text-[#008060] rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a1a1a] text-sm">{title}</h3>
                <p className="text-xs text-[#6d7175] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section> */}

      {/* Categories Minimalist */}
      {categoryList.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1a1a1a]">Catégories</h2>
            <Link to="/products" className="text-sm text-[#008060] hover:underline font-medium flex items-center gap-1">
              Tout voir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categoryList.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?categoryId=${cat.id}`}
                className="group bg-white border border-[#e1e3e5] hover:border-[#008060] rounded-xl p-5 text-center transition-all duration-200"
              >
                <p className="font-semibold text-sm text-[#1a1a1a] group-hover:text-[#008060] transition-colors">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-xs text-[#6d7175] mt-1 line-clamp-1">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Produits Vedettes</h2>
          <Link to="/products" className="text-sm text-[#008060] hover:underline font-medium flex items-center gap-1">
            Tout le catalogue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <ProductGrid products={featuredProducts?.data} isLoading={isLoading} />
      </section>
    </div>
  );
};
