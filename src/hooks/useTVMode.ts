import { useEffect, useState, RefObject } from 'react';
import { isTVDevice } from '../lib/platform';

export function useTVMode(): { isTV: boolean; toggleTVMode: () => void } {
  const [isTV, setIsTV] = useState<boolean>(false);

  useEffect(() => {
    const checkTV = () => {
      setIsTV(isTVDevice());
    };
    checkTV();
    window.addEventListener('resize', checkTV);
    return () => window.removeEventListener('resize', checkTV);
  }, []);

  const toggleTVMode = () => {
    setIsTV((prev) => !prev);
  };

  return { isTV, toggleTVMode };
}

export function useArrowNavigation(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;

      const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const root = containerRef?.current || document;
      const elements = Array.from(root.querySelectorAll(focusableSelector));
      const focusables: HTMLElement[] = elements
        .map((el) => el as HTMLElement)
        .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (focusables.length === 0) return;

      const activeIndex = focusables.indexOf(document.activeElement as HTMLElement);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = activeIndex < focusables.length - 1 ? activeIndex + 1 : 0;
        focusables[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = activeIndex > 0 ? activeIndex - 1 : focusables.length - 1;
        focusables[prevIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}
