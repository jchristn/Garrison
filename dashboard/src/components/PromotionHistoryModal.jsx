import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { ErrorBanner, LoadingState } from './States';
import { PromotionKindBadge, PromotionOutcomeBadge } from './RevisionBadges';
import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { canRollback, revisionNumbers } from '../utils/revisions';

/**
 * Promotion and rollback records, newest first (AD1.9), optionally for one agent. Each applied promotion can be rolled
 * back, which restores the exact revision pins its deployments had before. A failed rollback (AlreadyRolledBack, 403
 * without Execute on Promotion for the target) shows as a translated message.
 */
export default function PromotionHistoryModal({ agentId = '', onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [agent, setAgent] = useState(agentId);
  const [agents, setAgents] = useState([]);
  const [numbers, setNumbers] = useState({});
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setAgents(r.items || []))
      .catch(() => setAgents([]));
  }, [apiClient, tenantId]);

  const load = useCallback(() => {
    if (!apiClient) return;
    setError(null);
    apiClient
      .listPromotions(tenantId, { agentId: agent || undefined, pageNumber: 1, pageSize: 100 })
      .then((r) => setRecords(r.items || []))
      .catch((e) => {
        setRecords([]);
        setError(e);
      });
  }, [apiClient, tenantId, agent]);
  useEffect(load, [load]);

  // Revision numbers for the agents in view, so records show "Revision 3" rather than an ID.
  useEffect(() => {
    if (!apiClient || !records?.length) return undefined;
    let active = true;
    const ids = [...new Set(records.map((r) => r.agentId).filter(Boolean))];
    Promise.all(ids.map((id) => apiClient.listAgentRevisions(tenantId, id).then((r) => r.items || []).catch(() => [])))
      .then((lists) => active && setNumbers(revisionNumbers(lists.flat())))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, records]);

  const agentName = (id) => agents.find((a) => a.id === id)?.name || id || '-';
  const revisionLabel = (id) => (id ? (numbers[id] !== undefined ? t('components.revisions.number', { number: numbers[id] }) : id) : '-');

  const rollback = async () => {
    try {
      const body = note.trim() ? { note: note.trim() } : {};
      await apiClient.rollbackPromotion(tenantId, target.id, body);
      addToast({ type: 'success', message: t('components.promotions.rolledBack') });
      setTarget(null);
      load();
      onChanged?.();
    } catch (e) {
      setError(e);
      addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      setTarget(null);
    }
  };

  const th = (key, className) => (
    <th scope="col" className={className} {...tip(t(`tips.promotions.columns.${key}`))}>
      {t(`components.promotions.columns.${key}`)}
    </th>
  );

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.promotions.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={load} {...tip(t('tips.promotions.refresh'))}>
            {t('components.table.refresh')}
          </button>
          <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div className="filter-inline">
        <label className="filter-select" {...tip(t('tips.promotions.agentFilter'))}>
          <span className="sr-only">{t('components.promotions.agentFilter')}</span>
          <select value={agent} onChange={(e) => setAgent(e.target.value)} aria-label={t('components.promotions.agentFilter')} data-testid="promotions-agent" {...tip(t('tips.promotions.agentFilter'))}>
            <option value="">{t('components.promotions.allAgents')}</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <div data-testid="promotions-error">
          <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />
        </div>
      )}
      {records === null ? (
        <LoadingState />
      ) : records.length === 0 ? (
        <p className="text-muted">{t('components.promotions.empty')}</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="promotions-table">
            <thead>
              <tr>
                {th('createdUtc')}
                {th('kind')}
                {th('outcome')}
                {th('agent')}
                {th('revision')}
                {th('environments')}
                {th('deployments')}
                {th('actor')}
                {th('note')}
                {th('actions', 'right')}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} data-promotion={r.id} data-kind={r.kind}>
                  <td>
                    <span {...tip(formatDateTime(r.createdUtc, lng))}>{formatRelativeTime(r.createdUtc, lng)}</span>
                  </td>
                  <td>
                    <PromotionKindBadge kind={r.kind} t={t} />
                  </td>
                  <td>
                    <PromotionOutcomeBadge outcome={r.outcome} t={t} />
                  </td>
                  <td>{agentName(r.agentId)}</td>
                  <td>{revisionLabel(r.agentRevisionId)}</td>
                  <td>
                    {t('components.promotions.path', { source: r.sourceEnvironment, target: r.targetEnvironment })}{' '}
                    {r.skippedEnvironments && <Badge tone="warning" tip={t('tips.promotions.skipped')}>{t('components.promotions.skipped')}</Badge>}
                  </td>
                  <td>
                    <ul className="plain-list promotion-history-items">
                      {(r.items || []).map((item) => (
                        <li key={item.deploymentId}>
                          <code>{item.deploymentName || item.deploymentId}</code>{' '}
                          <span className="text-muted">
                            {t('components.promotions.pinChange', { from: item.previousRevisionId ? revisionLabel(item.previousRevisionId) : t('resources.deployments.latest'), to: item.newRevisionId ? revisionLabel(item.newRevisionId) : t('resources.deployments.latest') })}
                          </span>
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
                          setNote('');
                          setTarget(r);
                        }}
                        data-testid="promotion-rollback"
                        {...tip(t('tips.promotions.rollback'))}
                      >
                        {t('components.promotions.rollback')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal
        open={!!target}
        danger
        title={t('components.promotions.rollbackTitle')}
        message={target ? t('components.promotions.rollbackMessage', { deployments: (target.items || []).length, source: target.sourceEnvironment, target: target.targetEnvironment }) : ''}
        confirmLabel={t('components.promotions.rollback')}
        confirmTip={t('tips.promotions.rollbackConfirm')}
        onConfirm={rollback}
        onCancel={() => setTarget(null)}
        details={
          <div className="field">
            <label htmlFor="promotion-rollback-note" {...tip(t('tips.promotions.rollbackNote'))}>{t('components.promotions.rollbackNote')}</label>
            <textarea id="promotion-rollback-note" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} data-testid="promotion-rollback-note" {...tip(t('tips.promotions.rollbackNote'))} />
          </div>
        }
      />
    </Modal>
  );
}
