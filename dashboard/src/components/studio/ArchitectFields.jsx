import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CodeBlock from '../CodeBlock';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { pathFor } from '../../config/navConfig';
import { errorMessage } from '../../utils/errors';
import { ARCHITECT_AGENT, defaultArchitectPrompt, findArchitectAgent, needsCredential, sortArchitectPrompts, suggestedCredential } from '../../utils/studio';

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
  const [secrets, setSecrets] = useState([]);
  // Once the person picks a credential (or None), the harness profile no longer changes it.
  const credentialTouched = useRef(false);
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
    apiClient
      .listHarnessProfiles(tenantId, { ...page, includeBuiltIn: true })
      .then((r) => {
        if (!active) return;
        const list = r.items || [];
        setProfiles(list);
        if (!formRef.current.harnessProfileId && list.length) changeRef.current({ harnessProfileId: list[0].id });
      })
      .catch(() => active && setProfiles([]));
    apiClient
      .listSecrets(tenantId, page)
      .then((r) => active && setSecrets((r.items || []).filter((x) => x.active !== false)))
      .catch(() => active && setSecrets([]));
    apiClient
      .listArchitectPrompts(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((page) => {
        const list = page?.items || [];
        if (!active) return;
        const sorted = sortArchitectPrompts(list);
        setPrompts(sorted);
        const preferred = defaultArchitectPrompt(sorted);
        if (!formRef.current.promptId && preferred) changeRef.current({ promptId: preferred.id });
      })
      .catch(() => active && setPrompts([]));
    return () => {
      active = false;
    };
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

  const profile = useMemo(() => profiles.find((p) => p.id === form.harnessProfileId) || null, [profiles, form.harnessProfileId]);
  // Suggest the secret the chosen harness signs in with (an AnthropicApiKey for Claude Code, and so on).
  useEffect(() => {
    if (credentialTouched.current || !profile) return;
    const suggested = suggestedCredential(secrets, profile.harnessType);
    const next = suggested ? suggested.id : '';
    if (next !== (formRef.current.credentialSecretId || '')) changeRef.current({ credentialSecretId: next });
  }, [profile, secrets]);
  const missingCredential = !!profile && needsCredential(profile.harnessType) && !form.credentialSecretId;

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
        {field('name', t('components.studio.architect.name'), <input id={id('name')} value={form.name} onChange={set('name')} {...tip(t('tips.studio.architect.name'))} />)}
        {field(
          'harnessProfileId',
          t('components.studio.architect.harnessProfile'),
          <select id={id('harnessProfileId')} value={form.harnessProfileId} onChange={set('harnessProfileId')} data-testid="architect-profile" {...tip(t('tips.studio.architect.harnessProfileId'))}>
            <option value="">{t('components.studio.architect.chooseProfile')}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {field(
          'credentialSecretId',
          t('components.studio.architect.credential'),
          <select
            id={id('credentialSecretId')}
            value={form.credentialSecretId || ''}
            onChange={(e) => {
              credentialTouched.current = true;
              onChange({ credentialSecretId: e.target.value });
            }}
            data-testid="architect-credential"
            {...tip(t('tips.studio.architect.credentialSecretId'))}
          >
            <option value="">{t('components.studio.architect.noCredential')}</option>
            {secrets.map((x) => (
              <option key={x.id} value={x.id}>
                {t('components.studio.architect.credentialOption', { name: x.name, kind: x.kind })}
              </option>
            ))}
          </select>,
          missingCredential ? (
            <span className="field-warning" data-testid="architect-credential-missing">
              {t('components.studio.architect.credentialMissing', { profile: profile?.name || '' })}{' '}
              <a href={pathFor('secrets')} target="_blank" rel="noopener noreferrer" {...tip(t('tips.studio.architect.addSecret'))}>
                {t('components.studio.architect.addSecret')}
              </a>
            </span>
          ) : (
            t('components.studio.architect.credentialHint')
          )
        )}
        {field('model', t('components.studio.architect.model'), <input id={id('model')} value={form.model} placeholder="sonnet" onChange={set('model')} data-testid="architect-model" {...tip(t('tips.studio.architect.model'))} />, t('components.studio.architect.modelHint'))}
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
    </>
  );
}
