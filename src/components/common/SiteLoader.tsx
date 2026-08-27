import React, { useEffect, useState } from 'react';
import { Lottie } from 'lottie-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useCart } from '../../app/providers/CartProvider';
import './SiteLoader.css';

type LottieAnimation = Record<string, unknown>;

export const SiteLoader: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const { isLoading: isCartLoading } = useCart();
  const [animationData, setAnimationData] = useState<LottieAnimation | null>(null);
  const [hasAnimationError, setHasAnimationError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch('/assets/shooping.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Impossible de charger l’animation de chargement');
        }
        return response.json() as Promise<LottieAnimation>;
      })
      .then((data) => {
        if (isMounted) {
          setAnimationData(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasAnimationError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (hasAnimationError || (!isAuthLoading && !isCartLoading) || !animationData) {
    return null;
  }

  return (
    <div className="site-loader" role="status" aria-label="Chargement">
      <Lottie src={animationData} loop autoplay className="site-loader__animation" />
    </div>
  );
};
