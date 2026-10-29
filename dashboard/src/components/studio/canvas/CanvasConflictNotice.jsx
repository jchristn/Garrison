import { useTranslation } from 'react-i18next';
import { tip } from '../../Tooltip';
import { enumLabel } from '../../../utils/enums';
import { noItemChanges } from '../../../utils/studio';

/**
 * The notice after a canvas change was refused with 409 DraftVersionConflict (AD8.5): the draft was read again, and
 * the notice names what moved (items added, edited, or removed, and the new version). A property edit stays in its
 * panel; a graph operation can be tried again on the new version.
 */
export default function CanvasConflictNotice({ conflict, onRetry, onDismiss }) {
  const { t } = useTranslation();
  if (!conflict) return null;
  const list = (keys) => keys.join(', ');
  const mine = conflict.editingKey && (conflict.updated.includes(conflict.editingKey) || conflict.removed.includes(conflict.editingKey));
  const closing = conflict.editingKey
    ? t(mine ? 'components.studio.canvas.conflict.mine' : 'components.studio.canvas.conflict.kept', { item: conflict.editingKey })
    : t('components.studio.canvas.conflict.operation', { operation: t(`components.studio.canvas.operations.${conflict.operation}`, { defaultValue: conflict.operation }) });
  return (
    <div className="warning-banner studio-conflict" role="alert" data-testid="studio-conflict">
      <div>
        <strong>{t('components.studio.items.conflict.title', { from: conflict.fromVersion, to: conflict.toVersion })}</strong>
      </div>
      {noItemChanges(conflict) ? (
        <div>{conflict.statusChanged ? t('components.studio.items.conflict.status', { status: enumLabel(t, 'studioDraftStatus', conflict.status) }) : t('components.studio.items.conflict.layout')}</div>
      ) : (
        <ul className="studio-list">
          {conflict.added.length > 0 && <li>{t('components.studio.items.conflict.added', { items: list(conflict.added) })}</li>}
          {conflict.updated.length > 0 && <li>{t('components.studio.items.conflict.updated', { items: list(conflict.updated) })}</li>}
          {conflict.removed.length > 0 && <li>{t('components.studio.items.conflict.removed', { items: list(conflict.removed) })}</li>}
        </ul>
      )}
      <div>{closing}</div>
      <div className="flex gap-sm">
        {onRetry && (
          <button type="button" className="button-secondary button-sm" onClick={onRetry} data-testid="studio-conflict-retry" {...tip(t('tips.studio.canvas.retry'))}>
            {t('components.studio.canvas.conflict.retry')}
          </button>
        )}
        <button type="button" className="button-ghost button-sm" onClick={onDismiss} {...tip(t('tips.studio.items.dismissConflict'))}>
          {t('components.studio.items.conflict.dismiss')}
        </button>
      </div>
    </div>
  );
}
