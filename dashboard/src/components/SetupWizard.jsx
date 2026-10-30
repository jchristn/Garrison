import { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { FormField } from './FormFields';
import CodeBlock from './CodeBlock';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ARCHITECT_AGENT_NAME, SAMPLE_MANIFEST, STORAGE_KEYS } from '../utils/constants';
import SecretKindGuide from './SecretKindGuide';
import { MULTILINE_SECRET_KINDS } from '../utils/secretGuides';
import { architectBody, architectFormErrors, blankArchitectForm } from '../utils/architect';
import { enumOptions } from '../utils/enums';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';

// The architect fields come with the studio chunk, loaded only when the Agent Studio step opens.
const ArchitectFields = lazy(() => import('./studio/ArchitectFields'));

const STEPS = ['welcome', 'secret', 'studio', 'manifest', 'invoke'];

/**
 * First-run setup: add a harness credential, give the agent architect a deployment (AD9.5, AD9.9: harness profile,
 * model, and architect prompt; the server gives it managementAccess Drafts), apply a sample manifest, and test-invoke
 * an agent. Every step but the welcome can be skipped, and the wizard can be relaunched from the sidebar.
 */
export default function SetupWizard() {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId, wizardOpen, setWizardOpen } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [secret, setSecret] = useState({ name: 'anthropic-api-key', kind: 'AnthropicApiKey', value: '' });
  const [manifest, setManifest] = useState(SAMPLE_MANIFEST);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Say hello and describe what you can do.');
  const [architectForm, setArchitectForm] = useState(blankArchitectForm);
  const [architectAgent, setArchitectAgent] = useState(undefined);
  const [architectErrors, setArchitectErrors] = useState({});
  const [architect, setArchitect] = useState(null);

  const close = (dismiss) => {
    if (dismiss) localStorage.setItem(`${STORAGE_KEYS.setupDismissed}:${tenantId}`, 'true');
    setWizardOpen(false);
    setStep(0);
    setResult(null);
  };

  const saveSecret = async () => {
    if (!secret.value) {
      setStep((s) => s + 1);
      return;
    }
    setBusy(true);
    try {
      await apiClient.createSecret(tenantId, { name: secret.name, kind: secret.kind, value: secret.value, active: true });
      addToast({ type: 'success', message: t('wizard.secretSaved') });
      setStep((s) => s + 1);
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setBusy(false);
    }
  };

  const changeArchitect = (patch) => {
    setArchitectForm((f) => ({ ...f, ...patch }));
    setArchitectErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }));
  };

  const createArchitect = async () => {
    if (architect) {
      setStep((s) => s + 1);
      return;
    }
    const errors = architectFormErrors(architectForm, t);
    setArchitectErrors(errors);
    if (Object.keys(errors).length || !architectAgent) return;
    setBusy(true);
    try {
      const created = await apiClient.createArchitect(tenantId, architectBody(architectForm));
      setArchitect(created || { name: architectForm.name });
      addToast({ type: 'success', message: t('wizard.architectCreated', { name: created?.name || architectForm.name }) });
      setStep((s) => s + 1);
    } catch (e) {
      if (e?.fields) setArchitectErrors(e.fields);
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setBusy(false);
    }
  };

  const applyManifest = async () => {
    setBusy(true);
    try {
      const r = await apiClient.applyManifest(tenantId, manifest, false);
      setResult(r);
      addToast({ type: 'success', message: t('views.manifests.applied') });
      setStep((s) => s + 1);
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setBusy(false);
    }
  };

  const testInvoke = async () => {
    setBusy(true);
    try {
      const agents = await apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 10, search: 'echo-agent' });
      const agent = (agents.items || [])[0];
      if (!agent) throw new Error(t('wizard.noAgent'));
      const run = await apiClient.invokeAgent(tenantId, agent.id, { input: message }, { wait: false });
      const id = run?.id || run?.run?.id;
      close(true);
      if (id) navigate(pathFor('runs', id));
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setBusy(false);
    }
  };

  const current = STEPS[step];
  return (
    <Modal
      open={wizardOpen}
      onClose={() => close(false)}
      size="large"
      title={t('wizard.title')}
      headerMeta={t('wizard.stepOf', { step: step + 1, total: STEPS.length })}
      footer={
        <>
          <button type="button" className="button-ghost" onClick={() => close(true)} {...tip(t('tips.wizard.skip'))}>
            {t('wizard.skip')}
          </button>
          {step > 0 && (
            <button type="button" className="button-secondary" onClick={() => setStep((s) => s - 1)} disabled={busy} {...tip(t('tips.wizard.back'))}>
              {t('common.actions.back')}
            </button>
          )}
          {current === 'welcome' && (
            <button type="button" className="button-primary" onClick={() => setStep(1)} {...tip(t('tips.wizard.start'))}>
              {t('wizard.start')}
            </button>
          )}
          {current === 'secret' && (
            <button type="button" className="button-primary" onClick={saveSecret} disabled={busy} {...tip(t(secret.value ? 'tips.wizard.saveSecret' : 'tips.wizard.skipStep'))}>
              {secret.value ? t('wizard.saveSecret') : t('wizard.skipStep')}
            </button>
          )}
          {current === 'studio' && !architect && (
            <button type="button" className="button-secondary" onClick={() => setStep((s) => s + 1)} disabled={busy} data-testid="wizard-skip-studio" {...tip(t('tips.wizard.skipStudio'))}>
              {t('wizard.skipStep')}
            </button>
          )}
          {current === 'studio' && (
            <button
              type="button"
              className="button-primary"
              onClick={createArchitect}
              disabled={busy || (!architect && !architectAgent)}
              data-testid="wizard-create-architect"
              {...tip(t(architect ? 'tips.wizard.continue' : architectAgent === null ? 'tips.studio.architect.noAgent' : 'tips.wizard.createArchitect'))}
            >
              {architect ? t('wizard.continue') : busy ? t('components.studio.architect.creating') : t('wizard.createArchitect')}
            </button>
          )}
          {current === 'manifest' && (
            <button type="button" className="button-primary" onClick={applyManifest} disabled={busy} {...tip(t('tips.wizard.apply'))}>
              {t('views.manifests.apply')}
            </button>
          )}
          {current === 'invoke' && (
            <button type="button" className="button-primary" onClick={testInvoke} disabled={busy} {...tip(t('tips.wizard.invoke'))}>
              {t('wizard.invoke')}
            </button>
          )}
        </>
      }
    >
      <ol className="wizard-steps" aria-label={t('wizard.title')}>
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''}>
            {t(`wizard.steps.${s}`)}
          </li>
        ))}
      </ol>
      {current === 'welcome' && (
        <div className="wizard-body">
          <p>{t('wizard.welcomeBody')}</p>
          <ul className="plain-list">
            <li>{t('wizard.welcomeItem1')}</li>
            <li>{t('wizard.welcomeItemStudio')}</li>
            <li>{t('wizard.welcomeItem2')}</li>
            <li>{t('wizard.welcomeItem3')}</li>
          </ul>
        </div>
      )}
      {current === 'secret' && (
        <div className="wizard-body form-grid">
          <p className="span-full">{t('wizard.secretBody')}</p>
          <FormField id="wiz-secret-name" field={{ name: 'name', type: 'text', label: t('resources.secrets.fields.name'), required: true, tip: t('tips.wizard.secretName') }} value={secret.name} onChange={(v) => setSecret({ ...secret, name: v })} />
          <FormField id="wiz-secret-kind" field={{ name: 'kind', type: 'select', label: t('resources.secrets.fields.kind'), required: true, options: enumOptions(t, 'secretKind'), tip: t('tips.resources.secrets.kind') }} value={secret.kind} onChange={(v) => setSecret({ ...secret, kind: v })} />
          <div className="span-full">
            <SecretKindGuide kind={secret.kind} />
          </div>
          <FormField id="wiz-secret-value" field={{ name: 'value', type: MULTILINE_SECRET_KINDS.includes(secret.kind) ? 'code' : 'password', rows: 8, label: t('resources.secrets.fields.value'), span: 'full', tip: t('tips.resources.secrets.value') }} value={secret.value} onChange={(v) => setSecret({ ...secret, value: v })} />
        </div>
      )}
      {current === 'studio' && (
        <div className="wizard-body" data-testid="wizard-studio">
          <p>{t('wizard.studioBody')}</p>
          {architect ? (
            <div className="info-banner" role="status" data-testid="wizard-architect-created">
              {t('wizard.architectReady', { name: architect.name || architectForm.name })}
            </div>
          ) : (
            <>
              {architectAgent === null && (
                <div className="warning-banner" role="alert" data-testid="architect-no-agent">
                  {t('components.studio.architect.noAgent', { name: ARCHITECT_AGENT_NAME })}
                </div>
              )}
              <Suspense fallback={<p className="text-muted">{t('common.generic.loading')}</p>}>
                <ArchitectFields form={architectForm} onChange={changeArchitect} fieldErrors={architectErrors} onAgent={setArchitectAgent} idPrefix="wiz-architect" />
              </Suspense>
            </>
          )}
        </div>
      )}
      {current === 'manifest' && (
        <div className="wizard-body">
          <p>{t('wizard.manifestBody')}</p>
          <textarea className="monospace template-textarea" rows={14} value={manifest} onChange={(e) => setManifest(e.target.value)} aria-label={t('views.manifests.document')} {...tip(t('tips.wizard.manifest'))} />
        </div>
      )}
      {current === 'invoke' && (
        <div className="wizard-body">
          <p>{t('wizard.invokeBody')}</p>
          {result && <CodeBlock value={result} prettyJson />}
          <FormField id="wiz-message" field={{ name: 'message', type: 'textarea', label: t('views.invoke.message'), tip: t('tips.wizard.message') }} value={message} onChange={setMessage} />
        </div>
      )}
    </Modal>
  );
}
