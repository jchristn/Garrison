import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { Badge } from './StatusBadge';
import { ErrorBanner, LoadingState } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { delegationSummary } from '../utils/apps';
import { pathFor } from '../config/navConfig';

function Mode({ mode, t }) {
  if (!mode) return <span className="text-muted">-</span>;
  return (
    <Badge tone={mode === 'None' ? 'neutral' : 'info'} tip={enumTip(t, 'delegationMode', mode)}>
      {enumLabel(t, 'delegationMode', mode)}
    </Badge>
  );
}

function Names({ list }) {
  if (!list || !list.length) return <span className="text-muted">-</span>;
  return (
    <span className="capability-names">
      {list.map((n) => (
        <code key={n}>{n}</code>
      ))}
    </span>
  );
}

/**
 * Delegation derived from an app's graph (AD6.3): for each member, the allow list, mode, and maximum depth the edges
 * call for against what the member has published, with drift marked. "Write drafts" posts the plan, which writes the
 * graph's policy into a draft revision of each drifting member and publishes nothing; a member whose open draft already
 * changes delegation another way is left alone and reported as DraftConflict. `deniedTip` disables the button with the
 * missing permission (Update on AgenticApp).
 */
export default function AgenticAppDelegationModal({ app, deniedTip = '', onClose }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!apiClient || !app?.id) return;
    setError(null);
    apiClient
      .getAppDelegation(tenantId, app.id)
      .then(setPlan)
      .catch((e) => {
        setPlan({ members: [] });
        setError(e);
      });
  }, [apiClient, tenantId, app?.id]);
  useEffect(load, [load]);

  const apply = async () => {
    if (deniedTip) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiClient.applyAppDelegation(tenantId, app.id);
      setPlan(result);
      const s = delegationSummary(result);
      addToast({ type: s.skipped ? 'warning' : 'success', message: t('components.apps.delegation.applied', { drafts: s.drafts, skipped: s.skipped }) });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const summary = delegationSummary(plan);
  const th = (key) => (
    <th scope="col" {...tip(t(`tips.apps.delegation.columns.${key}`))}>
      {t(`components.apps.delegation.columns.${key}`)}
    </th>
  );
  const applyTip = deniedTip || (summary.drifting ? t('tips.apps.delegation.apply') : t('tips.apps.delegation.applyNothing'));

  return (
    <Modal
      open
      size="xlarge"
      onClose={() => !busy && onClose()}
      title={t('components.apps.delegation.title')}
      headerMeta={<code className="cell-id">{app?.name}</code>}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={apply}
            disabled={busy || !plan || (!deniedTip && !summary.drifting)}
            aria-disabled={deniedTip ? 'true' : undefined}
            data-testid="app-delegation-apply"
            {...tip(applyTip)}
          >
            {busy ? t('components.apps.delegation.applying') : t('components.apps.delegation.apply')}
          </button>
        </>
      }
    >
      <p className="field-hint">{t('components.apps.delegation.intro')}</p>
      {error && (
        <div data-testid="app-delegation-error">
          <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        </div>
      )}
      {!plan ? (
        <LoadingState />
      ) : (
        <>
          <div className={summary.drifting ? 'warning-banner' : 'info-banner'} role="status" data-testid="app-delegation-summary">
            {plan.applied
              ? t('components.apps.delegation.appliedSummary', { drafts: summary.drafts, skipped: summary.skipped })
              : summary.drifting
                ? t('components.apps.delegation.drifting', { count: summary.drifting })
                : t('components.apps.delegation.inSync')}
          </div>
          {plan.members?.length ? (
            <div className="table-scroll">
              <table className="data-table" data-testid="app-delegation">
                <thead>
                  <tr>
                    {th('member')}
                    {th('desiredMode')}
                    {th('desiredAllowList')}
                    {th('desiredMaxDepth')}
                    {th('publishedMode')}
                    {th('publishedAllowList')}
                    {th('publishedMaxDepth')}
                    {th('status')}
                  </tr>
                </thead>
                <tbody>
                  {plan.members.map((m) => (
                    <tr key={m.agentId} data-member={m.agentName} data-drift={m.drift ? 'true' : 'false'}>
                      <td>
                        <Link to={pathFor('agents', m.agentId)} {...tip(t('tips.apps.delegation.openAgent', { name: m.agentName }))}>
                          {m.agentName}
                        </Link>
                      </td>
                      <td>
                        <Mode mode={m.desiredMode} t={t} />
                      </td>
                      <td>
                        <Names list={m.desiredAllowList} />
                      </td>
                      <td className="right">{m.desiredMaxDepth ?? 0}</td>
                      <td>{m.publishedMode ? <Mode mode={m.publishedMode} t={t} /> : <span className="text-muted">{t('components.apps.delegation.notPublished')}</span>}</td>
                      <td>
                        <Names list={m.publishedAllowList} />
                      </td>
                      <td className="right">{m.publishedMaxDepth ?? '-'}</td>
                      <td data-cell="status">
                        <span className="capability-names">
                          {m.drift ? (
                            <Badge tone="warning" tip={t('tips.apps.delegation.drift')}>
                              {t('components.apps.delegation.drift')}
                            </Badge>
                          ) : (
                            <Badge tone="success" tip={t('tips.apps.delegation.inSync')}>
                              {t('components.apps.delegation.inSyncBadge')}
                            </Badge>
                          )}
                          {m.skippedReason ? (
                            <Badge tone="danger" tip={t(m.skippedReason === 'DraftConflict' ? 'tips.apps.delegation.draftConflict' : 'tips.apps.delegation.skipped', { reason: m.skippedReason })}>
                              {m.skippedReason === 'DraftConflict' ? t('components.apps.delegation.draftConflict') : m.skippedReason}
                            </Badge>
                          ) : m.draftRevisionNumber ? (
                            <Badge tone="info" tip={t('tips.apps.delegation.draft', { number: m.draftRevisionNumber })}>
                              {t('components.apps.delegation.draft', { number: m.draftRevisionNumber })}
                            </Badge>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted">{t('components.apps.delegation.empty')}</div>
          )}
          {plan.applied && summary.drafts > 0 && <p className="field-hint">{t('components.apps.delegation.review')}</p>}
        </>
      )}
    </Modal>
  );
}
