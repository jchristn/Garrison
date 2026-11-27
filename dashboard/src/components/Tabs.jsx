import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TAB_PARAM } from '../config/navConfig';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { tip } from './Tooltip';

/**
 * Whether a horizontally scrolling strip has tabs hidden before or after what shows (UT-16), kept current on scroll and
 * resize. Works in right-to-left layouts, where scrollLeft runs from 0 to negative values.
 */
function useOverflow(listRef, signature) {
  const [overflow, setOverflow] = useState({ start: false, end: false });
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const measure = () => {
      const offset = Math.abs(el.scrollLeft);
      const start = offset > 1;
      const end = offset + el.clientWidth < el.scrollWidth - 1;
      setOverflow((o) => (o.start === start && o.end === end ? o : { start, end }));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(el);
    } else {
      window.addEventListener('resize', measure);
    }
    return () => {
      el.removeEventListener('scroll', measure);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', measure);
    };
  }, [listRef, signature]);
  return overflow;
}

/** Arrow, Home, and End key handling shared by both tab strips (roving tabindex). */
function useTabKeys(keys, activeKey, select, listRef) {
  return useCallback(
    (event) => {
      if (keys.length === 0) return;
      const current = keys.indexOf(activeKey);
      const rtl = listRef.current && getComputedStyle(listRef.current).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
      let next = -1;
      if (event.key === forward) next = (current + 1) % keys.length;
      else if (event.key === backward) next = (current - 1 + keys.length) % keys.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = keys.length - 1;
      if (next < 0) return;
      event.preventDefault();
      select(keys[next]);
      const el = listRef.current?.querySelector(`[data-tab-key="${keys[next]}"]`);
      if (el) el.focus();
    },
    [keys, activeKey, select, listRef]
  );
}

/**
 * One tab strip. When the tabs do not fit, the strip scrolls sideways and shows a scroll button at each end that has
 * hidden tabs, so tabs past the edge stay reachable by mouse (UT-16). The active tab is scrolled into view.
 */
function TabStrip({ tabs, activeKey, onSelect, label, idPrefix, className = '' }) {
  const { t } = useTranslation();
  const listRef = useRef(null);
  const keys = useMemo(() => tabs.map((tab) => tab.id), [tabs]);
  const onKeyDown = useTabKeys(keys, activeKey, onSelect, listRef);
  // Re-measured when the tabs or their labels change (a language switch changes their widths).
  const overflow = useOverflow(listRef, tabs.map((tab) => `${tab.id}:${typeof tab.label === 'string' ? tab.label : ''}`).join('|'));
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-tab-key="${activeKey}"]`);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeKey]);
  const scroll = (forward) => {
    const el = listRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const step = Math.max(120, Math.round(el.clientWidth * 0.6)) * (forward ? 1 : -1) * (rtl ? -1 : 1);
    if (typeof el.scrollBy === 'function') el.scrollBy({ left: step, behavior: 'smooth' });
    else el.scrollLeft += step;
  };
  const strip = (
    <div ref={listRef} className={`tabs ${className}`.trim()} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map((tab) => {
        const selected = activeKey === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${tab.id}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel-${tab.id}` : undefined}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`tab ${selected ? 'active' : ''}`}
            onClick={() => onSelect(tab.id)}
            {...tip(tab.tip || tab.title)}
            data-tab-key={tab.id}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
  return (
    <div className={`tabs-frame${overflow.start ? ' has-start' : ''}${overflow.end ? ' has-end' : ''}`}>
      {overflow.start && (
        <button type="button" className="tabs-scroll tabs-scroll-start" aria-label={t('common.tabs.scrollBack')} onClick={() => scroll(false)} data-testid="tabs-scroll-back" {...tip(t('tips.tabs.scrollBack'))}>
          <ChevronLeftIcon size={16} />
        </button>
      )}
      {strip}
      {overflow.end && (
        <button type="button" className="tabs-scroll tabs-scroll-end" aria-label={t('common.tabs.scrollForward')} onClick={() => scroll(true)} data-testid="tabs-scroll-forward" {...tip(t('tips.tabs.scrollForward'))}>
          <ChevronRightIcon size={16} />
        </button>
      )}
    </div>
  );
}

/** Accessible, locally controlled tab strip. tabs: [{ id, label, tip }]. */
export default function Tabs({ tabs, active, onChange, label }) {
  return <TabStrip tabs={tabs} activeKey={active} onSelect={onChange} label={label} />;
}

/**
 * URL-synced tabbed surface used by hub pages. The active tab lives in the query string (`?tab=`),
 * so bookmarks, deep links, and click-throughs can land on a specific tab. Only the active panel is
 * mounted. Other query parameters survive a tab switch only when they belong to the same tab, so a
 * filter for one tab never leaks into another. An unknown or hidden `?tab=` falls back to the first tab.
 *
 * tabs: [{ id, label, tip?, render: () => ReactNode }] (already filtered for visibility).
 */
export function UrlTabs({ tabs, label, idPrefix = 'hub' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(TAB_PARAM);
  const activeKey = tabs.some((tab) => tab.id === requested) ? requested : tabs[0]?.id;
  const select = useCallback(
    (key) => {
      if (key === activeKey) return;
      setSearchParams(new URLSearchParams({ [TAB_PARAM]: key }));
    },
    [activeKey, setSearchParams]
  );

  const activeTab = tabs.find((tab) => tab.id === activeKey);

  return (
    <div className="hub-tabs">
      <TabStrip tabs={tabs} activeKey={activeKey} onSelect={select} label={label} idPrefix={idPrefix} className="hub-tab-strip" />
      {activeTab && (
        <div role="tabpanel" id={`${idPrefix}-panel-${activeTab.id}`} aria-labelledby={`${idPrefix}-tab-${activeTab.id}`} className="hub-tab-panel">
          {activeTab.render()}
        </div>
      )}
    </div>
  );
}
