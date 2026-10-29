import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../ConfirmModal';
import { Badge } from '../StatusBadge';
import { PlusIcon } from '../Icons';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/errors';
import { enumLabel } from '../../utils/enums';
import { enumTip } from '../../utils/tips';
import { formatDateTime, formatRelativeTime } from '../../i18n/formatters';
import { DELETABLE_KINDS, DRAFT_KINDS, DRAFT_OPERATIONS, draftChanges, draftItems, itemKey, itemTemplate, newItemErrors, noItemChanges, staleKeys } from '../../utils/studio';

/**
 * The notice after a save or removal failed with 409 DraftVersionConflict: the draft was read again, and the notice
 * names what moved (items added, edited, or removed, and the new version). The person's text stays in the editor.
 */
export function ConflictNotice({ conflict, editingKey, onDismiss }) {
  const { t } = useTranslation();
  if (!conflict) return null;
  const list = (keys) => keys.join(', ');
  const mine = editingKey && (conflict.updated.includes(editingKey) || conflict.removed.includes(editingKey));
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
      <div>{t(mine ? 'components.studio.items.conflict.mine' : 'components.studio.items.conflict.retry')}</div>
      {onDismiss && (
        <button type="button" className="button-ghost button-sm" onClick={onDismiss} {...tip(t('tips.studio.items.dismissConflict'))}>
          {t('components.studio.items.conflict.dismiss')}
        </button>
      )}
    </div>
  );
}

/**
 * The draft's items (AD7.10): kind, name, operation, and a stale marker from the diff, with a YAML editor per item
 * that saves with the version read (PUT .../items/{kind}/{name}), a new item, and remove. A 409 DraftVersionConflict
 * reads the draft again and names what changed. `onDraft(draft)` hands the workspace the draft the server answered.
 * `blocked` is the reason editing is off ('' when allowed): a missing permission, or a draft that is not open.
 */
export default function StudioItemsPanel({ draft, diff, blocked = '', onDraft }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const items = draftItems(draft);
  const stale = staleKeys(diff);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [addErrors, setAddErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [removing, setRemoving] = useState(null);

  // Read the draft again after a conflict and say what moved; the editor keeps the person's text.
  const handleConflict = async (e) => {
    if (e?.code !== 'DraftVersionConflict') return false;
    try {
      const fresh = await apiClient.getStudioDraft(tenantId, draft.id);
      setConflict(draftChanges(draft, fresh));
      onDraft(fresh);
    } catch (reload) {
      setError(reload);
    }
    return true;
  };

  const save = async () => {
    if (!editing || blocked) return;
    setBusy(true);
    setError(null);
    try {
      const next = await apiClient.putStudioDraftItem(tenantId, draft.id, editing.kind, editing.name, { version: draft.version, operation: editing.operation, document: editing.document });
      setConflict(null);
      onDraft(next);
      setEditing({ ...editing, original: editing.document, isNew: false });
      addToast({ type: 'success', message: t('components.studio.items.saved', { item: itemKey(editing), version: next?.version }) });
    } catch (e) {
      if (!(await handleConflict(e))) setError(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const item = removing;
    try {
      const next = await apiClient.removeStudioDraftItem(tenantId, draft.id, item.kind, item.name, draft.version);
      setConflict(null);
      onDraft(next);
      if (editing && itemKey(editing) === itemKey(item)) setEditing(null);
      addToast({ type: 'success', message: t('components.studio.items.removed', { item: itemKey(item) }) });
    } catch (e) {
      if (!(await handleConflict(e))) addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setRemoving(null);
    }
  };

  const startAdd = () => {
    if (blocked) return;
    setAdding({ kind: 'Agent', name: '', operation: 'Upsert' });
    setAddErrors({});
  };

  const confirmAdd = () => {
    const errors = newItemErrors(adding, items, t);
    if (Object.keys(errors).length) {
      setAddErrors(errors);
      return;
    }
    const name = adding.name.trim();
    const document = itemTemplate(adding.kind, name);
    setEditing({ kind: adding.kind, name, operation: adding.operation, document, original: '', isNew: true });
    setAdding(null);
  };

  const open = (item) => {
    setError(null);
    setEditing({ kind: item.kind, name: item.name, operation: item.operation || 'Upsert', document: item.document || '', original: item.document || '', isNew: false });
  };

  const disabledProps = (reason) => (reason ? { 'aria-disabled': 'true', 'data-denied': 'true' } : {});

  return (
    <section className="panel studio-items" aria-label={t('components.studio.items.title')} data-testid="studio-items">
      <div className="studio-row-between">
        <h3 className="section-title" {...tip(t('tips.studio.items.title'))}>
          {t('components.studio.items.titleCount', { total: items.length })}
        </h3>
        <button type="button" className="button-secondary button-sm" onClick={startAdd} data-testid="studio-item-add" {...disabledProps(blocked)} {...tip(blocked || t('tips.studio.items.add'))}>
          <PlusIcon size={14} /> {t('components.studio.items.add')}
        </button>
      </div>
      <ConflictNotice conflict={conflict} editingKey={editing ? itemKey(editing) : null} onDismiss={() => setConflict(null)} />
      {adding && (
        <div className="studio-item-new form-grid" data-testid="studio-item-new">
          <div className={`field${addErrors.kind ? ' has-error' : ''}`}>
            <label htmlFor="studio-item-kind" {...tip(t('tips.studio.items.kind'))}>
              {t('components.studio.items.columns.kind')}
            </label>
            <select id="studio-item-kind" value={adding.kind} onChange={(e) => setAdding({ ...adding, kind: e.target.value })} {...tip(t('tips.studio.items.kind'))}>
              {DRAFT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            {addErrors.kind && <div className="field-error">{addErrors.kind}</div>}
          </div>
          <div className={`field${addErrors.name ? ' has-error' : ''}`}>
            <label htmlFor="studio-item-name" {...tip(t('tips.studio.items.name'))}>
              {t('components.studio.items.columns.name')}
            </label>
            <input id="studio-item-name" value={adding.name} placeholder="writer" onChange={(e) => setAdding({ ...adding, name: e.target.value })} {...tip(t('tips.studio.items.name'))} />
            {addErrors.name && <div className="field-error">{addErrors.name}</div>}
          </div>
          <div className={`field${addErrors.operation ? ' has-error' : ''}`}>
            <label htmlFor="studio-item-operation" {...tip(t('tips.studio.items.operation'))}>
              {t('components.studio.items.columns.operation')}
            </label>
            <select id="studio-item-operation" value={adding.operation} onChange={(e) => setAdding({ ...adding, operation: e.target.value })} {...tip(t('tips.studio.items.operation'))}>
              {DRAFT_OPERATIONS.map((o) => (
                <option key={o} value={o}>
                  {enumLabel(t, 'studioDraftOperation', o)}
                </option>
              ))}
            </select>
            {addErrors.operation && <div className="field-error">{addErrors.operation}</div>}
          </div>
          <div className="flex gap-sm items-center span-full">
            <button type="button" className="button-primary button-sm" onClick={confirmAdd} data-testid="studio-item-add-confirm" {...tip(t('tips.studio.items.addConfirm'))}>
              {t('components.studio.items.addConfirm')}
            </button>
            <button type="button" className="button-ghost button-sm" onClick={() => setAdding(null)} {...tip(t('tips.modal.cancelForm'))}>
              {t('common.actions.cancel')}
            </button>
          </div>
        </div>
      )}
      {items.length === 0 ? (
        <div className="text-muted">{t('components.studio.items.empty')}</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="studio-items-table">
            <thead>
              <tr>
                {['kind', 'name', 'operation', 'stale', 'updated'].map((c) => (
                  <th key={c} scope="col" {...tip(t(`tips.studio.items.${c}`))}>
                    {t(`components.studio.items.columns.${c}`)}
                  </th>
                ))}
                <th scope="col" className="right" {...tip(t('tips.table.actionsColumn'))}>
                  {t('common.generic.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const key = itemKey(item);
                const isStale = stale.has(key);
                return (
                  <tr key={key} data-item={key} className={editing && itemKey(editing) === key ? 'is-selected' : undefined}>
                    <td>{item.kind}</td>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>
                      <Badge tone={item.operation === 'Delete' ? 'warning' : 'neutral'} tip={enumTip(t, 'studioDraftOperation', item.operation || 'Upsert')}>
                        {enumLabel(t, 'studioDraftOperation', item.operation || 'Upsert')}
                      </Badge>
                    </td>
                    <td>
                      {isStale ? (
                        <Badge tone="warning" tip={t('tips.studio.items.staleBadge')}>
                          {t('components.studio.items.stale')}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="nowrap">{item.lastUpdateUtc ? <span {...tip(formatDateTime(item.lastUpdateUtc, lng))}>{formatRelativeTime(item.lastUpdateUtc, lng)}</span> : '-'}</td>
                    <td className="actions-cell">
                      <button type="button" className="button-ghost button-sm" onClick={() => open(item)} data-testid={`studio-item-edit-${key}`} {...tip(t(blocked ? 'tips.studio.items.viewItem' : 'tips.studio.items.editItem'))}>
                        {t(blocked ? 'common.actions.view' : 'common.actions.edit')}
                      </button>
                      <button
                        type="button"
                        className="button-ghost button-sm"
                        onClick={() => !blocked && setRemoving(item)}
                        data-testid={`studio-item-remove-${key}`}
                        {...disabledProps(blocked)}
                        {...tip(blocked || t('tips.studio.items.remove'))}
                      >
                        {t('components.studio.items.remove')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <div className="studio-editor" data-testid="studio-item-editor">
          <div className="studio-row-between">
            <h4 className="section-title" {...tip(t('tips.studio.items.editor'))}>
              {t(editing.isNew ? 'components.studio.items.newEditorTitle' : 'components.studio.items.editorTitle', { item: itemKey(editing) })}
            </h4>
            <div className="flex gap-sm items-center">
              <label htmlFor="studio-editor-operation" {...tip(t('tips.studio.items.operation'))}>
                {t('components.studio.items.columns.operation')}
              </label>
              <select
                id="studio-editor-operation"
                value={editing.operation}
                disabled={!!blocked}
                onChange={(e) => setEditing({ ...editing, operation: e.target.value })}
                {...tip(t('tips.studio.items.operation'))}
              >
                {DRAFT_OPERATIONS.filter((o) => o === 'Upsert' || DELETABLE_KINDS.includes(editing.kind) || o === editing.operation).map((o) => (
                  <option key={o} value={o}>
                    {enumLabel(t, 'studioDraftOperation', o)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label htmlFor="studio-editor-document" className="sr-only" {...tip(t('tips.studio.items.document'))}>
            {t('components.studio.items.document')}
          </label>
          <textarea
            id="studio-editor-document"
            className="monospace template-textarea studio-yaml"
            spellCheck={false}
            rows={18}
            value={editing.document}
            readOnly={!!blocked}
            onChange={(e) => setEditing({ ...editing, document: e.target.value })}
            data-testid="studio-item-document"
            {...tip(t('tips.studio.items.document'))}
          />
          <div className="field-hint">{t('components.studio.items.versionHint', { version: draft.version })}</div>
          {error && (
            <div className="error-banner" role="alert" data-testid="studio-item-error">
              {errorMessage(t, error)}
              {error.fields && (
                <ul className="studio-list">
                  {Object.entries(error.fields).map(([k, v]) => (
                    <li key={k}>
                      <code>{k}</code>: {v}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-sm items-center">
            <button type="button" className="button-primary" onClick={save} disabled={busy} data-testid="studio-item-save" {...disabledProps(blocked)} {...tip(blocked || t('tips.studio.items.save'))}>
              {busy ? t('common.generic.saving') : t('common.actions.save')}
            </button>
            <button type="button" className="button-secondary" onClick={() => setEditing(null)} {...tip(t('tips.studio.items.closeEditor'))}>
              {t('common.actions.close')}
            </button>
            {editing.document !== editing.original && <span className="text-muted">{t('components.studio.items.unsaved')}</span>}
          </div>
        </div>
      )}
      <ConfirmModal
        open={!!removing}
        danger
        title={t('components.studio.items.removeTitle')}
        message={t('components.studio.items.removeMessage', { item: removing ? itemKey(removing) : '' })}
        confirmLabel={t('components.studio.items.remove')}
        confirmTip={t('tips.studio.items.remove')}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}
