import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import AgenticAppPromoteModal from './AgenticAppPromoteModal';
import AgenticAppShare from './AgenticAppShare';
import { Badge } from './StatusBadge';
import { ErrorBanner, LoadingState } from './States';
import { PromotionKindBadge, PromotionOutcomeBadge } from './RevisionBadges';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { canRollback, environmentNames, nextEnvironment, revisionNumbers } from '../utils/revisions';
import { canPromoteTo, compareEnvironments, environmentMatrix, memberIds, sortAppRevisions, sortPromotions } from '../utils/apps';

const DIFF_TONES = { Same: 'success', Differs: 'warning', Missing: 'danger' };

/** One environment cell: each deployment with its pin and its environment overrides. */
function EnvironmentCell({ cell, environment, t }) {
  if (!cell.length) {
    return (
      <span className="text-muted" {...tip(t('tips.apps.release.noDeployment', { environment }))}>
        {t('components.apps.release.noDeployment')}
      </span>
    );
  }
  return (
    <ul className="plain-list app-release-cell">
      {cell.map((d) => {
        const pin = d.revisionId ? (d.revisionNumber !== null ? t('components.revisions.number', { number: d.revisionNumber }) : d.revisionId) : t('resources.deployments.latest');
        return (
          <li key={d.deploymentId} data-deployment={d.name}>
            <code>{d.name}</code>{' '}
            <Badge tone={d.revisionId ? 'info' : 'neutral'} tip={d.revisionId ? t('tips.resources.deployments.pinnedRevision', { revision: pin }) : t('tips.resources.deployments.followsLatest')}>
              <span data-pin={d.revisionNumber ?? (d.revisionId ? d.revisionId : 'latest')}>{pin}</span>
            </Badge>
            {d.overrides.length > 0 && (
              <div className="app-release-overrides" data-testid="app-release-overrides" {...tip(t('tips.apps.release.overrides'))}>
                {d.overrides.map((o) => (
                  <code key={o.name}>{o.isSecret ? t('components.apps.release.secretOverride', { name: o.name }) : `${o.name}=${o.value}`}</code>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Environments and promotion of one agentic app (AD9.6), shared by the Apps tab (row action Environments) and the
 * studio's Release tab. It shows the app URL, a table of every member's deployments per environment (the revision each
 * pins and its environment overrides) with the difference between two chosen environments, Promote for that pair
 * (POST /apps/{id}/promote through the promote dialog), and the app's promotion history (GET /promotions?appId=) with
 * Rollback. Promote and Rollback need Execute on Promotion for the target environment; a caller without it sees them
 * disabled with a tooltip that says so. `permissions` comes from useCallerPermissions or the Apps tab lookups (null
 * means unknown, and nothing is disabled).
 */
export default function AgenticAppReleasePanel({ app, permissions = null, onChanged }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [environments, setEnvironments] = useState([]);
  const [deployments, setDeployments] = useState(null);
  const [numbers, setNumbers] = useState({});
  const [revisions, setRevisions] = useState([]);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(app?.liveEnvironment || 'dev');
  const [target, setTarget] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [rollingBack, setRollingBack] = useState(null);
  const [note, setNote] = useState('');

  const loadHistory = useCallback(() => {
    if (!apiClient || !app?.id) return;
    apiClient
      .listPromotions(tenantId, { appId: app.id, pageNumber: 1, pageSize: 100 })
      .then((r) => setRecords(sortPromotions(r.items || [])))
      .catch((e) => {
        setRecords([]);
        setError(e);
      });
  }, [apiClient, tenantId, app?.id]);

  const loadDeployments = useCallback(() => {
    if (!apiClient || !app?.id) return;
    apiClient
      .listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setDeployments(r.items || []))
      .catch((e) => {
        setDeployments([]);
        setError(e);
      });
  }, [apiClient, tenantId, app?.id]);

  useEffect(() => {
    if (!apiClient || !app?.id) return undefined;
    let active = true;
    apiClient
      .getEnvironments(tenantId)
      .then((r) => active && setEnvironments(r?.environments || []))
      .catch(() => active && setEnvironments([]));
    apiClient
      .listAppRevisions(tenantId, app.id)
      .then((r) => active && setRevisions(sortAppRevisions(r)))
      .catch(() => active && setRevisions([]));
    // Revision numbers of every member, so pins read "Revision 3" rather than an ID.
    Promise.all(memberIds(app).map((id) => apiClient.listAgentRevisions(tenantId, id).then((r) => r.items || []).catch(() => [])))
      .then((lists) => active && setNumbers(revisionNumbers(lists.flat())))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, app]);

  useEffect(loadDeployments, [loadDeployments]);
  useEffect(loadHistory, [loadHistory]);

  const names = useMemo(() => environmentNames(environments, (deployments || []).map((d) => d.environment || 'dev')), [environments, deployments]);
  const pairTarget = target && target !== source ? target : nextEnvironment(environments, source);
  const rows = useMemo(() => environmentMatrix(app, deployments || [], names, numbers), [app, deployments, names, numbers]);
  const missing = pairTarget ? rows.filter((r) => compareEnvironments(r, source, pairTarget).status === 'Missing').map((r) => r.name) : [];
  const deniedTip = (environment) => (canPromoteTo(permissions, environment) ? '' : t('tips.apps.release.denied', { environment }));
  const promoteDenied = pairTarget ? deniedTip(pairTarget) : '';
  const promoteTip = promoteDenied || (pairTarget ? t('tips.apps.release.promote', { source, target: pairTarget }) : t('tips.apps.release.noNext', { source }));

  const changed = () => {
    loadDeployments();
    loadHistory();
    onChanged?.();
  };

  const rollback = async () => {
    const record = rollingBack;
    try {
      const body = note.trim() ? { note: note.trim() } : {};
      await apiClient.rollbackPromotion(tenantId, record.id, body);
      addToast({ type: 'success', message: t('components.promotions.rolledBack') });
      setRollingBack(null);
      changed();
    } catch (e) {
      setRollingBack(null);
      setError(e);
    }
  };

  const th = (tipKey, label, className) => (
    <th scope="col" className={className} {...tip(t(tipKey))}>
      {label}
    </th>
  );

  return (
    <div className="app-release" data-testid="app-release" data-app={app?.name}>
      <p className="field-hint">{t('components.apps.release.intro')}</p>
      <div className="app-release-head">
        <AgenticAppShare app={app} />
        <Badge tone="info" tip={t('tips.apps.release.live', { environment: app?.liveEnvironment || 'dev' })}>
          <span data-testid="app-release-live">{t('components.apps.release.live', { environment: app?.liveEnvironment || 'dev' })}</span>
        </Badge>
      </div>
      {error && (
        <div data-testid="app-release-error">
          <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />
        </div>
      )}

      <div className="studio-row-between app-release-compare">
        <h3 className="section-title" {...tip(t('tips.apps.release.environments'))}>
          {t('components.apps.release.environments')}
        </h3>
        <div className="flex gap-sm items-center">
          <label htmlFor="app-release-source" {...tip(t('tips.apps.release.source'))}>
            {t('components.apps.release.source')}
          </label>
          <select id="app-release-source" value={source} onChange={(e) => setSource(e.target.value)} data-testid="app-release-source" {...tip(t('tips.apps.release.source'))}>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label htmlFor="app-release-target" {...tip(t('tips.apps.release.target'))}>
            {t('components.apps.release.target')}
          </label>
          <select id="app-release-target" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="app-release-target" {...tip(t('tips.apps.release.target'))}>
            <option value="">{t('components.promote.targetNext', { name: nextEnvironment(environments, source) || '-' })}</option>
            {names
              .filter((n) => n !== source)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="button-primary"
            onClick={() => !promoteDenied && pairTarget && setPromoting(true)}
            disabled={!promoteDenied && !pairTarget}
            aria-disabled={promoteDenied ? 'true' : undefined}
            data-testid="app-release-promote"
            {...tip(promoteTip)}
          >
            {pairTarget ? t('components.apps.release.promote', { source, target: pairTarget }) : t('components.apps.release.promoteNothing')}
          </button>
        </div>
      </div>
      {deployments === null ? (
        <LoadingState />
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="app-release-matrix">
            <thead>
              <tr>
                {th('tips.apps.release.columns.member', t('components.apps.release.member'))}
                {names.map((n) => (
                  <th key={n} scope="col" data-environment={n} {...tip(t('tips.apps.release.columns.environment', { environment: n }))}>
                    {n}
                  </th>
                ))}
                {th('tips.apps.release.columns.difference', pairTarget ? t('components.apps.release.difference', { source, target: pairTarget }) : t('components.apps.release.differenceNone'))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const diff = pairTarget ? compareEnvironments(row, source, pairTarget) : null;
                return (
                  <tr key={row.agentId} data-member={row.name} data-diff={diff?.status || ''}>
                    <td>
                      <strong>{row.name}</strong>{' '}
                      {row.entry && (
                        <Badge tone="info" tip={t('tips.apps.release.entry')}>
                          {t('components.apps.release.entry')}
                        </Badge>
                      )}
                    </td>
                    {names.map((n) => (
                      <td key={n} data-environment={n} className={diff && (n === source || n === pairTarget) ? 'app-release-pair' : undefined}>
                        <EnvironmentCell cell={row.cells[n] || []} environment={n} t={t} />
                      </td>
                    ))}
                    <td data-cell="difference">
                      {diff ? (
                        <Badge tone={DIFF_TONES[diff.status]} tip={t(`tips.apps.release.diff.${diff.status}`, { source, target: pairTarget })}>
                          {diff.status === 'Differs'
                            ? t(diff.revisions && diff.overrides ? 'components.apps.release.diff.both' : diff.revisions ? 'components.apps.release.diff.revisions' : 'components.apps.release.diff.overrides')
                            : t(`components.apps.release.diff.${diff.status}`, { target: pairTarget })}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {missing.length > 0 && (
        <div className="warning-banner" role="status" data-testid="app-release-missing">
          {t('components.apps.release.missing', { target: pairTarget, names: missing.join(', ') })}
        </div>
      )}

      <div className="studio-row-between app-release-history-head">
        <h3 className="section-title" {...tip(t('tips.apps.release.history'))}>
          {t('components.apps.release.history')}
        </h3>
        <button type="button" className="button-secondary button-sm" onClick={changed} data-testid="app-release-refresh" {...tip(t('tips.apps.release.refresh'))}>
          {t('components.table.refresh')}
        </button>
      </div>
      {records === null ? (
        <LoadingState />
      ) : records.length === 0 ? (
        <p className="text-muted" data-testid="app-release-history-empty">
          {t('components.apps.release.historyEmpty')}
        </p>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="app-release-history">
            <thead>
              <tr>
                {th('tips.promotions.columns.createdUtc', t('components.promotions.columns.createdUtc'))}
                {th('tips.promotions.columns.kind', t('components.promotions.columns.kind'))}
                {th('tips.promotions.columns.outcome', t('components.promotions.columns.outcome'))}
                {th('tips.promotions.columns.environments', t('components.promotions.columns.environments'))}
                {th('tips.promotions.columns.deployments', t('components.promotions.columns.deployments'))}
                {th('tips.promotions.columns.actor', t('components.promotions.columns.actor'))}
                {th('tips.promotions.columns.note', t('components.promotions.columns.note'))}
                {th('tips.promotions.columns.actions', t('components.promotions.columns.actions'), 'right')}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const denied = deniedTip(r.targetEnvironment);
                const pinLabel = (id) => (id ? (numbers[id] !== undefined ? t('components.revisions.number', { number: numbers[id] }) : id) : t('resources.deployments.latest'));
                return (
                  <tr key={r.id} data-promotion={r.id} data-kind={r.kind} data-outcome={r.outcome}>
                    <td>
                      <span {...tip(formatDateTime(r.createdUtc, lng))}>{formatRelativeTime(r.createdUtc, lng)}</span>
                    </td>
                    <td>
                      <PromotionKindBadge kind={r.kind} t={t} />
                    </td>
                    <td>
                      <PromotionOutcomeBadge outcome={r.outcome} t={t} />
                    </td>
                    <td>{t('components.promotions.path', { source: r.sourceEnvironment, target: r.targetEnvironment })}</td>
                    <td>
                      <ul className="plain-list promotion-history-items">
                        {(r.items || []).map((item) => (
                          <li key={item.deploymentId}>
                            <code>{item.deploymentName || item.deploymentId}</code>{' '}
                            <span className="text-muted">{t('components.promotions.pinChange', { from: pinLabel(item.previousRevisionId), to: pinLabel(item.newRevisionId) })}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{r.actorName || '-'}</td>
                    <td>{r.note || '-'}</td>
                    <td className="right">
                      {canRollback(r) && (
                        <button
                          type="button"
                          className="button-secondary button-sm"
                          onClick={() => {
                            if (denied) return;
                            setNote('');
                            setRollingBack(r);
                          }}
                          aria-disabled={denied ? 'true' : undefined}
                          data-testid="app-release-rollback"
                          {...tip(denied || t('tips.promotions.rollback'))}
                        >
                          {t('components.promotions.rollback')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {promoting && (
        <AgenticAppPromoteModal
          app={app}
          revisions={revisions}
          permissions={permissions}
          initialSource={source}
          initialTarget={target && target !== source ? target : ''}
          onClose={() => setPromoting(false)}
          onPromoted={() => {
            setPromoting(false);
            changed();
          }}
        />
      )}
      <ConfirmModal
        open={!!rollingBack}
        danger
        title={t('components.promotions.rollbackTitle')}
        message={rollingBack ? t('components.promotions.rollbackMessage', { deployments: (rollingBack.items || []).length, source: rollingBack.sourceEnvironment, target: rollingBack.targetEnvironment }) : ''}
        confirmLabel={t('components.promotions.rollback')}
        confirmTip={t('tips.promotions.rollbackConfirm')}
        onConfirm={rollback}
        onCancel={() => setRollingBack(null)}
        details={
          <div className="field">
            <label htmlFor="app-release-rollback-note" {...tip(t('tips.promotions.rollbackNote'))}>
              {t('components.promotions.rollbackNote')}
            </label>
            <textarea id="app-release-rollback-note" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} data-testid="app-release-rollback-note" {...tip(t('tips.promotions.rollbackNote'))} />
          </div>
        }
      />
    </div>
  );
}
