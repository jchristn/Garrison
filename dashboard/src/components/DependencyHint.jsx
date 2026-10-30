import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';

/**
 * Says where a field's choices come from when they live on another page, and how to get there: the text names the
 * page (`text` may be an array of separate sentences or lines), each link opens it in a new tab (so the form keeps what was typed), and Refresh list reads the choices again
 * after the person adds one there. `warning` shows a problem first (for example a credential the harness needs).
 * `links`: [{ href, label, testId? }]. `onRefresh` is optional.
 */
export default function DependencyHint({ text, warning = '', links = [], onRefresh, testId }) {
  const { t } = useTranslation();
  return (
    <span className="dependency-hint" data-testid={testId}>
      {warning && <span className="field-warning dependency-hint-warning">{warning}</span>}
      {(Array.isArray(text) ? text : [text]).filter(Boolean).map((line, i) => (
        <span key={i}>{line}</span>
      ))}
      <span className="dependency-hint-actions">
        {links.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" data-testid={l.testId} {...tip(t('tips.dependencyHint.open', { page: l.label }))}>
            {l.label} <span aria-hidden="true">↗</span>
          </a>
        ))}
        {onRefresh && (
          <button
            type="button"
            className="button-link"
            onClick={(e) => {
              e.preventDefault();
              onRefresh();
            }}
            data-testid={testId ? `${testId}-refresh` : undefined}
            {...tip(t('tips.dependencyHint.refresh'))}
          >
            {t('components.dependencyHint.refresh')}
          </button>
        )}
      </span>
    </span>
  );
}
