import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHub } from '../context/HubContext';
import HubTourButton from './tours/HubTourButton';

/**
 * Route page header. Sets document.title and renders title, summary, and actions. Inside a hub tab
 * (see HubView) the hub already renders the title and document.title, so the header collapses to a
 * compact row with just the summary and actions.
 *
 * `tour` is a data-tour name for the header, so a guided tour can point at it (LP4.5). `hubKey` names the standalone
 * hub this page is (home, invoke, connections): its "?" button starts the tour that covers the hub, and a hub with no
 * tour gets no button (LP4.7). Inside a hub tab the hub header carries the button instead. The "?" always sits right of
 * the title, on every page and hub (UXP1-V028).
 *
 * `back` is a link to the list a detail page belongs to; it sits above the title, never among the actions, so every
 * detail page has the same header: back link, then title and badges on the left, actions on the right (UXP1-V026).
 */
export default function PageHeader({ title, subtitle, actions, tour, hubKey, back }) {
  const { t } = useTranslation();
  const { embedded } = useHub();
  useEffect(() => {
    if (title && !embedded) document.title = `${title} | ${t('common.productName')}`;
  }, [title, t, embedded]);

  if (embedded) {
    if (!subtitle && !actions) return null;
    return (
      <div className="page-header embedded" data-tour={tour || undefined}>
        <div className="page-header-text">{subtitle && <div className="page-header-subtitle">{subtitle}</div>}</div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    );
  }

  const help = hubKey ? <HubTourButton hubKey={hubKey} /> : null;
  return (
    <header className="page-header" data-tour={tour || undefined}>
      <div className="page-header-text">
        {back && <div className="page-header-back">{back}</div>}
        <div className="page-header-title-row">
          <h1 className="page-header-title">{title}</h1>
          {help}
        </div>
        {subtitle && <div className="page-header-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
