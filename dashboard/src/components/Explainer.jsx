import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useInRouterContext } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon, InfoIcon, XIcon } from './Icons';
import { tip } from './Tooltip';
import { STORAGE_KEYS } from '../utils/constants';
import { learnPathForTopic } from './learn/learnSections';

const PARAGRAPHS = ['p1', 'p2', 'p3', 'p4'];

/** Below this width an explainer starts folded to its title line (UXP1-V022). */
export const EXPLAINER_NARROW_WIDTH = 768;

const SEEN_KEY = `${STORAGE_KEYS.explainers}:seen`;

function readMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
}

function writeMap(key, topic, value) {
  try {
    const all = readMap(key);
    if (value) all[topic] = value;
    else delete all[topic];
    localStorage.setItem(key, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function readHidden() {
  return readMap(STORAGE_KEYS.explainers);
}

function writeHidden(topic, hidden) {
  writeMap(STORAGE_KEYS.explainers, topic, hidden ? true : null);
}

function isNarrow() {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(`(max-width: ${EXPLAINER_NARROW_WIDTH - 1}px)`).matches;
  } catch {
    return false;
  }
}

/**
 * Whether an explainer starts open (UXP1-V022): open on the first view of its topic, folded to its title line after
 * that, and folded from the start below 768 pixels. Opening or folding one by hand is remembered for the topic.
 */
export function explainerStartsOpen(topic) {
  const seen = readMap(SEEN_KEY)[topic];
  if (seen === 'open') return true;
  if (seen === 'closed') return false;
  if (isNarrow()) return false;
  return !seen;
}

/**
 * "How this relates" info panel shown at the top of a page or tab. Text lives in `explainers.<topic>` (title plus
 * paragraphs p1 to p4). The first time a person sees a topic it is open; after that it is folded to its title line so
 * the list below starts on the first screen, and a click on the title opens it again. Dismissing it collapses it to a
 * small "About ..." button that reopens it. Both choices are remembered per topic in localStorage.
 */
export default function Explainer({ topic, diagram = null }) {
  const { t, i18n } = useTranslation();
  const [hidden, setHidden] = useState(() => !!readHidden()[topic]);
  const [open, setOpen] = useState(() => explainerStartsOpen(topic));
  const title = t(`explainers.${topic}.title`);
  const bodyId = `explainer-body-${topic}`;

  // The first view is recorded once, so the next visit starts folded.
  useEffect(() => {
    if (!readMap(SEEN_KEY)[topic]) writeMap(SEEN_KEY, topic, 'seen');
  }, [topic]);

  const toggle = (next) => {
    setHidden(next);
    writeHidden(topic, next);
  };

  const fold = (next) => {
    setOpen(next);
    writeMap(SEEN_KEY, topic, next ? 'open' : 'closed');
  };

  if (hidden) {
    return (
      <button type="button" className="button-ghost button-sm explainer-reopen" onClick={() => toggle(false)} data-testid={`explainer-open-${topic}`} {...tip(t('tips.explainer.reopen', { topic: title }))}>
        <InfoIcon size={14} /> {t('components.explainer.about', { topic: title })}
      </button>
    );
  }

  return (
    <section className={`explainer${open ? '' : ' is-folded'}`} aria-label={title} data-testid={`explainer-${topic}`} data-open={open ? 'true' : 'false'}>
      <span className="explainer-icon" aria-hidden="true">
        <InfoIcon />
      </span>
      <div className="explainer-body">
        <button
          type="button"
          className="explainer-title explainer-fold"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => fold(!open)}
          data-testid={`explainer-fold-${topic}`}
          {...tip(t(open ? 'tips.explainer.fold' : 'tips.explainer.unfold', { topic: title }))}
        >
          {open ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
          <span>{title}</span>
        </button>
        {open && (
          <div id={bodyId}>
            {diagram}
            {PARAGRAPHS.filter((p) => i18n.exists(`explainers.${topic}.${p}`)).map((p) => (
              <p key={p}>{t(`explainers.${topic}.${p}`)}</p>
            ))}
            <DiagramLink topic={topic} />
          </div>
        )}
      </div>
      <div className="explainer-actions">
        <button type="button" className="icon-button" onClick={() => toggle(true)} aria-label={t('components.explainer.dismiss')} data-testid={`explainer-dismiss-${topic}`} {...tip(t('tips.explainer.dismiss'))}>
          <XIcon size={16} />
        </button>
      </div>
    </section>
  );
}

/**
 * LP4.3: "See the diagram", a link to the Learn page section that draws this topic. Only topics listed in
 * EXPLAINER_SECTIONS (components/learn/learnSections.js) get one. Outside a router (some tests) it is a plain link.
 */
function DiagramLink({ topic }) {
  const { t } = useTranslation();
  const inRouter = useInRouterContext();
  const to = learnPathForTopic(topic);
  if (!to) return null;
  const props = { className: 'explainer-learn-link', 'data-testid': `explainer-diagram-${topic}`, ...tip(t('tips.learn.seeDiagram')) };
  const label = t('components.explainer.seeDiagram');
  return inRouter ? (
    <Link to={to} {...props}>
      {label}
    </Link>
  ) : (
    <a href={to} {...props}>
      {label}
    </a>
  );
}

/** Small diagram: an agent, its weighted deployments, and what each deployment binds. */
export function AgentRelationDiagram() {
  const { t } = useTranslation();
  const node = (key, primary = false) => (
    <div className={`relation-node ${primary ? 'is-primary' : ''}`} {...tip(t(`explainers.diagram.${key}.tip`))}>
      <strong>{t(`explainers.diagram.${key}.title`)}</strong>
      <span>{t(`explainers.diagram.${key}.body`)}</span>
    </div>
  );
  return (
    <div className="relation-diagram" role="img" aria-label={t('explainers.diagram.label')} data-testid="relation-diagram">
      {node('caller')}
      <span className="relation-arrow" aria-hidden="true">→</span>
      {node('agent', true)}
      <span className="relation-arrow" aria-hidden="true">→</span>
      <div className="relation-stack">
        {node('deploymentA')}
        {node('deploymentB')}
      </div>
      <span className="relation-arrow" aria-hidden="true">→</span>
      <div className="relation-stack">
        {node('binds')}
        {node('run')}
      </div>
    </div>
  );
}
