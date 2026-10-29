import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { Badge } from './StatusBadge';
import { ErrorBanner } from './States';
import { PlusIcon, TrashIcon } from './Icons';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel, enumList } from '../utils/enums';
import { capabilityDraftBody, catalogNames, cleanNames, revisionCapabilities, sameNames } from '../utils/capabilities';

/**
 * Choose the capabilities an agent's draft revision uses (AD4.8), by name from the capability catalog. `revision` is the
 * open draft, or the latest published revision when there is no draft: saving then starts a new draft from it. Saving
 * sends the complete content of `revision` with only `capabilities` changed to POST /agents/{id}/revisions. A harness
 * built-in named here adds its node label to the agent's runs, so they go only to workers that reported the tool.
 */
export default function AgentCapabilitiesModal({ agent, revision, onClose, onSaved }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [names, setNames] = useState(() => revisionCapabilities(revision));
  const [catalog, setCatalog] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const isDraft = revision.state === 'Draft';

  useEffect(() => {
    let active = true;
    apiClient
      .listCapabilities(tenantId, {})
      .then((r) => {
        if (!active) return;
        setCatalog(catalogNames(r.items || []));
        setLoaded(true);
      })
      .catch((e) => {
        if (!active) return;
        setError(e);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  const kindsOf = (name) => catalog.find((c) => c.name === name)?.kinds || [];
  const available = catalog.filter((c) => !names.includes(c.name));
  const unchanged = sameNames(names, revisionCapabilities(revision));

  const add = () => {
    if (!choice) return;
    setNames((prev) => cleanNames([...prev, choice]));
    setChoice('');
  };
  const remove = (name) => setNames((prev) => prev.filter((n) => n !== name));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await apiClient.saveAgentDraft(tenantId, agent.id, capabilityDraftBody(revision, names));
      addToast({ type: 'success', message: t('components.capabilities.draftSaved', { number: saved?.number ?? revision.number }) });
      onSaved?.(saved);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose()}
      title={t('components.capabilities.draftTitle')}
      headerMeta={agent.name}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={save} disabled={busy || unchanged} data-testid="revision-capabilities-save" {...tip(t('tips.capabilities.draftSave'))}>
            {busy ? t('common.generic.saving') : t('components.capabilities.draftSave')}
          </button>
        </>
      }
    >
      {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />}
      <p className="field-hint" data-testid="revision-capabilities-source">
        {isDraft ? t('components.capabilities.draftEdit', { number: revision.number }) : t('components.capabilities.draftNew', { number: revision.number })}
      </p>
      <p className="field-hint">{t('components.capabilities.draftPlacementHint')}</p>
      {names.length === 0 && <p className="text-muted">{t('components.capabilities.draftEmpty')}</p>}
      <div data-testid="revision-capability-list">
        {names.map((name) => {
          const kinds = kindsOf(name);
          return (
            <div className="capability-row" key={name} data-capability={name}>
              <span className="capability-row-name">
                <code>{name}</code>
                {kinds.map((k) => (
                  <Badge key={k} tone="info" tip={t(`tips.enums.capabilityKind.${k}`)}>
                    {enumLabel(t, 'capabilityKind', k)}
                  </Badge>
                ))}
                {loaded && !kinds.length && (
                  <Badge tone="warning" tip={t('tips.capabilities.notInCatalog')}>
                    {t('components.capabilities.notInCatalog')}
                  </Badge>
                )}
              </span>
              <button type="button" className="button-ghost button-sm" onClick={() => remove(name)} aria-label={t('components.capabilities.removeName', { name })} data-testid="revision-capability-remove" {...tip(t('tips.capabilities.removeName'))}>
                <TrashIcon size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="capability-add">
        <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label={t('components.capabilities.chooseName')} data-testid="revision-capability-choice" {...tip(t('tips.capabilities.chooseName'))}>
          <option value="">{t('components.capabilities.chooseName')}</option>
          {available.map((c) => (
            <option key={c.name} value={c.name}>
              {t('components.capabilities.nameOption', { name: c.name, kinds: enumList(t, 'capabilityKind', c.kinds) })}
            </option>
          ))}
        </select>
        <button type="button" className="button-secondary button-sm" onClick={add} disabled={!choice} data-testid="revision-capability-add" {...tip(t('tips.capabilities.addName'))}>
          <PlusIcon size={14} /> {t('components.capabilities.addName')}
        </button>
      </div>
    </Modal>
  );
}
