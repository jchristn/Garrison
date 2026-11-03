import { isConnection } from '../../utils/runtimeProfiles';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HarnessRuntimeSummary } from '../HarnessRuntimeFields';
import CodeBlock from '../CodeBlock';
import { architectPromptHint, harnessProfileHint } from '../ArchitectHints';
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
 * The fields that create an agent architect (AD7.10, AD9.5, AD9.9), shared by the studio's New architect dialog and
 * the setup wizard's Agent Studio step. It looks up the agent-architect agent by name (reported through
 * `onAgent(agent)`, null when the tenant has none), lists harness profiles (the first one preselected) and the
 * architect prompts from GET /studio/architect-prompts (built-ins first, the default builtin/agent-architect
 * preselected), renders the chosen prompt with sample values, and links to its page on Prompt Templates to clone it.
 * It also offers the tenant's secrets as the credential the harness signs in with, preselecting one whose kind fits
 * the chosen harness profile and warning when the harness needs one and none is chosen. The form is controlled: `form`
 * holds { name, harnessProfileId, model, credentialSecretId, promptId } and `onChange(patch)` updates it.
 */
export default function ArchitectFields({ form, onChange, fieldErrors = {}, onAgent, idPrefix = 'architect' }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [profiles, setProfiles] = useState([]);
  const [prompts, setPrompts] = useState([]);
  // Once the person picks a credential (or None), the harness profile no longer changes it.
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const agentRef = useRef(onAgent);
  agentRef.current = onAgent;
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!apiClient) return undefined;
    let active = true;
    const page = { pageNumber: 1, pageSize: 1000 };
    apiClient
      .listAgents(tenantId, { ...page, search: ARCHITECT_AGENT })
      .then((r) => active && agentRef.current?.(findArchitectAgent(r.items)))
      .catch(() => active && agentRef.current?.(null));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  // Harness profiles, secrets, and architect prompts are made on other pages; read them now, again on Refresh list,
  // and again when the person comes back to this tab after adding one there.
  const loadLists = useCallback(() => {
    if (!apiClient) return;
    const page = { pageNumber: 1, pageSize: 1000 };
    apiClient
      .listHarnessProfiles(tenantId, { ...page, includeBuiltIn: true })
      .then((r) => {
        const list = (r.items || []).filter((p) => isConnection(p) && p.active !== false);
        setProfiles(list);
        if (!formRef.current.harnessProfileId && list.length) changeRef.current({ harnessProfileId: list[0].id });
      })
      .catch(() => setProfiles([]));
    apiClient
      .listArchitectPrompts(tenantId, page)
      .then((result) => {
        const sorted = sortArchitectPrompts(result?.items || []);
        setPrompts(sorted);
        const preferred = defaultArchitectPrompt(sorted);
        if (!formRef.current.promptId && preferred) changeRef.current({ promptId: preferred.id });
      })
      .catch(() => setPrompts([]));
  }, [apiClient, tenantId]);
  useEffect(() => {
    loadLists();
    window.addEventListener('focus', loadLists);
    return () => window.removeEventListener('focus', loadLists);
  }, [loadLists]);

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

  const profile = useMemo(() => profiles.find((p) => p.id === form.harnessProfileId) || null, [profiles, form.harnessProfileId]);
  useEffect(() => {
    if (profile && (formRef.current.usesSavedRuntime !== isConnection(profile))) changeRef.current({ isMux: false, isProviderApi: false, usesSavedRuntime: isConnection(profile) });
  }, [profile]);
  const chosen = useMemo(() => prompts.find((p) => p.id === form.promptId) || null, [prompts, form.promptId]);
  const set = (key) => (e) => onChange({ [key]: e.target.value });
  const id = (key) => `${idPrefix}-${key}`;

  const field = (key, label, control, hint) => (
    <div className={`field${fieldErrors[key] ? ' has-error' : ''}`}>
      <label htmlFor={id(key)} {...tip(t(`tips.studio.architect.${key}`))}>
        {label}
      </label>
      {control}
      {hint && <div className="field-hint">{hint}</div>}
      {fieldErrors[key] && <div className="field-error">{fieldErrors[key]}</div>}
    </div>
  );

  return (
    <>
      <div className="form-grid">
        {field('name', t('resources.architects.fields.name'), <input id={id('name')} value={form.name} onChange={set('name')} {...tip(t('tips.studio.architect.name'))} />)}
        {field(
          'harnessProfileId',
          t('components.studio.architect.harnessProfile'),
          <select id={id('harnessProfileId')} value={form.harnessProfileId} onChange={set('harnessProfileId')} data-testid="architect-profile" {...tip(t('tips.studio.architect.harnessProfileId'))}>
            <option value="">{t('components.studio.architect.chooseProfile')}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.harnessType === 'ProviderApi' ? `${p.name} (Ollama / OpenAI)` : p.name}
              </option>
            ))}
          </select>,
          harnessProfileHint(t)
        )}
        <HarnessRuntimeSummary profile={profile} showManage={false} />
      </div>
      <details className="connection-advanced"><summary>{t('runtime.advancedArchitect')}</summary>
      <div className="form-grid">
        {field(
          'promptId',
          t('components.studio.architect.prompt'),
          <select id={id('promptId')} value={form.promptId} onChange={set('promptId')} data-testid="architect-prompt" {...tip(t('tips.studio.architect.promptId'))}>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isDefault ? t('components.studio.architect.defaultPrompt', { name: p.name }) : p.name}
              </option>
            ))}
          </select>,
          architectPromptHint(t, chosen?.description || '')
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
      </details>
    </>
  );
}
