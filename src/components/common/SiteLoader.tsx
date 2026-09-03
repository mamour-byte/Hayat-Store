import React, { useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/auth-context';
import { useCart } from '../../app/providers/cart-context';
import './SiteLoader.css';

type LottieAnimation = Record<string, unknown>;

type LottieComponent = React.ComponentType<{
  src: LottieAnimation;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}>;

export const SiteLoader: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const { isLoading: isCartLoading } = useCart();
  const [animationData, setAnimationData] = useState<LottieAnimation | null>(null);
  const [hasAnimationError, setHasAnimationError] = useState(false);
  const [LottieComp, setLottieComp] = useState<LottieComponent | null>(null);

  const isLoading = isAuthLoading || isCartLoading;

  useEffect(() => {
    let isMounted = true;

    fetch('/assets/shooping.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Impossible de charger l animation de chargement');
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

  useEffect(() => {
    if (!isLoading || !animationData || LottieComp) {
      return;
    }
    let cancelled = false;
    import('lottie-react').then((mod) => {
      if (!cancelled) {
        setLottieComp(() => mod.Lottie);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, animationData, LottieComp]);

  if (hasAnimationError || !isLoading || !animationData || !LottieComp) {
    return null;
  }

  return (
    <div className="site-loader" role="status" aria-label="Chargement">
      <LottieComp src={animationData} loop autoplay className="site-loader__animation" />
    </div>
  );
};
