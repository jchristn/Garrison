import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { Badge } from './StatusBadge';
import { ErrorBanner, LoadingState } from './States';
import { RevisionStateBadge } from './RevisionBadges';
import AgenticAppPromoteModal from './AgenticAppPromoteModal';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { APP_LIMITS, latestAppRevision, sortAppRevisions } from '../utils/apps';

/**
 * Revisions of an agentic app (AD6.4): the list (number, state, pinned member revisions, edges, author, change note,
 * publication), Take revision (pins every member's latest published revision, with a change note), Publish on a
 * draft, and Promote, which opens the promote dialog. `denied` holds the missing-permission explanation per action
 * (take: Update on AgenticApp, publish: Execute on AgenticApp, promote: Execute on Promotion); a denied action stays
 * visible but disabled with that tooltip.
 */
export default function AgenticAppRevisionsModal({ app, denied = {}, permissions = null, nameOf = (id) => id, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [revisions, setRevisions] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [promoting, setPromoting] = useState(false);

  const load = useCallback(() => {
    if (!apiClient || !app?.id) return;
    setError(null);
    apiClient
      .listAppRevisions(tenantId, app.id)
      .then((r) => setRevisions(sortAppRevisions(r)))
      .catch((e) => {
        setRevisions([]);
        setError(e);
      });
  }, [apiClient, tenantId, app?.id]);
  useEffect(load, [load]);

  const take = async () => {
    if (denied.take) return;
    setBusy(true);
    setActionError(null);
    try {
      const created = await apiClient.createAppRevision(tenantId, app.id, note.trim() || null);
      addToast({ type: 'success', message: t('components.apps.revisions.taken', { number: created?.number ?? '' }) });
      setNote('');
      load();
      onChanged?.();
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    const revision = publishing;
    try {
      await apiClient.publishAppRevision(tenantId, app.id, revision.number);
      addToast({ type: 'success', message: t('components.apps.revisions.published', { number: revision.number }) });
      setPublishing(null);
      load();
      onChanged?.();
    } catch (e) {
      setPublishing(null);
      setActionError(e);
    }
  };

  const list = revisions || [];
  const latest = latestAppRevision(list, app);
  const promoteTip = denied.promote || (latest ? t('tips.apps.revisions.promote') : t('tips.apps.revisions.promoteNothing'));
  const th = (key) => (
    <th scope="col" {...tip(t(`tips.apps.revisions.columns.${key}`))}>
      {t(`components.apps.revisions.columns.${key}`)}
    </th>
  );

  return (
    <>
      <Modal
        open={!promoting}
        size="xlarge"
        onClose={() => !busy && onClose()}
        title={t('components.apps.revisions.title')}
        headerMeta={<code className="cell-id">{app?.name}</code>}
        footer={
          <>
            <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.close'))}>
              {t('common.actions.close')}
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={() => !denied.promote && latest && setPromoting(true)}
              disabled={!denied.promote && !latest}
              aria-disabled={denied.promote ? 'true' : undefined}
              data-testid="app-promote"
              {...tip(promoteTip)}
            >
              {t('components.apps.revisions.promote')}
            </button>
          </>
        }
      >
        <p className="field-hint">{t('components.apps.revisions.intro')}</p>
        {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
        {actionError && (
          <div data-testid="app-revisions-error">
            <ErrorBanner message={`${errorMessage(t, actionError)} ${errorDetail(t, actionError)}`.trim()} />
          </div>
        )}
        <div className="app-revision-take">
          <div className="field">
            <label htmlFor="app-revision-note" {...tip(t('tips.apps.revisions.changeNote'))}>{t('components.apps.revisions.changeNote')}</label>
            <textarea
              id="app-revision-note"
              rows={2}
              maxLength={APP_LIMITS.changeNote}
              value={note}
              disabled={!!denied.take}
              placeholder={t('components.apps.revisions.changeNotePlaceholder')}
              onChange={(e) => setNote(e.target.value)}
              {...tip(denied.take || t('tips.apps.revisions.changeNote'))}
            />
          </div>
          <button
            type="button"
            className="button-secondary"
            onClick={take}
            disabled={busy}
            aria-disabled={denied.take ? 'true' : undefined}
            data-testid="app-revision-take"
            {...tip(denied.take || t('tips.apps.revisions.take'))}
          >
            {busy ? t('components.apps.revisions.taking') : t('components.apps.revisions.take')}
          </button>
        </div>
        {revisions === null ? (
          <LoadingState />
        ) : list.length === 0 ? (
          <div className="text-muted" data-testid="app-revisions-empty">
            {t('components.apps.revisions.empty')}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table" data-testid="app-revisions">
              <thead>
                <tr>
                  {th('number')}
                  {th('state')}
                  {th('members')}
                  {th('edges')}
                  {th('author')}
                  {th('changeNote')}
                  {th('publishedUtc')}
                  <th scope="col" className="right" {...tip(t('tips.apps.revisions.columns.actions'))}>
                    {t('components.apps.revisions.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} data-revision={r.number} data-state={r.state}>
                    <td>
                      <strong>{t('components.revisions.number', { number: r.number })}</strong>{' '}
                      {latest?.id === r.id && (
                        <Badge tone="success" tip={t('tips.apps.revisions.latest')}>
                          {t('components.revisions.latest')}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <RevisionStateBadge state={r.state} t={t} />
                    </td>
                    <td data-cell="members">
                      <span className="capability-names">
                        {(r.members || []).map((m) => (
                          <Badge key={m.agentId} tip={t('tips.apps.revisions.pin', { name: m.agentName || nameOf(m.agentId), number: m.agentRevisionNumber ?? '?' })}>
                            {t('components.apps.revisions.pin', { name: m.agentName || nameOf(m.agentId), number: m.agentRevisionNumber ?? '?' })}
                          </Badge>
                        ))}
                      </span>
                    </td>
                    <td className="right">{(r.edges || []).length}</td>
                    <td>{r.authorName || '-'}</td>
                    <td>{r.changeNote || '-'}</td>
                    <td>
                      {r.publishedUtc ? (
                        <span {...tip(t('tips.apps.revisions.publishedBy', { name: r.publishedByName || '-', when: formatDateTime(r.publishedUtc, lng) }))}>{formatRelativeTime(r.publishedUtc, lng)}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="right">
                      {r.state === 'Draft' && (
                        <button
                          type="button"
                          className="button-secondary button-sm"
                          onClick={() => !denied.publish && setPublishing(r)}
                          aria-disabled={denied.publish ? 'true' : undefined}
                          data-testid="app-revision-publish"
                          {...tip(denied.publish || t('tips.apps.revisions.publish'))}
                        >
                          {t('components.apps.revisions.publish')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
      <ConfirmModal
        open={!!publishing}
        title={t('components.apps.revisions.publishTitle', { number: publishing?.number ?? '' })}
        message={t('components.apps.revisions.publishConfirm', { number: publishing?.number ?? '', name: app?.name || '' })}
        confirmLabel={t('components.apps.revisions.publish')}
        confirmTip={t('tips.apps.revisions.publishConfirm')}
        onConfirm={publish}
        onCancel={() => setPublishing(null)}
      />
      {promoting && (
        <AgenticAppPromoteModal
          app={app}
          revisions={list}
          permissions={permissions}
          onClose={() => setPromoting(false)}
          onPromoted={() => {
            setPromoting(false);
            onChanged?.();
          }}
        />
      )}
    </>
  );
}
