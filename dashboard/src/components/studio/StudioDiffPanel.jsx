import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../StatusBadge';
import { RefreshIcon } from '../Icons';
import { tip } from '../Tooltip';
import StudioLink from './StudioLink';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { pathFor } from '../../config/navConfig';
import { approvalStatusTone } from '../../utils/constants';
import { errorMessage } from '../../utils/errors';
import { enumLabel } from '../../utils/enums';
import { enumTip } from '../../utils/tips';
import { formatNumber } from '../../i18n/formatters';
import { DIFF_CHANGES, diffChangeTone, diffCounts, isDraftOpen, itemKey } from '../../utils/studio';

/**
 * The draft's apply approval (AD7.10): its status, summary, and a link to the approval, and, for a caller permitted to
 * decide approvals and apply manifests, Allow and Deny with a reason (POST /approvals/{id}/decide). 403
 * ApproverLacksPermission and 409 DraftStale (and the other refusals) show as translated messages; either way the
 * workspace reads the draft again.
 */
function ApprovalCard({ approvalId, initial, deniedDecide, onDecided }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [approval, setApproval] = useState(initial || null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiClient || !approvalId) return;
    apiClient
      .getApproval(tenantId, approvalId)
      .then(setApproval)
      .catch(() => {});
  }, [apiClient, tenantId, approvalId]);

  if (!approval) return null;
  const pending = approval.status === 'Pending';

  const decide = async (decision) => {
    if (deniedDecide || busy) return;
    setBusy(true);
    setError(null);
    try {
      const decided = await apiClient.decideApproval(tenantId, approval.id, { decision, reason: reason.trim() || undefined });
      setApproval(decided);
      addToast({ type: 'success', message: t(decision === 'Allow' ? 'components.studio.diff.allowed' : 'components.studio.diff.denied') });
      onDecided?.();
    } catch (e) {
      setError(e);
      onDecided?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="studio-approval" data-testid="studio-approval">
      <div className="inline-meta">
        <span className="form-section-title" {...tip(t('tips.studio.diff.approval'))}>
          {t('components.studio.diff.approval')}
        </span>
        <Badge tone={approvalStatusTone(approval.status)} tip={enumTip(t, 'approvalStatus', approval.status)}>
          {enumLabel(t, 'approvalStatus', approval.status)}
        </Badge>
        <StudioLink to={pathFor('approvals', approval.id)} testId="studio-approval-link" tipText={t('tips.studio.diff.openApproval')}>
          <code>{approval.id}</code>
        </StudioLink>
      </div>
      {approval.summary && <div data-testid="studio-approval-summary">{approval.summary}</div>}
      {pending && deniedDecide && (
        <div className="text-muted" data-testid="studio-approval-waiting" {...tip(deniedDecide)}>
          {t('components.studio.diff.waiting')}
        </div>
      )}
      {pending && !deniedDecide && (
        <div className="studio-decide">
          <div className="field">
            <label htmlFor="studio-decide-reason" {...tip(t('tips.studio.diff.reason'))}>
              {t('components.studio.diff.reason')}
            </label>
            <input id="studio-decide-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('components.studio.diff.reasonPlaceholder')} {...tip(t('tips.studio.diff.reason'))} />
          </div>
          <div className="flex gap-sm items-center">
            <button type="button" className="button-primary" onClick={() => decide('Allow')} disabled={busy} data-testid="studio-approval-allow" {...tip(t('tips.studio.diff.allow'))}>
              {t('components.studio.diff.allow')}
            </button>
            <button type="button" className="button-danger" onClick={() => decide('Deny')} disabled={busy} data-testid="studio-approval-deny" {...tip(t('tips.studio.diff.deny'))}>
              {t('components.studio.diff.deny')}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert" data-testid="studio-approval-error">
          {errorMessage(t, error)}
        </div>
      )}
    </div>
  );
}

/**
 * Diff, validation, and apply for a draft (AD7.10): each item against live configuration (Create, Update, Delete,
 * Unchanged, or Failed, with field changes, the failure, and a stale marker), Validate (a manifest dry run), Request
 * apply with the version read (an approval of kind DraftApply), and the approval with its decision inline.
 */
export default function StudioDiffPanel({ draft, diff, onDiff, onReload, blocked = '', deniedDecide = '' }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [busy, setBusy] = useState('');
  const [error, setError] = useState(null);
  const [requested, setRequested] = useState(null);
  const counts = diffCounts(diff);
  const open = isDraftOpen(draft);
  const approvalId = draft.approvalId || requested?.id || null;

  const refresh = async (validate) => {
    setBusy(validate ? 'validate' : 'diff');
    setError(null);
    try {
      const next = validate ? await apiClient.validateStudioDraft(tenantId, draft.id) : await apiClient.getStudioDraftDiff(tenantId, draft.id);
      onDiff(next);
      if (validate) addToast({ type: next?.valid ? 'success' : 'error', message: t(next?.valid ? 'components.studio.diff.validOk' : 'components.studio.diff.validFailed') });
    } catch (e) {
      setError(e);
    } finally {
      setBusy('');
    }
  };

  const requestApply = async () => {
    if (blocked) return;
    setBusy('apply');
    setError(null);
    try {
      const approval = await apiClient.requestStudioDraftApply(tenantId, draft.id, draft.version);
      setRequested(approval);
      addToast({ type: 'success', message: t('components.studio.diff.requested') });
      onReload();
    } catch (e) {
      setError(e);
      onReload();
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="panel studio-diff" aria-label={t('components.studio.diff.title')} data-testid="studio-diff">
      <div className="studio-row-between">
        <h3 className="section-title" {...tip(t('tips.studio.diff.title'))}>
          {t('components.studio.diff.title')}
        </h3>
        <div className="flex gap-sm items-center">
          <button type="button" className="button-secondary button-sm" onClick={() => refresh(false)} disabled={!!busy} data-testid="studio-diff-refresh" {...tip(t('tips.studio.diff.refresh'))}>
            <RefreshIcon /> {t('components.studio.diff.refresh')}
          </button>
          <button type="button" className="button-secondary button-sm" onClick={() => refresh(true)} disabled={!!busy} data-testid="studio-validate" {...tip(t('tips.studio.diff.validate'))}>
            {busy === 'validate' ? t('components.studio.diff.validating') : t('components.studio.diff.validate')}
          </button>
          <button
            type="button"
            className="button-primary button-sm"
            onClick={requestApply}
            disabled={busy === 'apply'}
            aria-disabled={blocked ? 'true' : undefined}
            data-testid="studio-request-apply"
            {...tip(blocked || t('tips.studio.diff.requestApply'))}
          >
            {busy === 'apply' ? t('components.studio.diff.requesting') : t('components.studio.diff.requestApply')}
          </button>
        </div>
      </div>
      {diff && (
        <div className={diff.valid ? 'info-banner' : 'warning-banner'} role="status" data-testid="studio-diff-summary">
          {t(diff.valid ? 'components.studio.diff.valid' : 'components.studio.diff.invalid', {
            create: formatNumber(counts.Create, {}, lng),
            update: formatNumber(counts.Update, {}, lng),
            delete: formatNumber(counts.Delete, {}, lng),
            unchanged: formatNumber(counts.Unchanged, {}, lng),
            failed: formatNumber(counts.Failed, {}, lng),
            stale: formatNumber(counts.stale, {}, lng)
          })}
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert" data-testid="studio-diff-error">
          {errorMessage(t, error)}
        </div>
      )}
      {!diff ? (
        <div className="text-muted">{t('common.generic.loading')}</div>
      ) : (diff.items || []).length === 0 ? (
        <div className="text-muted">{t('components.studio.diff.empty')}</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="studio-diff-table">
            <thead>
              <tr>
                {['item', 'change', 'details'].map((c) => (
                  <th key={c} scope="col" {...tip(t(`tips.studio.diff.columns.${c}`))}>
                    {t(`components.studio.diff.columns.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diff.items.map((item) => {
                const change = DIFF_CHANGES.includes(item.change) ? item.change : 'Unchanged';
                return (
                  <tr key={itemKey(item)} data-diff={itemKey(item)}>
                    <td>
                      <code>{itemKey(item)}</code>
                    </td>
                    <td className="nowrap">
                      <Badge tone={diffChangeTone(change)} tip={enumTip(t, 'studioDiffChange', change)}>
                        {enumLabel(t, 'studioDiffChange', change)}
                      </Badge>{' '}
                      {item.stale && (
                        <Badge tone="warning" tip={t('tips.studio.items.staleBadge')}>
                          {t('components.studio.items.stale')}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {item.message && (
                        <div className={change === 'Failed' ? 'text-danger' : 'text-muted'}>
                          {item.errorCode ? <code>{item.errorCode}</code> : null} {item.message}
                        </div>
                      )}
                      {(item.changes || []).length > 0 && (
                        <ul className="studio-list studio-field-changes">
                          {item.changes.map((c) => (
                            <li key={c.field}>
                              <code>{c.field}</code>: <span className="studio-before">{c.before ?? t('components.studio.diff.none')}</span> {'->'} <span className="studio-after">{c.after ?? t('components.studio.diff.none')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!item.message && !(item.changes || []).length && '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!open && draft.status === 'Applied' && (
        <div className="info-banner" role="status" data-testid="studio-applied">
          {t('components.studio.diff.applied', { id: draft.manifestApplyId || '-' })}
        </div>
      )}
      {approvalId && <ApprovalCard key={approvalId} approvalId={approvalId} initial={requested} deniedDecide={deniedDecide} onDecided={onReload} />}
    </section>
  );
}
