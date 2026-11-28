import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshIcon, XIcon } from './Icons';
import { tip } from './Tooltip';

/** Centered loading block. */
export function LoadingState({ label }) {
  const { t } = useTranslation();
  return (
    <div className="state-block">
      <div className="loading-spinner" />
      <p>{label || t('common.generic.loading')}</p>
    </div>
  );
}

/** Empty state with a title and body. */
export function EmptyState({ title, body, action }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

/**
 * Inline empty state for a list, panel, or tab that has nothing to show yet.
 * Renders a padded, centered note inside a bordered surface (`.empty-state`),
 * matching the look of `.table-empty`. Extra props (such as `data-testid`) pass
 * through to the wrapper.
 */
export function EmptyNote({ children, className = '', ...rest }) {
  return (
    <div className={className ? `empty-state ${className}` : 'empty-state'} {...rest}>
      {children}
    </div>
  );
}

/**
 * Dismissible/retryable error banner. The close button hides this message (UXP1-V020); a different message, or the
 * banner shown again after its error cleared, appears as usual. onDismiss, when given, is called as well.
 */
export function ErrorBanner({ message, onRetry, onDismiss }) {
  const { t } = useTranslation();
  const text = message || t('common.errors.loadFailed');
  const [hidden, setHidden] = useState(null);
  if (hidden === text) return null;
  return (
    <div className="error-banner">
      <span>{text}</span>
      <span className="error-banner-actions">
        {onRetry && (
          <button type="button" className="button-secondary button-sm" onClick={onRetry} {...tip(t('tips.actions.retryLoad'))}>
            <RefreshIcon /> {t('common.actions.retry')}
          </button>
        )}
        <button
          type="button"
          className="error-banner-dismiss"
          aria-label={t('common.actions.close')}
          data-testid="error-banner-dismiss"
          onClick={() => {
            setHidden(text);
            if (onDismiss) onDismiss();
          }}
          {...tip(t('tips.actions.dismissError'))}
        >
          <XIcon size={16} />
        </button>
      </span>
    </div>
  );
}
