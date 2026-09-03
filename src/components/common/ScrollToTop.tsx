import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  containerRef?: RefObject<HTMLElement | null>;
}

export function ScrollToTop({ containerRef }: ScrollToTopProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [pathname, containerRef]);

  return null;
}
