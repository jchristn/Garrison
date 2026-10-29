import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import DiffViewer from './DiffViewer';
import { Badge } from './StatusBadge';
import { ErrorBanner, LoadingState } from './States';
import { RevisionStateBadge } from './RevisionBadges';
import AgentAssetPinsModal from './AgentAssetPinsModal';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { defaultDiffPair, diffValue, draftRevision, isBlockValue, latestPublished, publishedRevisions, sortRevisions } from '../utils/revisions';
import { assetNames, pinLabel, revisionPins } from '../utils/assets';

/**
 * Revisions of one agent (AD1.9): the list (number, state, author, change note, published time, latest and draft
 * markers), a field-level diff between any two revisions (latest published against the draft by default), and the
 * Publish and Discard actions on the open draft. `onChanged` runs after a publish or discard so the page reloads
 * the agent (its latestPublishedRevisionId and draftRevisionId change).
 *
 * AD2.8: each revision lists its asset pins (asset name and pinned version, or current). The draft's pins are edited in
 * place; without a draft, editing pins starts a new draft from the latest published revision.
 */
export default function AgentRevisionsPanel({ agent, onChanged }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [revisions, setRevisions] = useState(null);
  const [error, setError] = useState(null);
  const [pair, setPair] = useState({ from: '', to: '' });
  const [diff, setDiff] = useState(null);
  const [diffError, setDiffError] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const [discarding, setDiscarding] = useState(null);
  const [pinning, setPinning] = useState(null);
  const [names, setNames] = useState({});

  useEffect(() => {
    if (!apiClient?.listAgentAssets) return undefined;
    let active = true;
    apiClient
      .listAgentAssets(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => active && setNames(assetNames(r.items || [])))
      .catch(() => active && setNames({}));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  const load = useCallback(() => {
    if (!apiClient || !agent?.id) return;
    setError(null);
    apiClient
      .listAgentRevisions(tenantId, agent.id)
      .then((r) => {
        const list = sortRevisions(r.items || []);
        setRevisions(list);
        setPair(defaultDiffPair(list, agent));
      })
      .catch((e) => {
        setRevisions([]);
        setError(e);
      });
  }, [apiClient, tenantId, agent]);
  useEffect(load, [load]);

  useEffect(() => {
    setDiff(null);
    setDiffError(null);
    if (!apiClient || !agent?.id || !pair.from || !pair.to || pair.from === pair.to) return undefined;
    let active = true;
    apiClient
      .diffAgentRevisions(tenantId, agent.id, pair.from, pair.to)
      .then((d) => active && setDiff(d))
      .catch((e) => active && setDiffError(e));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, agent?.id, pair.from, pair.to]);

  if (revisions === null) return <LoadingState />;

  const latest = latestPublished(revisions, agent);
  const draft = draftRevision(revisions, agent);
  const label = (r) => t('components.revisions.option', { number: r.number, state: enumLabel(t, 'agentRevisionState', r.state) });

  const compareWith = (r) => {
    const base = r.state === 'Draft' ? latest : publishedRevisions(revisions).find((p) => p.number < r.number);
    setPair({ from: base?.id || '', to: r.id });
  };

  const discard = async () => {
    try {
      await apiClient.discardAgentRevision(tenantId, agent.id, discarding.id);
      addToast({ type: 'success', message: t('components.revisions.discarded') });
      setDiscarding(null);
      load();
      onChanged?.();
    } catch (e) {
      addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      setDiscarding(null);
    }
  };

  const th = (key) => (
    <th scope="col" {...tip(t(`tips.revisions.columns.${key}`))}>
      {t(`components.revisions.columns.${key}`)}
    </th>
  );

  return (
    <div data-testid="agent-revisions-panel">
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {!draft && latest && (
        <div className="flex gap-sm" style={{ marginBlockEnd: 'var(--spacing-sm)' }}>
          <button type="button" className="button-secondary button-sm" onClick={() => setPinning(latest)} data-testid="revision-assets-new" {...tip(t('tips.assets.pinsNewDraft'))}>
            {t('components.assets.pinsNewDraftButton')}
          </button>
        </div>
      )}
      {revisions.length === 0 ? (
        <div className="text-muted">{t('components.revisions.empty')}</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="agent-revisions">
            <thead>
              <tr>
                {th('number')}
                {th('state')}
                {th('author')}
                {th('changeNote')}
                {th('publishedUtc')}
                {th('assetPins')}
                <th scope="col" className="right" {...tip(t('tips.revisions.columns.actions'))}>{t('components.revisions.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((r) => (
                <tr key={r.id} data-revision={r.number} data-state={r.state}>
                  <td>
                    <strong>{t('components.revisions.number', { number: r.number })}</strong>{' '}
                    {latest?.id === r.id && <Badge tone="success" tip={t('tips.revisions.latest')}>{t('components.revisions.latest')}</Badge>}
                  </td>
                  <td>
                    <RevisionStateBadge state={r.state} t={t} />
                  </td>
                  <td>{r.authorName || '-'}</td>
                  <td>{r.changeNote || '-'}</td>
                  <td>{r.publishedUtc ? <span {...tip(formatDateTime(r.publishedUtc, lng))}>{formatRelativeTime(r.publishedUtc, lng)}</span> : '-'}</td>
                  <td data-cell="assetPins">
                    {revisionPins(r).length ? (
                      <span className="asset-pins">
                        {revisionPins(r).map((p) => (
                          <Badge key={p.assetId} tip={t(p.version ? 'tips.assets.pinnedVersion' : 'tips.assets.pinnedCurrent')}>
                            {pinLabel(t, p, names)}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="right">
                    <span className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="button-ghost button-sm" onClick={() => compareWith(r)} data-testid="revision-compare" {...tip(t('tips.revisions.compare'))}>
                        {t('components.revisions.compare')}
                      </button>
                      {r.state === 'Draft' && (
                        <>
                          <button type="button" className="button-primary button-sm" onClick={() => setPublishing(r)} data-testid="revision-publish" {...tip(t('tips.revisions.publish'))}>
                            {t('components.revisions.publish')}
                          </button>
                          <button type="button" className="button-ghost button-sm" onClick={() => setPinning(r)} data-testid="revision-assets" {...tip(t('tips.assets.editPins'))}>
                            {t('components.assets.editPins')}
                          </button>
                          <button type="button" className="button-ghost button-sm" onClick={() => setDiscarding(r)} data-testid="revision-discard" {...tip(t('tips.revisions.discard'))}>
                            {t('components.revisions.discard')}
                          </button>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {revisions.length > 1 && (
        <div className="revision-compare" data-testid="revision-compare-panel">
          <h3 className="section-title">{t('components.revisions.compareTitle')}</h3>
          <div className="filter-inline">
            <label className="filter-select" {...tip(t('tips.revisions.from'))}>
              <span>{t('components.revisions.from')}</span>
              <select value={pair.from} onChange={(e) => setPair((p) => ({ ...p, from: e.target.value }))} data-testid="revision-diff-from" aria-label={t('components.revisions.from')} {...tip(t('tips.revisions.from'))}>
                <option value="">-</option>
                {revisions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {label(r)}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-select" {...tip(t('tips.revisions.to'))}>
              <span>{t('components.revisions.to')}</span>
              <select value={pair.to} onChange={(e) => setPair((p) => ({ ...p, to: e.target.value }))} data-testid="revision-diff-to" aria-label={t('components.revisions.to')} {...tip(t('tips.revisions.to'))}>
                <option value="">-</option>
                {revisions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {label(r)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <RevisionDiff diff={diff} error={diffError} pair={pair} t={t} />
        </div>
      )}

      {publishing && (
        <PublishModal
          agent={agent}
          revision={publishing}
          onClose={() => setPublishing(null)}
          onPublished={() => {
            setPublishing(null);
            load();
            onChanged?.();
          }}
        />
      )}
      {pinning && (
        <AgentAssetPinsModal
          agent={agent}
          revision={pinning}
          onClose={() => setPinning(null)}
          onSaved={() => {
            setPinning(null);
            load();
            onChanged?.();
          }}
        />
      )}
      <ConfirmModal
        open={!!discarding}
        danger
        title={discarding ? t('components.revisions.discardTitle', { number: discarding.number }) : ''}
        message={t('components.revisions.discardMessage')}
        confirmLabel={t('components.revisions.discard')}
        confirmTip={t('tips.revisions.discardConfirm')}
        onConfirm={discard}
        onCancel={() => setDiscarding(null)}
      />
    </div>
  );
}

/** Field-level changes between two revisions; long or multi-line values render as a line diff. */
export function RevisionDiff({ diff, error, pair, t }) {
  if (!pair.from || !pair.to || pair.from === pair.to) return <p className="text-muted">{t('components.revisions.pickTwo')}</p>;
  if (error) return <ErrorBanner message={errorMessage(t, error)} />;
  if (!diff) return <LoadingState />;
  if (diff.identical || !(diff.changes || []).length) {
    return (
      <p className="text-muted" data-testid="revision-diff-identical">
        {t('components.revisions.identical', { from: diff.fromNumber, to: diff.toNumber })}
      </p>
    );
  }
  const empty = <span className="text-muted">{t('components.revisions.emptyValue')}</span>;
  const cell = (v) => (diffValue(v) ? <code className="diff-inline">{diffValue(v)}</code> : empty);
  const th = (key) => (
    <th scope="col" {...tip(t(`tips.revisions.diffColumns.${key}`))}>
      {t(`components.revisions.diffColumns.${key}`)}
    </th>
  );
  return (
    <div data-testid="revision-diff">
      <p className="text-muted">{t('components.revisions.diffSummary', { changed: diff.changes.length, from: diff.fromNumber, to: diff.toNumber })}</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {th('field')}
              {th('change')}
              {th('before')}
              {th('after')}
            </tr>
          </thead>
          <tbody>
            {diff.changes.map((c, i) => (
              <tr key={`${c.field}-${i}`} data-field={c.field} data-change={c.changeType}>
                <td>
                  <code>{c.field}</code>
                </td>
                <td>
                  <Badge tone={c.changeType === 'Added' ? 'success' : c.changeType === 'Removed' ? 'danger' : 'warning'} tip={enumTip(t, 'revisionChangeType', c.changeType)}>
                    {enumLabel(t, 'revisionChangeType', c.changeType)}
                  </Badge>
                </td>
                {isBlockValue(c.from) || isBlockValue(c.to) ? (
                  <td colSpan={2}>
                    <DiffViewer before={diffValue(c.from)} after={diffValue(c.to)} beforeLabel={t('components.revisions.number', { number: diff.fromNumber })} afterLabel={t('components.revisions.number', { number: diff.toNumber })} />
                  </td>
                ) : (
                  <>
                    <td>{cell(c.from)}</td>
                    <td>{cell(c.to)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Publish a draft with an optional change note. Shows server refusals (RevisionUnchanged, RevisionPublished) in place. */
function PublishModal({ agent, revision, onClose, onPublished }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [note, setNote] = useState(revision.changeNote || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = note.trim() ? { changeNote: note.trim() } : {};
      const published = await apiClient.publishAgentRevision(tenantId, agent.id, revision.id, body);
      addToast({ type: 'success', message: t('components.revisions.published', { number: published?.number ?? revision.number }) });
      onPublished(published);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('components.revisions.publishTitle', { number: revision.number })}
      headerMeta={agent.name}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.close'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="revision-publish-submit" {...tip(t('tips.revisions.publishSubmit'))}>
            {busy ? t('components.revisions.publishing') : t('components.revisions.publish')}
          </button>
        </>
      }
    >
      {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />}
      <p className="field-hint">{t('components.revisions.publishBody', { number: revision.number })}</p>
      <div className="field">
        <label htmlFor="revision-change-note" {...tip(t('tips.revisions.changeNote'))}>{t('components.revisions.changeNote')}</label>
        <textarea
          id="revision-change-note"
          rows={3}
          maxLength={2000}
          value={note}
          placeholder={t('components.revisions.changeNotePlaceholder')}
          onChange={(e) => setNote(e.target.value)}
          data-testid="revision-change-note"
          {...tip(t('tips.revisions.changeNote'))}
        />
      </div>
    </Modal>
  );
}
