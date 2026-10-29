import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ActionMenu from '../components/ActionMenu';
import ConfirmModal from '../components/ConfirmModal';
import { LoadingState, EmptyState, ErrorBanner } from '../components/States';
import { Badge } from '../components/StatusBadge';
import { PlusIcon, RefreshIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import StudioNewDraftModal from '../components/studio/StudioNewDraftModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { DRAFT_STATUSES, draftStatusTone, filterDrafts, studioPermissions } from '../utils/studio';

const COLUMNS = ['title', 'status', 'owner', 'targetApp', 'items', 'version', 'updated'];

/**
 * Agents > Studio (AD7.10): the studio drafts of the tenant, or only the caller's own (the default), with the title
 * search (sent to the server), status chips (applied in the browser, since the server has no status filter), a new
 * draft (empty or from an existing app), and discard. A draft opens its workspace at /dashboard/studio/{id}. Actions the
 * caller lacks the permission for stay visible but disabled, with the missing permission in the tooltip.
 */
export default function StudioView() {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const permissions = useCallerPermissions();
  const denied = studioPermissions(t, permissions);
  const lng = i18n.language;
  const [mine, setMine] = useState(true);
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState(() => new Set());
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [discard, setDiscard] = useState(null);
  const query = useDebounce(search, 300);

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient
      .listStudioDrafts(tenantId, { mine, search: query.trim() || undefined, pageNumber: 1, pageSize: 1000 })
      .then((r) => {
        setRows(r.items || []);
        setError(null);
      })
      .catch((e) => {
        setRows((current) => current || []);
        setError(e);
      });
  }, [apiClient, tenantId, mine, query]);

  useEffect(load, [load]);

  const shown = useMemo(() => filterDrafts(rows, statuses), [rows, statuses]);
  const toggleStatus = (s) =>
    setStatuses((current) => {
      const next = new Set(current);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const confirmDiscard = async () => {
    const draft = discard;
    try {
      await apiClient.deleteStudioDraft(tenantId, draft.id);
      addToast({ type: 'success', message: t('views.studio.discarded', { title: draft.title || draft.id }) });
      load();
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setDiscard(null);
    }
  };

  const openDraft = (draft) => navigate(pathFor('studio', draft.id));
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const newButton = (testId) => (
    <button
      type="button"
      className="button-primary"
      onClick={() => !denied.create && setCreating(true)}
      aria-disabled={denied.create ? 'true' : undefined}
      data-denied={denied.create ? 'true' : undefined}
      data-testid={testId}
      {...tip(denied.create || t('tips.views.studio.newDraft'))}
    >
      <PlusIcon /> {t('views.studio.newDraft')}
    </button>
  );

  return (
    <div data-testid="studio-view">
      <PageHeader
        title={t('views.studio.title')}
        subtitle={t('views.studio.subtitle')}
        actions={
          <>
            <button type="button" className="button-secondary" onClick={load} {...tip(t('tips.views.studio.refresh'))}>
              <RefreshIcon /> {t('views.studio.refresh')}
            </button>
            {newButton('add-button')}
          </>
        }
      />
      <div className="panel studio-list">
        <div className="table-filter-row studio-filters">
          <input
            type="search"
            className="filter-search"
            value={search}
            placeholder={t('views.studio.search')}
            aria-label={t('views.studio.search')}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="studio-search"
            {...tip(t('tips.views.studio.search'))}
          />
          <div className="studio-scope" role="radiogroup" aria-label={t('views.studio.scopeLabel')} {...tip(t('tips.views.studio.scope'))}>
            {['mine', 'all'].map((scope) => (
              <button
                key={scope}
                type="button"
                role="radio"
                aria-checked={(scope === 'mine') === mine}
                className={`button-sm ${(scope === 'mine') === mine ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setMine(scope === 'mine')}
                data-testid={`studio-scope-${scope}`}
                {...tip(t(`tips.views.studio.scopes.${scope}`))}
              >
                {t(`views.studio.scopes.${scope}`)}
              </button>
            ))}
          </div>
          <div className="checkbox-grid studio-status-chips" role="group" aria-label={t('views.studio.statusLabel')}>
            {DRAFT_STATUSES.map((s) => (
              <label key={s} className="checkbox-chip" {...tip(t('tips.views.studio.statusChip', { status: enumLabel(t, 'studioDraftStatus', s) }))}>
                <input type="checkbox" checked={statuses.has(s)} onChange={() => toggleStatus(s)} data-testid={`studio-status-${s}`} {...tip(t('tips.views.studio.statusChip', { status: enumLabel(t, 'studioDraftStatus', s) }))} />
                {enumLabel(t, 'studioDraftStatus', s)}
              </label>
            ))}
          </div>
        </div>
        {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
        {rows === null ? (
          <LoadingState />
        ) : shown.length === 0 ? (
          <EmptyState title={t('views.studio.emptyTitle')} body={rows.length ? t('views.studio.emptyFiltered') : t('views.studio.emptyBody')} action={rows.length ? null : newButton('studio-empty-new')} />
        ) : (
          <div className="table-scroll">
            <table className="data-table" data-testid="studio-drafts">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c} scope="col" className={['items', 'version'].includes(c) ? 'right' : undefined} {...tip(t(`tips.views.studio.columns.${c}`))}>
                      {t(`views.studio.columns.${c}`)}
                    </th>
                  ))}
                  <th scope="col" className="right" {...tip(t('tips.table.actionsColumn'))}>
                    {t('common.generic.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((d) => (
                  <tr key={d.id} data-draft={d.id}>
                    <td>
                      <a
                        href={pathFor('studio', d.id)}
                        onClick={(e) => {
                          e.preventDefault();
                          openDraft(d);
                        }}
                        {...tip(t('tips.views.studio.openDraft'))}
                      >
                        <strong>{d.title || t('views.studio.untitled')}</strong>
                      </a>
                    </td>
                    <td>
                      <Badge tone={draftStatusTone(d.status)} tip={enumTip(t, 'studioDraftStatus', d.status || 'Open')}>
                        {enumLabel(t, 'studioDraftStatus', d.status || 'Open')}
                      </Badge>
                    </td>
                    <td>{d.ownerName || d.ownerUserId || '-'}</td>
                    <td>{d.targetApp || '-'}</td>
                    <td className="right">{formatNumber((d.items || []).length, {}, lng)}</td>
                    <td className="right">{formatNumber(d.version ?? 1, {}, lng)}</td>
                    <td className="nowrap">{when(d.lastUpdateUtc)}</td>
                    <td className="actions-cell">
                      <ActionMenu
                        label={d.title || d.id}
                        items={[
                          { label: t('views.studio.open'), tip: t('tips.views.studio.openDraft'), onClick: () => openDraft(d) },
                          {
                            label: t('views.studio.discard'),
                            tip: denied.discard || t(d.status === 'PendingApproval' ? 'tips.views.studio.discardPending' : 'tips.views.studio.discard'),
                            danger: !denied.discard,
                            disabled: !!denied.discard,
                            hidden: d.status === 'Discarded',
                            onClick: () => setDiscard(d)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {creating && (
        <StudioNewDraftModal
          onClose={() => setCreating(false)}
          onCreated={(draft) => {
            setCreating(false);
            addToast({ type: 'success', message: t('components.studio.newDraft.created', { title: draft?.title || draft?.id }) });
            if (draft?.id) openDraft(draft);
            else load();
          }}
        />
      )}
      <ConfirmModal
        open={!!discard}
        danger
        title={t('views.studio.discardTitle')}
        message={t(discard?.status === 'PendingApproval' ? 'views.studio.discardPendingMessage' : 'views.studio.discardMessage', { title: discard?.title || discard?.id })}
        confirmLabel={t('views.studio.discard')}
        confirmTip={t('tips.views.studio.discard')}
        onConfirm={confirmDiscard}
        onCancel={() => setDiscard(null)}
      />
    </div>
  );
}
