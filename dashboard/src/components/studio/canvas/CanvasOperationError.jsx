import { useTranslation } from 'react-i18next';
import { tip } from '../../Tooltip';
import { errorMessage } from '../../../utils/errors';
import { fieldError } from '../../../utils/studioCanvas';

/**
 * A graph operation the server refused (other than a version conflict): the translated error, and each field error
 * with its field code translated when the dashboard knows it (NotAMember, SelfEdge, NoSuchEdge, AppDeleted, ...).
 */
export default function CanvasOperationError({ failure, onDismiss }) {
  const { t } = useTranslation();
  if (!failure) return null;
  const { error, operation } = failure;
  const fields = Object.keys(error?.fields || error?.fieldCodes || {});
  return (
    <div className="error-banner studio-conflict" role="alert" data-testid="studio-canvas-error">
      <div>
        <strong>{t('components.studio.canvas.operationFailed', { operation: t(`components.studio.canvas.operations.${operation}`, { defaultValue: operation }) })}</strong>
      </div>
      <div>{errorMessage(t, error)}</div>
      {fields.length > 0 && (
        <ul className="studio-list">
          {fields.map((f) => (
            <li key={f} data-field-error={f}>
              <code>{f}</code>: {fieldError(t, error, f)}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="button-ghost button-sm" onClick={onDismiss} {...tip(t('tips.studio.canvas.dismissError'))}>
        {t('components.studio.items.conflict.dismiss')}
      </button>
    </div>
  );
}
