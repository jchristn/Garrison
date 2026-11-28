import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTours } from '../../context/TourContext';
import { TOUR_PHONE_QUERY, findTour, stepForViewport } from '../../config/tours';
import { tourKey } from '../learn/learnSections';
import { TOUR_TARGET_TIMEOUT_MS } from '../../utils/constants';
import { isRtl } from '../../utils/direction';
import { fillRoute, placeTourCard, prefersReducedMotion, resolveTourRecords, targetSelector, tenantHas, waitForTarget } from '../../utils/tours';
import { tip } from '../Tooltip';
import TourSampleModal from './TourSampleModal';

/** True below 768 pixels, where a step with a phone variant points at what the narrow layout shows. */
function isPhone() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(TOUR_PHONE_QUERY).matches;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const REMEASURE_MS = 200;

/**
 * The guided tour engine (LP-009, LP4.5). For the running tour it:
 *
 * 1. checks the tour's sample need and, on a tenant without it, offers the example in a confirm modal (LP4.6);
 * 2. fills the steps' {run}, {organization}, {unit}, and {keeper} placeholders from the tenant's records;
 * 3. per step, navigates to the step's route, waits up to `timeoutMs` (TOUR_TARGET_TIMEOUT_MS) for its data-tour
 *    target, and skips a step whose target or record is missing, with a short visible note on the next card;
 * 4. scrolls the target into view (without smooth scrolling under prefers-reduced-motion), outlines it, and shows the
 *    step card beside it, inside the viewport in either direction.
 *
 * Focus moves into the card on every step and stays there (Tab cycles inside it). Escape and Skip tour close it, and
 * focus returns to where it was before the tour. Done on the last step records the tour as finished for this person.
 */
export default function TourRunner({ timeoutMs = TOUR_TARGET_TIMEOUT_MS }) {
  const { t } = useTranslation();
  const tours = useTours();
  const navigate = useNavigate();
  const location = useLocation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const active = tours?.active || null;
  const tour = active ? findTour(active.id) : null;
  const [phase, setPhase] = useState('idle');
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState({});
  const [notes, setNotes] = useState([]);
  const [target, setTarget] = useState(null);
  const [rect, setRect] = useState(null);
  const [cardHeight, setCardHeight] = useState(200);
  const run = useRef(0);
  const direction = useRef(1);
  const locationRef = useRef(location);
  locationRef.current = location;
  const cardRef = useRef(null);
  const titleId = useId();
  const bodyId = useId();

  const end = useCallback((completed = false) => tours?.endTour?.({ completed }), [tours]);

  // A new tour (or a replay): check the sample need, then fill the placeholders.
  useEffect(() => {
    const mine = ++run.current;
    setIndex(0);
    setNotes([]);
    setTarget(null);
    setRect(null);
    direction.current = 1;
    if (!active || !tour) {
      setPhase('idle');
      return;
    }
    setPhase('checking');
    (async () => {
      if (tour.sample && apiClient) {
        const has = await tenantHas(apiClient, tenantId, tour.sample.needs);
        if (run.current !== mine) return;
        if (!has) {
          setPhase('offer');
          return;
        }
      }
      setPhase('resolving');
    })();
    // The nonce changes on every start, also when the same tour is replayed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.nonce]);

  useEffect(() => {
    if (phase !== 'resolving' || !tour) return;
    const mine = run.current;
    const load = apiClient ? resolveTourRecords(apiClient, tenantId, tour) : Promise.resolve({});
    load.then(
      (r) => {
        if (run.current !== mine) return;
        setRecords(r || {});
        setPhase('seeking');
      },
      () => {
        if (run.current !== mine) return;
        setRecords({});
        setPhase('seeking');
      }
    );
  }, [phase, tour, apiClient, tenantId]);

  // Find the current step: navigate, wait for the target, or skip it with a note.
  useEffect(() => {
    if (phase !== 'seeking' || !tour) return undefined;
    let cancelled = false;
    const step = stepForViewport(tour.steps[index], isPhone());
    const skip = (reasonKey) => {
      setNotes((list) => [...list, t(reasonKey, { step: t(step.title) })]);
      let next = index + direction.current;
      if (next < 0) {
        direction.current = 1;
        next = index + 1;
      }
      if (next >= tour.steps.length) {
        setTarget(null);
        setRect(null);
        setPhase('end');
      } else {
        setIndex(next);
      }
    };
    const path = fillRoute(step.route, records);
    if (!path) {
      skip('tours.ui.skippedNoRecord');
      return undefined;
    }
    const here = `${locationRef.current.pathname}${locationRef.current.search}`;
    if (here !== path) navigate(path);
    waitForTarget(targetSelector(step.target), { timeoutMs, isCancelled: () => cancelled }).then((el) => {
      if (cancelled) return;
      if (!el) {
        skip('tours.ui.skippedMissing');
        return;
      }
      // UXP1-V039: center the target, so one near the bottom edge does not end up half out of view under the card. A
      // target taller than most of the window (a whole list) starts at the top instead, so its heading shows.
      if (typeof el.scrollIntoView === 'function') {
        const tall = (el.getBoundingClientRect?.().height || 0) > (window.innerHeight || 0) * 0.7;
        el.scrollIntoView({ block: tall ? 'start' : 'center', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
      setTarget(el);
      setRect(el.getBoundingClientRect());
      setPhase('showing');
    });
    return () => {
      cancelled = true;
    };
  }, [phase, index, tour, records, navigate, timeoutMs, t]);

  // Keep the outline and the card on the target while the page scrolls, resizes, or settles after a smooth scroll.
  useEffect(() => {
    if (phase !== 'showing' || !target) return undefined;
    const measure = () => {
      if (!target.isConnected) return;
      const r = target.getBoundingClientRect();
      setRect((old) => (old && old.top === r.top && old.left === r.left && old.width === r.width && old.height === r.height ? old : r));
    };
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const timer = setInterval(measure, REMEASURE_MS);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      clearInterval(timer);
    };
  }, [phase, target]);

  const layerShown = !!tour && phase !== 'idle' && phase !== 'offer';

  // The page behind the tour is inert while the card shows, as behind any modal dialog.
  useEffect(() => {
    if (!layerShown) return undefined;
    const root = document.getElementById('root');
    if (!root) return undefined;
    const previous = root.inert;
    root.inert = true;
    return () => {
      root.inert = previous;
    };
  }, [layerShown]);

  // Focus goes into the card whenever it shows a new step (or the loading and end states).
  useEffect(() => {
    if (!layerShown) return;
    cardRef.current?.focus?.();
  }, [layerShown, phase, index]);

  useLayoutEffect(() => {
    if (!layerShown || !cardRef.current) return;
    const h = cardRef.current.offsetHeight;
    if (h && h !== cardHeight) setCardHeight(h);
  }, [layerShown, cardHeight, phase, index, notes]);

  // Escape closes the tour when its card is the top dialog.
  useEffect(() => {
    if (!layerShown) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs.length && dialogs[dialogs.length - 1] !== cardRef.current) return;
      e.preventDefault();
      end(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [layerShown, end]);

  if (!tour || phase === 'idle') return null;

  if (phase === 'offer') {
    return (
      <TourSampleModal
        tourId={tour.id}
        sample={tour.sample}
        onLoaded={() => setPhase('resolving')}
        onContinue={() => setPhase('resolving')}
        onCancel={() => end(false)}
      />
    );
  }

  const go = (delta) => {
    direction.current = delta;
    setNotes([]);
    setTarget(null);
    setIndex((i) => i + delta);
    setPhase('seeking');
  };

  const trap = (e) => {
    if (e.key !== 'Tab' || !cardRef.current) return;
    const items = [...cardRef.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const step = stepForViewport(tour.steps[index], isPhone());
  const total = tour.steps.length;
  const showing = phase === 'showing';
  const ended = phase === 'end';
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const pos = placeTourCard({ rect: showing ? rect : null, cardHeight, viewport, rtl: isRtl() });
  const tourName = t(tourKey(tour.id));
  const isLast = index === total - 1;
  const highlight =
    showing && rect
      ? {
          top: Math.max(0, rect.top - 4),
          left: Math.max(0, rect.left - 4),
          width: Math.min(rect.width + 8, viewport.width - Math.max(0, rect.left - 4)),
          height: Math.min(rect.height + 8, viewport.height - Math.max(0, rect.top - 4))
        }
      : null;

  let title;
  let body;
  if (ended) {
    title = t('tours.ui.endTitle');
    body = t('tours.ui.endBody', { tour: tourName });
  } else if (showing) {
    title = t(step.title);
    body = t(step.body);
  } else {
    title = tourName;
    body = t('tours.ui.finding');
  }

  return createPortal(
    <div className="tour-layer" data-testid="tour-layer">
      {highlight && <div className="tour-highlight" style={highlight} data-testid="tour-highlight" />}
      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('learn.startTourNamed', { tour: tourName })}
        aria-describedby={`${titleId} ${bodyId}`}
        tabIndex={-1}
        style={{ top: pos.top, left: pos.left, width: pos.width }}
        onKeyDown={trap}
        data-testid="tour-card"
        data-tour-id={tour.id}
        data-tour-step={showing ? step.id : ended ? 'end' : 'loading'}
        data-tour-phase={phase}
      >
        <div className="tour-progress">{ended ? tourName : t('wizard.stepOf', { step: index + 1, total })}</div>
        {notes.length > 0 && (
          <div className="tour-note" role="status" data-testid="tour-note">
            {notes.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
          </div>
        )}
        <h3 id={titleId}>{title}</h3>
        <p id={bodyId} aria-live={showing || ended ? undefined : 'polite'}>
          {body}
        </p>
        <div className="tour-actions">
          {!ended && (
            <button type="button" className="button-ghost button-sm" onClick={() => end(false)} data-testid="tour-skip" {...tip(t('tips.tours.skip'))}>
              {t('tour.skip')}
            </button>
          )}
          {showing && index > 0 && (
            <button type="button" className="button-secondary button-sm" onClick={() => go(-1)} data-testid="tour-back" {...tip(t('tips.tours.back'))}>
              {t('common.actions.back')}
            </button>
          )}
          {showing && !isLast && (
            <button type="button" className="button-primary button-sm" onClick={() => go(1)} data-testid="tour-next" {...tip(t('tips.tours.next'))}>
              {t('common.actions.next')}
            </button>
          )}
          {(ended || (showing && isLast)) && (
            <button type="button" className="button-primary button-sm" onClick={() => end(true)} data-testid="tour-done" {...tip(t('tips.tours.done'))}>
              {t('tour.done')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
