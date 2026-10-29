import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { PlusIcon, TrashIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { cleanPins, draftBody, revisionPins, samePins } from '../utils/assets';

let nextKey = 0;
const withKey = (pin) => ({ ...pin, key: ++nextKey });

/**
 * Edit the asset pins of an agent's draft (AD2.8). `revision` is the open draft, or the latest published revision when
 * there is no draft: saving then starts a new draft from it. Each pin names an asset and either a version number or
 * "current" (the asset's current version when a run starts). Saving sends the complete content of `revision` with only
 * assetPins changed to POST /agents/{id}/revisions.
 */
export default function AgentAssetPinsModal({ agent, revision, onClose, onSaved }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [pins, setPins] = useState(() => revisionPins(revision).map(withKey));
  const [assets, setAssets] = useState([]);
  const [versions, setVersions] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const isDraft = revision.state === 'Draft';

  useEffect(() => {
    let active = true;
    apiClient
      .listAgentAssets(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => active && setAssets(r.items || []))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  const assetIds = pins.map((p) => p.assetId).filter(Boolean).join('|');
  useEffect(() => {
    let active = true;
    for (const id of assetIds ? assetIds.split('|') : []) {
      if (versions[id]) continue;
      apiClient
        .listAgentAssetVersions(tenantId, id)
        .then((r) => {
          const numbers = (Array.isArray(r) ? r : r?.objects || []).map((v) => v.number).sort((a, b) => b - a);
          if (active) setVersions((prev) => ({ ...prev, [id]: numbers }));
        })
        .catch(() => active && setVersions((prev) => ({ ...prev, [id]: [] })));
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient, tenantId, assetIds]);

  const update = (key, patch) => setPins((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const add = () => setPins((prev) => [...prev, withKey({ assetId: '', version: null })]);
  const remove = (key) => setPins((prev) => prev.filter((p) => p.key !== key));

  const chosen = (key) => new Set(pins.filter((p) => p.key !== key).map((p) => p.assetId));
  const unchanged = samePins(pins, revisionPins(revision));
  const incomplete = pins.some((p) => !p.assetId);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await apiClient.saveAgentDraft(tenantId, agent.id, draftBody(revision, cleanPins(pins)));
      addToast({ type: 'success', message: t('components.assets.pinsSaved', { number: saved?.number ?? revision.number }) });
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
      title={t('components.assets.pinsTitle')}
      headerMeta={agent.name}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={save} disabled={busy || unchanged || incomplete} data-testid="asset-pins-save" {...tip(t('tips.assets.pinsSave'))}>
            {busy ? t('common.generic.saving') : t('components.assets.pinsSave')}
          </button>
        </>
      }
    >
      {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />}
      <p className="field-hint" data-testid="asset-pins-source">
        {isDraft ? t('components.assets.pinsDraft', { number: revision.number }) : t('components.assets.pinsNewDraft', { number: revision.number })}
      </p>
      {pins.length === 0 && <p className="text-muted">{t('components.assets.pinsEmpty')}</p>}
      {pins.map((p, i) => {
        const taken = chosen(p.key);
        const known = assets.some((a) => a.id === p.assetId);
        return (
          <div className="asset-pin-row" key={p.key} data-pin={i}>
            <select
              id={`asset-pin-asset-${p.key}`}
              value={p.assetId}
              onChange={(e) => update(p.key, { assetId: e.target.value, version: null })}
              aria-label={t('components.assets.pinAsset')}
              data-testid="asset-pin-asset"
              {...tip(t('tips.assets.pinAsset'))}
            >
              <option value="">{t('components.assets.chooseAsset')}</option>
              {!known && p.assetId && <option value={p.assetId}>{p.assetId}</option>}
              {assets
                .filter((a) => a.id === p.assetId || !taken.has(a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {t('components.assets.assetOption', { name: a.name, kind: enumLabel(t, 'agentAssetKind', a.kind) })}
                  </option>
                ))}
            </select>
            <select
              id={`asset-pin-version-${p.key}`}
              value={p.version ?? ''}
              disabled={!p.assetId}
              onChange={(e) => update(p.key, { version: e.target.value === '' ? null : Number(e.target.value) })}
              aria-label={t('components.assets.pinVersionLabel')}
              data-testid="asset-pin-version"
              {...tip(t('tips.assets.pinVersion'))}
            >
              <option value="">{t('components.assets.followCurrent')}</option>
              {p.version && !(versions[p.assetId] || []).includes(p.version) && <option value={p.version}>{t('resources.agentAssets.version', { number: p.version })}</option>}
              {(versions[p.assetId] || []).map((n) => (
                <option key={n} value={n}>
                  {t('resources.agentAssets.version', { number: n })}
                </option>
              ))}
            </select>
            <button type="button" className="button-ghost button-sm" onClick={() => remove(p.key)} aria-label={t('components.assets.removePin')} data-testid="asset-pin-remove" {...tip(t('tips.assets.removePin'))}>
              <TrashIcon size={14} />
            </button>
          </div>
        );
      })}
      <button type="button" className="button-secondary button-sm" onClick={add} disabled={assets.length > 0 && pins.length >= assets.length} data-testid="asset-pin-add" {...tip(t('tips.assets.addPin'))}>
        <PlusIcon size={14} /> {t('components.assets.addPin')}
      </button>
    </Modal>
  );
}
