
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Package, Search } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';

export const NotFoundPage: React.FC = () => {
  useSeo({
    title: 'Page introuvable - Hayat Store',
    description:
      "Cette page semble s'être perdue. Retrouvez tous vos produits sur Hayat Store.",
    noindex: true,
  });

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4 py-12 sm:py-16 bg-white">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-12">

        {/* Illustration */}
        <div className="w-full flex justify-center">
          <img
            src="/assets/hayat-404.png"
            alt="Personnage Hayat Store surpris de ne pas retrouver la page"
            className="w-full max-w-xl h-auto object-contain"
          />
        </div>

        {/* Message d'erreur */}
        <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">

          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#008060]/10 text-[#008060] text-sm font-semibold mb-6">
            <Search className="w-4 h-4" />
            Erreur 404
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1a1a1a] leading-tight">
            Oups ! Cette page
            <span className="block text-[#008060] mt-1">
              s'est perdue.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#6d7175] leading-relaxed">
            Il semblerait que la page que vous recherchez
            n'existe pas, ait été déplacée ou que son adresse
            soit incorrecte.
          </p>

          <p className="mt-3 text-sm text-[#6d7175]">
            Pas de panique ! Votre prochaine trouvaille
            vous attend peut-être dans notre boutique.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2
              bg-[#008060] hover:bg-[#006e52] text-white
              font-semibold px-6 py-3.5 rounded-xl
              transition-all duration-200 hover:shadow-lg
              hover:-translate-y-0.5"
            >
              <Home className="w-5 h-5" />
              Retour à l'accueil
            </Link>

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2
              border border-[#e1e3e5] bg-white
              hover:border-[#008060] hover:bg-[#008060]/5
              text-[#1a1a1a] font-semibold px-6 py-3.5
              rounded-xl transition-all duration-200"
            >
              <Package className="w-5 h-5" />
              Voir le catalogue
            </Link>
          </div>

          {/* Retour précédent */}
          {/* <button
            onClick={handleGoBack}
            className="mt-8 inline-flex items-center gap-2
            text-sm font-medium text-[#6d7175]
            hover:text-[#008060] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Revenir à la page précédente
          </button> */}

          
        </div>
      </div>
    </main>
  );
};
