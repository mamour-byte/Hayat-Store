import React, { useEffect, useState } from 'react';
import { Lottie } from 'lottie-react';

type LottieAnimation = Record<string, unknown>;

interface LottieLoaderProps {
  size?: number;
  className?: string;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({ size = 192, className = '' }) => {
  const [animationData, setAnimationData] = useState<LottieAnimation | null>(null);

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
          setAnimationData(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!animationData) {
    return null;
  }

  return (
    <div role="status" aria-label="Chargement" className={className}>
      <Lottie
        src={animationData}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
};
