import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CodeBlock from '../CodeBlock';
import ConfirmModal from '../ConfirmModal';
import DiffViewer from '../DiffViewer';
import Modal from '../Modal';
import CloneTemplateModal from '../CloneTemplateModal';
import { Badge } from '../StatusBadge';
import { tip } from '../Tooltip';
import StudioLink from './StudioLink';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { pathFor } from '../../config/navConfig';
import { errorMessage } from '../../utils/errors';
import { formatDateTime, formatNumber } from '../../i18n/formatters';
import { ARCHITECT_AGENT, inUseDeployments, sortArchitectPrompts } from '../../utils/studio';

/** Sample values the architect prompt preview renders with. */
const PREVIEW_CONTEXT = {
  tenant: { id: 'default', name: 'Default' },
  agent: { name: ARCHITECT_AGENT, displayName: 'Agent architect', description: '' },
  deployment: { name: 'architect', parameters: {} },
  garrison: { delegationEnabled: false },
  input: { message: '', parameters: {} }
};

/**
 * The editor for one tenant architect prompt: name, description, and body with a live render preview, a change note,
 * and the version history with a diff against the text being edited and restore. Every save is a new version; the
 * architect deployments that follow the template's current version use it from their next turn.
 */
function PromptEditor({ entry, deniedEdit, onSaved, onClose }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [template, setTemplate] = useState(null);
  const [form, setForm] = useState({ name: entry.name, description: entry.description || '', content: '', changeNote: '' });
  const [versions, setVersions] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [diffVersion, setDiffVersion] = useState(null);
  const [restore, setRestore] = useState(null);

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient
      .getPromptTemplate(tenantId, entry.id)
      .then((tpl) => {
        setTemplate(tpl);
        setForm({ name: tpl.name, description: tpl.description || '', content: tpl.content || '', changeNote: '' });
      })
      .catch(setError);
    apiClient
      .listPromptTemplateVersions(tenantId, entry.id)
      .then((r) => setVersions(Array.isArray(r) ? r : r?.objects || r?.items || []))
      .catch(() => setVersions([]));
  }, [apiClient, tenantId, entry.id]);

  useEffect(load, [load]);

  // Render the body a moment after typing stops.
  useEffect(() => {
    if (!apiClient || !template) return undefined;
    const id = setTimeout(() => {
      apiClient
        .renderTemplateContent(tenantId, { content: form.content, context: PREVIEW_CONTEXT })
        .then((r) => {
          setPreview(r?.rendered ?? r?.text ?? (typeof r === 'string' ? r : ''));
          setPreviewError(null);
        })
        .catch((e) => setPreviewError(errorMessage(t, e)));
    }, 400);
    return () => clearTimeout(id);
  }, [apiClient, tenantId, form.content, template, t]);

  const save = async () => {
    if (deniedEdit) return;
    if (!form.name.trim()) {
      setError({ message: t('common.errors.required') });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiClient.updatePromptTemplate(tenantId, entry.id, { name: form.name.trim(), description: form.description, kind: template?.kind || 'System', content: form.content, changeNote: form.changeNote || undefined });
      addToast({ type: 'success', message: t('components.studio.prompts.saved', { name: form.name.trim() }) });
      load();
      onSaved?.();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    const version = restore;
    setRestore(null);
    try {
      await apiClient.restorePromptTemplateVersion(tenantId, entry.id, version);
      addToast({ type: 'success', message: t('views.templateEditor.restored', { version }) });
      load();
      onSaved?.();
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const editable = !deniedEdit;
  return (
    <div className="studio-prompt-editor" data-testid="architect-prompt-editor">
      <div className="studio-row-between">
        <h4 className="section-title" {...tip(t('tips.studio.prompts.editor'))}>
          {t('components.studio.prompts.editorTitle', { name: entry.name, version: template?.currentVersion ?? entry.currentVersion })}
        </h4>
        <button type="button" className="button-ghost button-sm" onClick={onClose} {...tip(t('tips.studio.prompts.closeEditor'))}>
          {t('common.actions.close')}
        </button>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="architect-prompt-name" {...tip(t('tips.studio.prompts.name'))}>
            {t('components.studio.prompts.name')}
          </label>
          <input id="architect-prompt-name" value={form.name} readOnly={!editable} onChange={(e) => setForm({ ...form, name: e.target.value })} {...tip(t('tips.studio.prompts.name'))} />
        </div>
        <div className="field">
          <label htmlFor="architect-prompt-description" {...tip(t('tips.studio.prompts.description'))}>
            {t('components.studio.prompts.description')}
          </label>
          <input id="architect-prompt-description" value={form.description} readOnly={!editable} onChange={(e) => setForm({ ...form, description: e.target.value })} {...tip(t('tips.studio.prompts.description'))} />
        </div>
      </div>
      <div className="preview-layout">
        <div className="field">
          <label htmlFor="architect-prompt-body" {...tip(t('tips.studio.prompts.body'))}>
            {t('components.studio.prompts.body')}
          </label>
          <textarea
            id="architect-prompt-body"
            className="monospace template-textarea"
            spellCheck={false}
            value={form.content}
            readOnly={!editable}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            data-testid="architect-prompt-body"
            {...tip(t('tips.studio.prompts.body'))}
          />
        </div>
        <div>
          <div className="section-title" {...tip(t('tips.studio.prompts.preview'))}>
            {t('components.studio.prompts.preview')}
          </div>
          {previewError ? <div className="error-banner">{previewError}</div> : <CodeBlock value={preview || ''} emptyText={t('views.templateEditor.previewEmpty')} />}
        </div>
      </div>
      <div className="field">
        <label htmlFor="architect-prompt-note" {...tip(t('tips.views.templateEditor.changeNote'))}>
          {t('views.templateEditor.changeNote')}
        </label>
        <input id="architect-prompt-note" value={form.changeNote} readOnly={!editable} onChange={(e) => setForm({ ...form, changeNote: e.target.value })} {...tip(t('tips.views.templateEditor.changeNote'))} />
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {errorMessage(t, error)}
        </div>
      )}
      <div className="flex gap-sm items-center">
        <button type="button" className="button-primary" onClick={save} disabled={busy} aria-disabled={deniedEdit ? 'true' : undefined} data-testid="architect-prompt-save" {...tip(deniedEdit || t('tips.studio.prompts.save'))}>
          {busy ? t('common.generic.saving') : t('common.actions.save')}
        </button>
        <span className="text-muted">{t('components.studio.prompts.nextTurn')}</span>
      </div>
      <div className="section-title" {...tip(t('tips.views.templateEditor.tabs.versions'))}>
        {t('views.templateEditor.versions', { count: versions.length })}
      </div>
      {versions.length === 0 ? (
        <div className="text-muted">{t('views.templateEditor.noVersions')}</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="architect-prompt-versions">
            <thead>
              <tr>
                <th scope="col" {...tip(t('tips.views.templateEditor.columns.version'))}>{t('views.templateEditor.version')}</th>
                <th scope="col" {...tip(t('tips.views.templateEditor.columns.note'))}>{t('views.templateEditor.note')}</th>
                <th scope="col" {...tip(t('tips.views.templateEditor.columns.author'))}>{t('views.templateEditor.author')}</th>
                <th scope="col" {...tip(t('tips.views.templateEditor.columns.saved'))}>{t('resources.promptTemplates.columns.lastUpdateUtc')}</th>
                <th scope="col" className="right" {...tip(t('tips.table.actionsColumn'))}>
                  {t('common.generic.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...versions]
                .sort((a, b) => b.version - a.version)
                .map((v) => (
                  <tr key={v.id || v.version}>
                    <td>v{v.version}</td>
                    <td>{v.changeNote || '-'}</td>
                    <td>{v.createdBy || '-'}</td>
                    <td>{formatDateTime(v.createdUtc, i18n.language)}</td>
                    <td className="actions-cell">
                      <button type="button" className="button-ghost button-sm" onClick={() => setDiffVersion(v)} {...tip(t('tips.views.templateEditor.diff'))}>
                        {t('views.templateEditor.diff')}
                      </button>
                      {editable && v.version !== template?.currentVersion && (
                        <button type="button" className="button-ghost button-sm" onClick={() => setRestore(v.version)} {...tip(t('tips.views.templateEditor.restore'))}>
                          {t('views.templateEditor.restore')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!diffVersion} size="xlarge" onClose={() => setDiffVersion(null)} title={t('views.templateEditor.diffTitle', { version: diffVersion?.version })}>
        {diffVersion && <DiffViewer before={diffVersion.content} after={form.content} beforeLabel={`v${diffVersion.version}`} afterLabel={t('views.templateEditor.current')} />}
      </Modal>
      <ConfirmModal
        open={restore !== null}
        title={t('views.templateEditor.confirm.restoreTitle')}
        message={t('views.templateEditor.confirm.restoreMessage', { version: restore, name: form.name })}
        onConfirm={doRestore}
        onCancel={() => setRestore(null)}
      />
    </div>
  );
}

/**
 * Architect prompts (AD7.16): the built-in architect prompts and the tenant's own, with clone, edit (name, description,
 * and body with a render preview and version history), reset for built-ins, delete, and select for the current
 * architect deployment (PUT /studio/architects/{deploymentId}/prompt), which takes effect on the architect's next
 * turn. Built-ins keep Edit and Delete visible but disabled with a tooltip that says to clone them. A delete refused
 * with 409 PromptTemplateInUse names the deployments that use the prompt.
 */
export default function ArchitectPromptPanel({ architect = null, deployments = [], denied = {} }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [entries, setEntries] = useState(null);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [cloning, setCloning] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [inUse, setInUse] = useState(null);
  const names = useMemo(() => new Map((deployments || []).map((d) => [d.id, d.name])), [deployments]);

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient
      .listArchitectPrompts(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((page) => {
        const list = page?.items || [];
        setEntries(sortArchitectPrompts(list));
        setError(null);
      })
      .catch((e) => {
        setEntries([]);
        setError(e);
      });
  }, [apiClient, tenantId]);

  const loadSelection = useCallback(() => {
    if (!apiClient || !architect?.id) {
      setSelection(null);
      return;
    }
    apiClient
      .getArchitectPrompt(tenantId, architect.id)
      .then(setSelection)
      .catch(() => setSelection(null));
  }, [apiClient, tenantId, architect?.id]);

  useEffect(load, [load]);
  useEffect(loadSelection, [loadSelection]);

  const select = async (entry) => {
    if (!architect || denied.select) return;
    try {
      const next = await apiClient.setArchitectPrompt(tenantId, architect.id, { architectPromptTemplateId: entry.id });
      setSelection(next);
      addToast({ type: 'success', message: t('components.studio.prompts.selected', { name: entry.name, architect: architect.name }) });
      load();
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const runConfirmed = async () => {
    const action = confirm;
    setConfirm(null);
    try {
      if (action.type === 'reset') {
        await apiClient.resetPromptTemplate(tenantId, action.entry.id);
        addToast({ type: 'success', message: t('views.templateEditor.resetDone') });
      } else {
        await apiClient.deletePromptTemplate(tenantId, action.entry.id);
        addToast({ type: 'success', message: t('common.toasts.deleted') });
        if (editing?.id === action.entry.id) setEditing(null);
      }
      setInUse(null);
      load();
    } catch (e) {
      if (e?.code === 'PromptTemplateInUse') {
        const fromMessage = inUseDeployments(e.body?.message || e.message);
        const listed = (action.entry.deployments || []).map((id) => names.get(id) || id);
        setInUse({ name: action.entry.name, deployments: fromMessage.length ? fromMessage : listed });
      } else {
        addToast({ type: 'error', message: errorMessage(t, e) });
      }
    }
  };

  const builtInTip = t('tips.studio.prompts.builtInLocked');
  const selectedId = selection?.architectPromptTemplateId || null;
  const disabled = (reason) => (reason ? { 'aria-disabled': 'true', 'data-denied': 'true' } : {});

  return (
    <section className="panel studio-prompts" aria-label={t('components.studio.prompts.title')} data-testid="architect-prompts">
      <div className="studio-row-between">
        <h3 className="section-title" {...tip(t('tips.studio.prompts.title'))}>
          {t('components.studio.prompts.title')}
        </h3>
        <StudioLink to={pathFor('promptTemplates', null, { search: 'architect' })} testId="architect-prompts-templates-link" tipText={t('tips.studio.prompts.templatesLink')}>
          {t('components.studio.prompts.templatesLink')}
        </StudioLink>
      </div>
      <p className="text-muted">
        {architect ? t('components.studio.prompts.forArchitect', { architect: architect.name }) : t('components.studio.prompts.noArchitect')} {t('components.studio.prompts.nextTurn')}
      </p>
      {selection && (
        <div className="info-banner" role="status" data-testid="architect-prompt-selection">
          {t(selection.architectPromptVersion ? 'components.studio.prompts.currentPinned' : 'components.studio.prompts.current', {
            architect: architect?.name,
            name: selection.architectPromptName,
            version: selection.architectPromptVersion ?? selection.currentVersion
          })}
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {errorMessage(t, error)}
        </div>
      )}
      {inUse && (
        <div className="warning-banner" role="alert" data-testid="architect-prompt-in-use">
          {t('components.studio.prompts.inUse', { name: inUse.name, deployments: inUse.deployments.join(', ') || '-' })}
        </div>
      )}
      {entries === null ? (
        <div className="text-muted">{t('common.generic.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="text-muted">{t('components.studio.prompts.empty')}</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="architect-prompts-table">
            <thead>
              <tr>
                {['name', 'description', 'version', 'usedBy'].map((c) => (
                  <th key={c} scope="col" className={c === 'version' ? 'right' : undefined} {...tip(t(`tips.studio.prompts.columns.${c}`))}>
                    {t(`components.studio.prompts.columns.${c}`)}
                  </th>
                ))}
                <th scope="col" className="right" {...tip(t('tips.table.actionsColumn'))}>
                  {t('common.generic.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const used = (entry.deployments || []).map((id) => names.get(id) || id);
                const isSelected = selectedId === entry.id;
                const editDenied = entry.isBuiltIn ? builtInTip : denied.editPrompt;
                const deleteDenied = entry.isBuiltIn ? builtInTip : denied.deletePrompt;
                const selectDenied = !architect ? t('tips.studio.prompts.selectNoArchitect') : denied.select;
                return (
                  <tr key={entry.id} data-prompt={entry.name}>
                    <td>
                      <span className="inline-meta">
                        <strong>{entry.name}</strong>
                        {entry.isBuiltIn && (
                          <Badge tone="info" tip={t('tips.badges.builtIn')}>
                            {t('common.generic.builtIn')}
                          </Badge>
                        )}
                        {entry.isDefault && (
                          <Badge tone="neutral" tip={t('tips.studio.prompts.defaultBadge')}>
                            {t('components.studio.prompts.default')}
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge tone="success" tip={t('tips.studio.prompts.selectedBadge', { architect: architect?.name || '' })}>
                            {t('components.studio.prompts.selectedBadge')}
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td>{entry.description || '-'}</td>
                    <td className="right">{formatNumber(entry.currentVersion ?? 1, {}, lng)}</td>
                    <td>{used.length ? <span {...tip(used.join(', '))}>{t('components.studio.prompts.usedBy', { total: used.length })}</span> : '-'}</td>
                    <td className="actions-cell nowrap">
                      <button
                        type="button"
                        className="button-ghost button-sm"
                        onClick={() => !selectDenied && !isSelected && select(entry)}
                        {...disabled(selectDenied || (isSelected ? 'selected' : ''))}
                        data-testid={`architect-prompt-select-${entry.name}`}
                        {...tip(selectDenied || t(isSelected ? 'tips.studio.prompts.alreadySelected' : 'tips.studio.prompts.select'))}
                      >
                        {t('components.studio.prompts.select')}
                      </button>
                      <button
                        type="button"
                        className="button-ghost button-sm"
                        onClick={() => !denied.clone && setCloning(entry)}
                        {...disabled(denied.clone)}
                        data-testid={`architect-prompt-clone-${entry.name}`}
                        {...tip(denied.clone || t('tips.studio.prompts.clone'))}
                      >
                        {t('common.actions.clone')}
                      </button>
                      <button
                        type="button"
                        className="button-ghost button-sm"
                        onClick={() => !editDenied && setEditing(entry)}
                        {...disabled(editDenied)}
                        data-testid={`architect-prompt-edit-${entry.name}`}
                        {...tip(editDenied || t('tips.studio.prompts.edit'))}
                      >
                        {t('common.actions.edit')}
                      </button>
                      {entry.isBuiltIn && (
                        <button type="button" className="button-ghost button-sm" onClick={() => setConfirm({ type: 'reset', entry })} data-testid={`architect-prompt-reset-${entry.name}`} {...tip(t('tips.views.templateEditor.reset'))}>
                          {t('views.templateEditor.reset')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="button-ghost button-sm"
                        onClick={() => !deleteDenied && setConfirm({ type: 'delete', entry })}
                        {...disabled(deleteDenied)}
                        data-testid={`architect-prompt-delete-${entry.name}`}
                        {...tip(deleteDenied || t('tips.studio.prompts.delete'))}
                      >
                        {t('common.actions.delete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editing && <PromptEditor key={editing.id} entry={editing} deniedEdit={denied.editPrompt} onSaved={load} onClose={() => setEditing(null)} />}
      {cloning && (
        <CloneTemplateModal
          template={cloning}
          onClose={() => setCloning(null)}
          onCloned={(created) => {
            setCloning(null);
            addToast({ type: 'success', message: t('common.toasts.cloned') });
            load();
            if (created?.id) setEditing({ id: created.id, name: created.name, description: created.description, currentVersion: created.currentVersion ?? 1, isBuiltIn: false });
          }}
        />
      )}
      <ConfirmModal
        open={!!confirm}
        danger={confirm?.type === 'delete'}
        title={t(confirm?.type === 'delete' ? 'views.templateEditor.confirm.deleteTitle' : 'views.templateEditor.confirm.resetTitle')}
        message={
          confirm?.type === 'delete'
            ? t('components.studio.prompts.deleteMessage', { name: confirm.entry.name, total: (confirm.entry.deployments || []).length })
            : t('views.templateEditor.confirm.resetMessage', { name: confirm?.entry?.name })
        }
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
