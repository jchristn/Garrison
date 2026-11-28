import { useCallback, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppContext from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { tip } from '../components/Tooltip';
import { HelpIcon } from '../components/Icons';
import Diagram, { DOCS_BASE } from '../components/learn/Diagram';
import { findDiagram } from '../components/learn/diagrams';
import { GLOSSARY, LEARN_SECTIONS, sectionAnchor, tourKey } from '../components/learn/learnSections';

/**
 * The Learn page (LP4.3): the seven concept diagrams in learning order, each with a short paragraph and a tour, then a
 * glossary in the docs' vocabulary. Static and translated; it calls no API.
 *
 * `startTour(tourId)` starts a tour. The tour engine (LP4.5) will pass the real one. Until it lands, every button opens
 * the existing shell tour through AppContext.setTourOpen, whatever the tour id.
 */
export default function LearnView({ startTour }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const app = useContext(AppContext);

  const begin = useCallback(
    (tourId) => {
      if (startTour) startTour(tourId);
      else app?.setTourOpen?.(true);
    },
    [startTour, app]
  );

  // A link such as /dashboard/learn#learn-brakes (from an Explainer) lands on its section.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el && typeof el.scrollIntoView === 'function') {
      const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }, [hash]);

  const tourButton = (tourId, label) => (
    <button type="button" className="button-secondary button-sm" onClick={() => begin(tourId)} data-tour-id={tourId} data-testid={`learn-tour-${tourId}`} {...tip(t('tips.learn.startTour', { tour: t(tourKey(tourId)) }))}>
      <HelpIcon size={14} /> {label}
    </button>
  );

  return (
    <div className="learn-page" data-testid="learn-page">
      <PageHeader title={t('learn.title')} subtitle={t('learn.subtitle')} actions={tourButton('first-look', t('learn.startTourNamed', { tour: t(tourKey('first-look')) }))} />

      <nav className="learn-toc" aria-label={t('learn.toc')}>
        <div className="learn-toc-label">{t('learn.toc')}</div>
        <ol>
          {LEARN_SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${sectionAnchor(s.id)}`} {...tip(t('tips.learn.toc', { title: t(`learn.diagrams.${s.diagram}.title`) }))}>
                {t(`learn.diagrams.${s.diagram}.title`)}
              </a>
            </li>
          ))}
          <li>
            <a href="#learn-glossary" {...tip(t('tips.learn.toc', { title: t('learn.glossaryTitle') }))}>
              {t('learn.glossaryTitle')}
            </a>
          </li>
        </ol>
      </nav>

      {LEARN_SECTIONS.map((s, index) => {
        if (!findDiagram(s.diagram)) return null;
        return (
          <section key={s.id} id={sectionAnchor(s.id)} className="learn-section" aria-labelledby={`${sectionAnchor(s.id)}-heading`} data-testid={`learn-section-${s.id}`}>
            <div className="learn-section-head">
              <h2 id={`${sectionAnchor(s.id)}-heading`} className="learn-section-title">
                <span className="learn-section-number">{index + 1}</span>
                {t(`learn.diagrams.${s.diagram}.title`)}
              </h2>
              {tourButton(s.tour, t('learn.startTourNamed', { tour: t(tourKey(s.tour)) }))}
            </div>
            <p className="learn-section-summary">{t(`learn.diagrams.${s.diagram}.summary`)}</p>
            <Diagram id={s.diagram} onNavigate={navigate} docBase={DOCS_BASE} />
          </section>
        );
      })}

      <section id="learn-glossary" className="learn-section" aria-labelledby="learn-glossary-heading" data-testid="learn-glossary">
        <div className="learn-section-head">
          <h2 id="learn-glossary-heading" className="learn-section-title">
            {t('learn.glossaryTitle')}
          </h2>
        </div>
        <p className="learn-section-summary">{t('learn.glossaryIntro')}</p>
        <dl className="learn-glossary">
          {GLOSSARY.map((id) => (
            <div key={id} className="learn-glossary-row" data-term={id}>
              <dt>{t(`learn.glossary.${id}.term`)}</dt>
              <dd>{t(`learn.glossary.${id}.def`)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
