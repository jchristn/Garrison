import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { findTour } from '../config/tours';
import { markTourCompleted, readCompletedTours } from '../utils/tours';

const TourContext = createContext(null);

function restoreFocus(el) {
  const run = () => {
    if (el && el.isConnected && typeof el.focus === 'function') {
      el.focus();
      return;
    }
    // The page that started the tour is gone: land on the main content instead of the top of the document.
    const main = typeof document !== 'undefined' ? document.getElementById('main-content') : null;
    if (main) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      main.focus();
    }
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else run();
}

/**
 * Guided tour state (LP4.5): which tour is running, and which tours this person has finished in this tenant (saved per
 * user, see utils/tours.js). startTour(id) remembers the focused element, and endTour() puts focus back on it.
 * endTour({ completed: true }) also records the tour as finished. The engine itself is components/tours/TourRunner.
 */
export function TourProvider({ children }) {
  const { principal } = useAuth();
  const { tenantId } = useApp();
  const [active, setActive] = useState(null);
  const [completed, setCompleted] = useState(() => readCompletedTours(principal, tenantId));
  const returnTo = useRef(null);
  const activeRef = useRef(null);
  activeRef.current = active;

  useEffect(() => {
    setCompleted(readCompletedTours(principal, tenantId));
  }, [principal, tenantId]);

  const startTour = useCallback((tourId) => {
    if (!findTour(tourId)) return false;
    returnTo.current = typeof document !== 'undefined' ? document.activeElement : null;
    setActive({ id: tourId, nonce: Date.now() + Math.random() });
    return true;
  }, []);

  const endTour = useCallback(
    ({ completed: done = false } = {}) => {
      const current = activeRef.current;
      if (current && done) setCompleted(markTourCompleted(principal, tenantId, current.id));
      setActive(null);
      const el = returnTo.current;
      returnTo.current = null;
      restoreFocus(el);
    },
    [principal, tenantId]
  );

  const value = useMemo(() => ({ active, startTour, endTour, completed, isCompleted: (id) => completed.includes(id) }), [active, startTour, endTour, completed]);
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

/** The tour state, or null outside a TourProvider (unit tests that render a page alone). */
export function useTours() {
  return useContext(TourContext);
}

export default TourContext;
