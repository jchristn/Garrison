import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import FormFields from '../components/FormFields';
import CodeBlock from '../components/CodeBlock';
import DiffViewer from '../components/DiffViewer';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Modal from '../components/Modal';
import Tabs from '../components/Tabs';
import Explainer from '../components/Explainer';
import { LoadingState, ErrorBanner } from '../components/States';
import { Badge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { extractVariables } from '../utils/templates';
import { formatDateTime } from '../i18n/formatters';
import { tip } from '../components/Tooltip';
import { resourceTip } from '../utils/tips';

const SAMPLE_CONTEXT = {
  tenant: { id: 'default', name: 'Default' },
  agent: { name: 'example-agent', description: 'Example agent' },
  deployment: { name: 'example-deployment', model: 'sonnet', parameters: {} },
  run: { id: 'run_example', depth: 0, workspaceDir: '$GARRISON_WORKSPACE_DIR', configDir: '$GARRISON_CONFIG_DIR', homeDir: '$GARRISON_HOME_DIR' },
  input: { message: 'Summarize the repository README.', parameters: {} },
  caller: { principalType: 'User', displayName: 'admin@garrison' },
  resources: { mcpServers: [] }
};

/** Prompt template editor: content with variable list, live render preview, versions with diff and restore, clone, reset. */
export default function PromptTemplateEditorView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isNew = recordId === 'new';

  const [template, setTemplate] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', kind: 'Task', content: '', changeNote: '' });
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('preview');
  const [contextText, setContextText] = useState(JSON.stringify(SAMPLE_CONTEXT, null, 2));
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [diffVersion, setDiffVersion] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const debouncedContent = useDebounce(form.content, 500);
  const debouncedContext = useDebounce(contextText, 500);

  const load = useCallback(() => {
    if (isNew || !apiClient) return;
    apiClient
      .getPromptTemplate(tenantId, recordId)
      .then((tpl) => {
        setTemplate(tpl);
        setForm({ name: tpl.name, description: tpl.description || '', kind: tpl.kind || 'Task', content: tpl.content || '', changeNote: '' });
        setError(null);
      })
      .catch(setError);
    apiClient
      .listPromptTemplateVersions(tenantId, recordId)
      .then((r) => setVersions(Array.isArray(r) ? r : r?.objects || r?.items || []))
      .catch(() => setVersions([]));
  }, [apiClient, tenantId, recordId, isNew]);

  useEffect(load, [load]);

  const readOnly = !!template?.isBuiltIn;
  const variables = useMemo(() => extractVariables(form.content), [form.content]);

  useEffect(() => {
    if (!apiClient || tab !== 'preview') return;
    let context;
    try {
      context = JSON.parse(debouncedContext);
    } catch {
      setPreviewError(t('common.errors.invalidJson'));
      return;
    }
    apiClient
      .renderTemplateContent(tenantId, { content: debouncedContent, context })
      .then((r) => {
        setPreview(r);
        setPreviewError(null);
      })
      .catch((e) => setPreviewError(errorMessage(t, e)));
  }, [apiClient, tenantId, debouncedContent, debouncedContext, tab, t]);

  const save = async () => {
    if (!form.name) {
      addToast({ type: 'error', message: t('common.errors.required') });
      return;
    }
    setBusy(true);
    try {
      const body = { name: form.name, description: form.description, kind: form.kind, content: form.content, changeNote: form.changeNote || undefined };
      if (isNew) {
        const created = await apiClient.createPromptTemplate(tenantId, body);
        addToast({ type: 'success', message: t('common.toasts.created') });
        if (created?.id) navigate(pathFor('promptTemplates', created.id), { replace: true });
      } else {
        await apiClient.updatePromptTemplate(tenantId, recordId, body);
        addToast({ type: 'success', message: t('views.templateEditor.savedVersion') });
        load();
      }
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setBusy(false);
    }
  };

  const runConfirmed = async () => {
    const action = confirm;
    setConfirm(null);
    try {
      if (action.type === 'restore') {
        await apiClient.restorePromptTemplateVersion(tenantId, recordId, action.version);
        addToast({ type: 'success', message: t('views.templateEditor.restored', { version: action.version }) });
      } else if (action.type === 'reset') {
        await apiClient.resetPromptTemplate(tenantId, recordId);
        addToast({ type: 'success', message: t('views.templateEditor.resetDone') });
      } else if (action.type === 'delete') {
        await apiClient.deletePromptTemplate(tenantId, recordId);
        addToast({ type: 'success', message: t('common.toasts.deleted') });
        navigate(pathFor('promptTemplates'));
        return;
      }
      load();
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const clone = async () => {
    try {
      const created = await apiClient.clonePromptTemplate(tenantId, recordId, { name: `${form.name.replace(/^builtin\//, '')}-custom` });
      addToast({ type: 'success', message: t('common.toasts.cloned') });
      if (created?.id) navigate(pathFor('promptTemplates', created.id));
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  if (!isNew && !template && !error) return <LoadingState />;

  const fields = [
    { name: 'name', type: 'text', label: t('resources.promptTemplates.fields.name'), tip: resourceTip(t, 'promptTemplates', 'name'), required: true, readOnly: readOnly || !isNew },
    { name: 'kind', type: 'select', label: t('resources.promptTemplates.fields.kind'), tip: resourceTip(t, 'promptTemplates', 'kind'), required: true, options: ENUMS.promptTemplateKind, optionLabel: (v) => t(`enums.promptTemplateKind.${v}`, { defaultValue: v }), readOnly },
    { name: 'description', type: 'text', label: t('resources.promptTemplates.fields.description'), tip: resourceTip(t, 'promptTemplates', 'description'), readOnly, span: 'full' }
  ];

  return (
    <div>
      <PageHeader
        title={isNew ? t('views.templateEditor.newTitle') : form.name}
        subtitle={
          isNew ? (
            t('views.templateEditor.subtitle')
          ) : (
            <span className="inline-meta">
              <Badge tone={readOnly ? 'info' : 'neutral'} tip={t(readOnly ? 'tips.badges.builtIn' : 'tips.badges.custom')}>{readOnly ? t('common.generic.builtIn') : t('common.generic.custom')}</Badge> v{template?.currentVersion ?? 1}
              {readOnly && <span className="text-muted"> {t('views.templateEditor.builtInNote')}</span>}
            </span>
          )
        }
        actions={
          <>
            {!isNew && (
              <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.actions.viewJson'))}>
                {t('common.actions.viewJson')}
              </button>
            )}
            {!isNew && (
              <button type="button" className="button-secondary" onClick={clone} {...tip(t('tips.views.templateEditor.clone'))}>
                {t('common.actions.clone')}
              </button>
            )}
            {readOnly && (
              <button type="button" className="button-secondary" onClick={() => setConfirm({ type: 'reset' })} {...tip(t('tips.views.templateEditor.reset'))}>
                {t('views.templateEditor.reset')}
              </button>
            )}
            {!isNew && !readOnly && (
              <button type="button" className="button-danger" onClick={() => setConfirm({ type: 'delete' })} {...tip(t('tips.views.templateEditor.delete'))}>
                {t('common.actions.delete')}
              </button>
            )}
            {!readOnly && (
              <button type="button" className="button-primary" onClick={save} disabled={busy} data-testid="template-save" {...tip(t(isNew ? 'tips.views.templateEditor.create' : 'tips.views.templateEditor.save'))}>
                {busy ? t('common.generic.saving') : t('common.actions.save')}
              </button>
            )}
          </>
        }
      />
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      <Explainer topic="promptTemplates" />

      <div className="panel">
        <FormFields fields={fields} data={form} onChange={setForm} idPrefix="tpl" />
      </div>

      <div className="editor-layout">
        <section className="panel editor-main" aria-label={t('views.templateEditor.content')}>
          <label htmlFor="tpl-content" className="section-title" {...tip(t('tips.views.templateEditor.content'))}>
            {t('views.templateEditor.content')}
          </label>
          <textarea id="tpl-content" {...tip(t('tips.views.templateEditor.content'))} className="monospace template-textarea" spellCheck={false} value={form.content} readOnly={readOnly} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={20} />
          {!readOnly && !isNew && (
            <div className="field">
              <label htmlFor="tpl-note" {...tip(t('tips.views.templateEditor.changeNote'))}>{t('views.templateEditor.changeNote')}</label>
              <input id="tpl-note" {...tip(t('tips.views.templateEditor.changeNote'))} value={form.changeNote} onChange={(e) => setForm({ ...form, changeNote: e.target.value })} />
            </div>
          )}
          <div className="field-hint">{t('views.templateEditor.syntaxHint')}</div>
        </section>
        <aside className="panel editor-side" aria-label={t('views.templateEditor.variables')}>
          <h3 className="section-title">{t('views.templateEditor.variables')}</h3>
          {variables.length === 0 ? (
            <div className="text-muted">{t('views.templateEditor.noVariables')}</div>
          ) : (
            <ul className="plain-list">
              {variables.map((v) => (
                <li key={v}>
                  <code>{v}</code>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Tabs
        label={t('views.templateEditor.content')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'preview', label: t('views.templateEditor.preview'), tip: t('tips.views.templateEditor.tabs.preview') },
          { id: 'versions', label: t('views.templateEditor.versions', { count: versions.length }), tip: t('tips.views.templateEditor.tabs.versions') }
        ]}
      />
      <div className="panel">
        {tab === 'preview' && (
          <div className="preview-layout">
            <div className="field">
              <label htmlFor="tpl-context" {...tip(t('tips.views.templateEditor.sampleContext'))}>{t('views.templateEditor.sampleContext')}</label>
              <textarea id="tpl-context" {...tip(t('tips.views.templateEditor.sampleContext'))} className="monospace" rows={14} spellCheck={false} value={contextText} onChange={(e) => setContextText(e.target.value)} />
            </div>
            <div>
              <div className="section-title">{t('views.templateEditor.rendered')}</div>
              {previewError ? <div className="error-banner">{previewError}</div> : <CodeBlock value={preview?.rendered ?? preview?.text ?? (typeof preview === 'string' ? preview : '')} emptyText={t('views.templateEditor.previewEmpty')} />}
              {preview?.missingVariables?.length > 0 && <div className="warning-banner">{t('views.templateEditor.missing', { list: preview.missingVariables.join(', ') })}</div>}
            </div>
          </div>
        )}
        {tab === 'versions' &&
          (versions.length === 0 ? (
            <div className="text-muted">{t('views.templateEditor.noVersions')}</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
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
                  {[...versions].sort((a, b) => b.version - a.version).map((v) => (
                    <tr key={v.id || v.version}>
                      <td>v{v.version}</td>
                      <td>{v.changeNote || '-'}</td>
                      <td>{v.createdBy || '-'}</td>
                      <td>{formatDateTime(v.createdUtc, i18n.language)}</td>
                      <td className="actions-cell">
                        <button type="button" className="button-ghost button-sm" onClick={() => setDiffVersion(v)} {...tip(t('tips.views.templateEditor.diff'))}>
                          {t('views.templateEditor.diff')}
                        </button>
                        {!readOnly && v.version !== template?.currentVersion && (
                          <button type="button" className="button-ghost button-sm" onClick={() => setConfirm({ type: 'restore', version: v.version })} {...tip(t('tips.views.templateEditor.restore'))}>
                            {t('views.templateEditor.restore')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      <Modal open={!!diffVersion} size="xlarge" onClose={() => setDiffVersion(null)} title={t('views.templateEditor.diffTitle', { version: diffVersion?.version })}>
        {diffVersion && <DiffViewer before={diffVersion.content} after={form.content} beforeLabel={`v${diffVersion.version}`} afterLabel={t('views.templateEditor.current')} />}
      </Modal>
      <ConfirmModal
        open={!!confirm}
        danger={confirm?.type === 'delete'}
        title={t(`views.templateEditor.confirm.${confirm?.type || 'reset'}Title`)}
        message={t(`views.templateEditor.confirm.${confirm?.type || 'reset'}Message`, { version: confirm?.version, name: form.name })}
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
      <JsonViewerModal open={jsonOpen} value={template} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
