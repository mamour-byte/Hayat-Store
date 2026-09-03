import React, { useEffect, useState } from 'react';

type LottieAnimation = Record<string, unknown>;

interface LottieLoaderProps {
  size?: number;
  className?: string;
}

type LottieComponent = React.ComponentType<{
  src: LottieAnimation;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
}>;

export const LottieLoader: React.FC<LottieLoaderProps> = ({ size = 192, className = '' }) => {
  const [animationData, setAnimationData] = useState<LottieAnimation | null>(null);
  const [LottieComp, setLottieComp] = useState<LottieComponent | null>(null);

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
          setAnimationData(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!animationData || LottieComp) {
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
  }, [animationData, LottieComp]);

  if (!animationData || !LottieComp) {
    return null;
  }

  return (
    <div role="status" aria-label="Chargement" className={className}>
      <LottieComp
        src={animationData}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </div>
  );
};
