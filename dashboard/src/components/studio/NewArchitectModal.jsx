import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import CodeBlock from '../CodeBlock';
import { ErrorBanner } from '../States';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { pathFor } from '../../config/navConfig';
import { errorMessage } from '../../utils/errors';
import { ARCHITECT_AGENT, defaultArchitectPrompt, findArchitectAgent, sortArchitectPrompts } from '../../utils/studio';

/** Sample values the architect prompt preview renders with. */
const PREVIEW_CONTEXT = {
  tenant: { id: 'default', name: 'Default' },
  agent: { name: ARCHITECT_AGENT, displayName: 'Agent architect', description: '' },
  deployment: { name: 'architect', parameters: {} },
  garrison: { delegationEnabled: false },
  input: { message: '', parameters: {} }
};

/**
 * "New architect" (AD7.10, AD9.9): creates a deployment of agent-architect (looked up by name) on a chosen harness
 * profile and model, with the architect prompt chosen from GET /studio/architect-prompts (built-ins first, the default
 * builtin/agent-architect preselected), a rendered preview of that prompt, and a link to clone it on the Prompt
 * Templates screen. The choice goes as architectPromptTemplateId; the server gives the deployment managementAccess
 * Drafts. `onCreated(deployment)` receives the new deployment.
 */
export default function NewArchitectModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [agent, setAgent] = useState(undefined);
  const [profiles, setProfiles] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [form, setForm] = useState({ name: 'architect', harnessProfileId: '', model: '', promptId: '' });
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!apiClient) return;
    const page = { pageNumber: 1, pageSize: 1000 };
    apiClient
      .listAgents(tenantId, { ...page, search: ARCHITECT_AGENT })
      .then((r) => setAgent(findArchitectAgent(r.items)))
      .catch(() => setAgent(null));
    apiClient
      .listHarnessProfiles(tenantId, { ...page, includeBuiltIn: true })
      .then((r) => {
        const list = r.items || [];
        setProfiles(list);
        setForm((f) => (f.harnessProfileId || !list.length ? f : { ...f, harnessProfileId: list[0].id }));
      })
      .catch(() => setProfiles([]));
    apiClient
      .listArchitectPrompts(tenantId)
      .then((list) => {
        const sorted = sortArchitectPrompts(list);
        setPrompts(sorted);
        const preferred = defaultArchitectPrompt(sorted);
        setForm((f) => (f.promptId || !preferred ? f : { ...f, promptId: preferred.id }));
      })
      .catch(() => setPrompts([]));
  }, [apiClient, tenantId]);

  // Render the chosen prompt's current text with sample values.
  useEffect(() => {
    if (!apiClient || !form.promptId) return undefined;
    let cancelled = false;
    setPreviewError(null);
    apiClient
      .getPromptTemplate(tenantId, form.promptId)
      .then((tpl) => apiClient.renderTemplateContent(tenantId, { content: tpl?.content || '', context: PREVIEW_CONTEXT }))
      .then((r) => !cancelled && setPreview(r?.rendered ?? r?.text ?? (typeof r === 'string' ? r : '')))
      .catch((e) => !cancelled && setPreviewError(errorMessage(t, e)));
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId, form.promptId, t]);

  const chosen = useMemo(() => prompts.find((p) => p.id === form.promptId) || null, [prompts, form.promptId]);
  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setFieldErrors({ ...fieldErrors, [key]: undefined });
  };

  const submit = async () => {
    const errors = {};
    if (!form.name.trim()) errors.name = t('common.errors.required');
    if (!form.harnessProfileId) errors.harnessProfileId = t('common.errors.required');
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = { name: form.name.trim(), agentId: agent.id, harnessProfileId: form.harnessProfileId, managementAccess: 'Drafts' };
      if (form.model.trim()) body.model = form.model.trim();
      if (form.promptId) body.architectPromptTemplateId = form.promptId;
      const created = await apiClient.createDeployment(tenantId, body);
      onCreated?.(created);
    } catch (e) {
      setError(e);
      if (e?.fields) setFieldErrors(e.fields);
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, control, hint) => (
    <div className={`field${fieldErrors[key] ? ' has-error' : ''}`}>
      <label htmlFor={`architect-${key}`} {...tip(t(`tips.studio.architect.${key}`))}>
        {label}
      </label>
      {control}
      {hint && <div className="field-hint">{hint}</div>}
      {fieldErrors[key] && <div className="field-error">{fieldErrors[key]}</div>}
    </div>
  );

  return (
    <Modal
      open
      size="large"
      onClose={onClose}
      title={t('components.studio.architect.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy || !agent} data-testid="architect-create" {...tip(t(agent === null ? 'tips.studio.architect.noAgent' : 'tips.studio.architect.create'))}>
            {busy ? t('components.studio.architect.creating') : t('components.studio.architect.create')}
          </button>
        </>
      }
    >
      <div data-testid="new-architect">
        <p className="text-muted">{t('components.studio.architect.intro')}</p>
        {agent === null && (
          <div className="warning-banner" role="alert" data-testid="architect-no-agent">
            {t('components.studio.architect.noAgent', { name: ARCHITECT_AGENT })}
          </div>
        )}
        <div className="form-grid">
          {field('name', t('components.studio.architect.name'), <input id="architect-name" value={form.name} onChange={set('name')} {...tip(t('tips.studio.architect.name'))} />)}
          {field(
            'harnessProfileId',
            t('components.studio.architect.harnessProfile'),
            <select id="architect-harnessProfileId" value={form.harnessProfileId} onChange={set('harnessProfileId')} {...tip(t('tips.studio.architect.harnessProfileId'))}>
              <option value="">{t('components.studio.architect.chooseProfile')}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {field('model', t('components.studio.architect.model'), <input id="architect-model" value={form.model} placeholder="sonnet" onChange={set('model')} {...tip(t('tips.studio.architect.model'))} />, t('components.studio.architect.modelHint'))}
          {field(
            'promptId',
            t('components.studio.architect.prompt'),
            <select id="architect-promptId" value={form.promptId} onChange={set('promptId')} data-testid="architect-prompt" {...tip(t('tips.studio.architect.promptId'))}>
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isDefault ? t('components.studio.architect.defaultPrompt', { name: p.name }) : p.name}
                </option>
              ))}
            </select>,
            chosen?.description || null
          )}
        </div>
        <div className="studio-architect-preview">
          <div className="flex gap-sm items-center studio-row-between">
            <div className="section-title" {...tip(t('tips.studio.architect.preview'))}>
              {t('components.studio.architect.preview')}
            </div>
            {chosen && (
              <a href={pathFor('promptTemplates', chosen.id)} target="_blank" rel="noopener noreferrer" data-testid="architect-clone-link" {...tip(t('tips.studio.architect.cloneLink'))}>
                {t('components.studio.architect.cloneLink')}
              </a>
            )}
          </div>
          {previewError ? <div className="error-banner">{previewError}</div> : <CodeBlock value={preview || ''} emptyText={t('components.studio.architect.previewEmpty')} />}
        </div>
        {error && <ErrorBanner message={errorMessage(t, error)} />}
      </div>
    </Modal>
  );
}
