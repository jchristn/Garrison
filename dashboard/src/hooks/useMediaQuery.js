import { useEffect, useState } from 'react';

/**
 * Whether a CSS media query matches, kept current as the window changes. Without matchMedia (tests, very old
 * browsers) it answers `fallback`. The organization designer uses it to switch between the canvas and the chart tree
 * at 768px (LP-006).
 */
export default function useMediaQuery(query, fallback = true) {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [matches, setMatches] = useState(() => (supported ? window.matchMedia(query).matches : fallback));
  useEffect(() => {
    if (!supported) return undefined;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    if (list.addEventListener) list.addEventListener('change', update);
    else list.addListener(update);
    return () => {
      if (list.removeEventListener) list.removeEventListener('change', update);
      else list.removeListener(update);
    };
  }, [query, supported]);
  return matches;
}
