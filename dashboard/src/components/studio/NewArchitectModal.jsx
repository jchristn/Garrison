import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import ArchitectFields from './ArchitectFields';
import { ErrorBanner } from '../States';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { errorMessage } from '../../utils/errors';
import { ARCHITECT_AGENT, architectBody, architectFormErrors, blankArchitectForm } from '../../utils/studio';

/**
 * "New architect" (AD7.10, AD9.9): creates an agent architect (POST /studio/architects; the agent-architect agent is
 * looked up by name only to warn when the tenant has none) on a chosen harness profile and model, with the architect prompt chosen from GET /studio/architect-prompts (built-ins first, the default
 * builtin/agent-architect preselected), a rendered preview of that prompt, and a link to clone it on the Prompt
 * Templates screen (the fields are ArchitectFields, shared with the setup wizard and the Architects page). The choice
 * goes as architectPromptTemplateId. `onCreated(architect)` receives the new architect.
 */
export default function NewArchitectModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [agent, setAgent] = useState(undefined);
  const [form, setForm] = useState(blankArchitectForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const change = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setFieldErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }));
  };

  const submit = async () => {
    const errors = architectFormErrors(form, t);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await apiClient.createArchitect(tenantId, architectBody(form));
      onCreated?.(created);
    } catch (e) {
      setError(e);
      if (e?.fields) setFieldErrors(e.fields);
    } finally {
      setBusy(false);
    }
  };

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
        <ArchitectFields form={form} onChange={change} fieldErrors={fieldErrors} onAgent={setAgent} />
        {error && <ErrorBanner message={errorMessage(t, error)} />}
      </div>
    </Modal>
  );
}
