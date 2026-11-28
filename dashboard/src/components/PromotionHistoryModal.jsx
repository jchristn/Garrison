import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { ErrorBanner, LoadingState } from './States';
import { PromotionKindBadge, PromotionOutcomeBadge } from './RevisionBadges';
import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import TableFrame from './TableFrame';
import usePageSizePref from '../hooks/usePageSizePref';
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
  const [total, setTotal] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = usePageSizePref('promotion-history', 100);
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
      .listPromotions(tenantId, { agentId: agent || undefined, pageNumber, pageSize })
      .then((r) => {
        setRecords(r.items || []);
        setTotal(r.totalCount ?? (r.items || []).length);
      })
      .catch((e) => {
        setRecords([]);
        setError(e);
      });
  }, [apiClient, tenantId, agent, pageNumber, pageSize]);
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

  const col = (key, extra) => ({ key, label: t(`components.promotions.columns.${key}`), tip: t(`tips.promotions.columns.${key}`), ...extra });
  const columns = [
    col('createdUtc', { cellClass: 'nowrap', render: (r) => <span {...tip(formatDateTime(r.createdUtc, lng))}>{formatRelativeTime(r.createdUtc, lng)}</span> }),
    col('kind', { render: (r) => <PromotionKindBadge kind={r.kind} t={t} /> }),
    col('outcome', { render: (r) => <PromotionOutcomeBadge outcome={r.outcome} t={t} /> }),
    col('agent', { render: (r) => agentName(r.agentId) }),
    col('revision', { render: (r) => revisionLabel(r.agentRevisionId) }),
    col('environments', {
      render: (r) => (
        <>
          {t('components.promotions.path', { source: r.sourceEnvironment, target: r.targetEnvironment })}{' '}
          {r.skippedEnvironments && <Badge tone="warning" tip={t('tips.promotions.skipped')}>{t('components.promotions.skipped')}</Badge>}
        </>
      )
    }),
    col('deployments', {
      render: (r) => (
        <ul className="plain-list promotion-history-items">
          {(r.items || []).map((item) => (
            <li key={item.deploymentId}>
              <code className="cell-break">{item.deploymentName || item.deploymentId}</code>{' '}
              <span className="text-muted">
                {t('components.promotions.pinChange', { from: item.previousRevisionId ? revisionLabel(item.previousRevisionId) : t('resources.deployments.latest'), to: item.newRevisionId ? revisionLabel(item.newRevisionId) : t('resources.deployments.latest') })}
              </span>
            </li>
          ))}
        </ul>
      )
    }),
    col('actor', { defaultHidden: true, render: (r) => r.actorName || '-' }),
    col('note', { defaultHidden: true, render: (r) => r.note || '-' }),
    col('actions', {
      pinned: true,
      headerClass: 'right',
      cellClass: 'right',
      render: (r) =>
        canRollback(r) && (
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
        )
    })
  ];

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.promotions.title')}
      footer={
        <>
          <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div className="filter-inline">
        <label className="filter-select" {...tip(t('tips.promotions.agentFilter'))}>
          <span className="sr-only">{t('components.promotions.agentFilter')}</span>
          <select value={agent} onChange={(e) => {
              setAgent(e.target.value);
              setPageNumber(1);
            }} aria-label={t('components.promotions.agentFilter')} data-testid="promotions-agent" {...tip(t('tips.promotions.agentFilter'))}>
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
      ) : (
        <TableFrame
          tableId="promotion-history"
          columns={columns}
          items={records}
          testId="promotions-table"
          emptyMessage={t('components.promotions.empty')}
          rowProps={(r) => ({ 'data-promotion': r.id, 'data-kind': r.kind })}
          totalRecords={total}
          pageNumber={pageNumber}
          pageSize={pageSize}
          onPageChange={setPageNumber}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageNumber(1);
          }}
          onRefresh={load}
        />
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
