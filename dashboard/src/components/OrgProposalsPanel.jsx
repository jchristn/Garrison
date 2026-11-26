import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import StudioLink from './studio/StudioLink';
import ProposalDiff from './ProposalDiff';
import ProposalEvidence from './ProposalEvidence';
import { ProposalDecisionBadge } from './ChangeRuleBadges';
import { EmptyState } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { holds } from '../utils/apps';
import { errorMessageWithDetail } from '../utils/errors';
import { proposalDecision } from '../utils/changeRules';

const VIEWS = ['all', 'needsApproval', 'applied'];

const inView = (view, p) => (view === 'needsApproval' ? p.status === 'PendingApproval' : view === 'applied' ? p.status === 'Applied' : true);

/** The rule names a proposal applied by, from its ruleIds; an unknown ID shows as itself. */
function ruleNamesOf(proposal, rules) {
  return (proposal?.ruleIds || []).map((id) => rules[id] || id);
}

/** The decision in words for a list row: which rules applied it, who approved or denied it, or that it waits. */
function decisionDetail(t, proposal, rules) {
  const decision = proposalDecision(proposal);
  if (decision === 'rule') {
    const names = ruleNamesOf(proposal, rules);
    return names.length ? t('orgProposals.byRules', { names: names.join(', ') }) : '';
  }
  if (decision === 'approved' || decision === 'denied') return proposal.decidedBy ? t('orgProposals.byPerson', { name: proposal.decidedBy }) : '';
  return '';
}

/**
 * One proposal (AA8.12): who proposed it and where, how it was decided, the changes with the rule that covers each or why
 * it needs a person, the hard-limit refusals, the org revision it was recorded as, and, while it waits, Approve and
 * Deny with a reason.
 */
function ProposalModal({ organization, summary, rules, revisions, deniedDecide, onClose, onDecided }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [proposal, setProposal] = useState(summary);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    apiClient
      .getOrgProposal(tenantId, organization.id, summary.draftId)
      .then((p) => active && setProposal(p))
      .catch((e) => active && setError(e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, organization.id, summary.draftId]);

  const decision = proposalDecision(proposal);
  const pending = proposal.status === 'PendingApproval';
  const diff = proposal.diff || null;
  const revision = (revisions || []).find((r) => r.draftId && r.draftId === proposal.draftId);
  const names = ruleNamesOf(proposal, rules);
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');

  const decide = async (allow) => {
    if (deniedDecide || busy) return;
    setBusy(true);
    setError(null);
    try {
      const decided = await apiClient.decideOrgProposal(tenantId, organization.id, proposal.draftId, { allow, reason: reason.trim() || null });
      setProposal((prev) => ({ ...prev, ...decided, diff: decided?.diff || prev.diff }));
      addToast({ type: 'success', message: t(allow ? 'orgProposals.toasts.approved' : 'orgProposals.toasts.denied', { title: proposal.title }) });
      onDecided?.(decided);
      onClose();
    } catch (e) {
      setError(e);
      onDecided?.(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose()}
      title={t('orgProposals.review.title', { title: proposal.title || proposal.draftId })}
      footer={
        pending ? (
          <>
            <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
              {t('common.actions.cancel')}
            </button>
            <button type="button" className="button-danger" aria-disabled={deniedDecide || busy ? 'true' : undefined} onClick={() => decide(false)} data-testid="org-proposal-deny" {...tip(deniedDecide || t('tips.orgProposals.review.deny'))}>
              {t('orgProposals.review.deny')}
            </button>
            <button type="button" className="button-primary" aria-disabled={deniedDecide || busy ? 'true' : undefined} onClick={() => decide(true)} data-testid="org-proposal-approve" {...tip(deniedDecide || t('tips.orgProposals.review.approve'))}>
              {t('orgProposals.review.approve')}
            </button>
          </>
        ) : null
      }
    >
      <div className="flex-col gap-md" data-testid="org-proposal">
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-item-label" {...tip(t('tips.orgProposals.columns.decision'))}>
              {t('orgProposals.columns.decision')}
            </div>
            <div className="detail-item-value">
              <ProposalDecisionBadge decision={decision} t={t} />
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label" {...tip(t('tips.orgProposals.columns.unit'))}>
              {t('orgProposals.columns.unit')}
            </div>
            <div className="detail-item-value">{proposal.unitName || proposal.unitId || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label" {...tip(t('tips.orgProposals.columns.agent'))}>
              {t('orgProposals.columns.agent')}
            </div>
            <div className="detail-item-value">{proposal.agentName || proposal.agentId || '-'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label" {...tip(t('tips.orgProposals.review.run'))}>
              {t('orgProposals.review.run')}
            </div>
            <div className="detail-item-value">
              {proposal.originRunId ? (
                <StudioLink to={pathFor('runs', proposal.originRunId)} testId="org-proposal-run" tipText={t('tips.orgProposals.review.openRun')}>
                  <code>{proposal.originRunId}</code>
                </StudioLink>
              ) : (
                '-'
              )}
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label" {...tip(t('tips.orgProposals.columns.updated'))}>
              {t('orgProposals.columns.updated')}
            </div>
            <div className="detail-item-value">{when(proposal.lastUpdateUtc)}</div>
          </div>
        </div>

        {decision === 'rule' && (
          <div className="info-banner" role="status" data-testid="org-proposal-by-rule">
            {t('orgProposals.review.appliedByRule', { names: names.join(', ') || '-' })}
          </div>
        )}
        {(decision === 'approved' || decision === 'denied') && (
          <div className={decision === 'approved' ? 'info-banner' : 'warning-banner'} role="status" data-testid="org-proposal-decided">
            {t(decision === 'approved' ? 'orgProposals.review.approvedBy' : 'orgProposals.review.deniedBy', { name: proposal.decidedBy || '-' })}
            {proposal.reason ? ` ${t('orgProposals.review.reasonGiven', { reason: proposal.reason })}` : ''}
          </div>
        )}
        {revision && (
          <p className="text-muted" data-testid="org-proposal-revision">
            {t('orgProposals.review.revision', { number: revision.number })}
          </p>
        )}

        {loading && <div className="text-muted">{t('common.generic.loading')}</div>}
        {!loading && !diff && proposal.status === 'Applied' && <p className="text-muted">{t('orgProposals.review.appliedNoDiff')}</p>}

        <ProposalDiff diff={diff} t={t} />
        <ProposalEvidence evidence={proposal.evidence} t={t} lng={lng} />


        {pending && (
          <div className="field">
            <label htmlFor="org-proposal-reason" {...tip(t('tips.orgProposals.review.reason'))}>
              {t('orgProposals.review.reason')}
            </label>
            <input id="org-proposal-reason" value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} placeholder={t('orgProposals.review.reasonPlaceholder')} data-testid="org-proposal-reason" {...tip(t('tips.orgProposals.review.reason'))} />
          </div>
        )}
        {pending && deniedDecide && <p className="text-muted">{deniedDecide}</p>}
        {error && (
          <div className="error-banner" role="alert" data-testid="org-proposal-error">
            {errorMessageWithDetail(t, error)}
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * The Proposals tab of an organization (AA8.12): changes its executives proposed inside their subtrees, newest change
 * first, each with its decision. Those that change rules covered completely applied at once and say which rules; the
 * rest wait for a person, who opens one to see the diff, the rule or reason for each change, and approves or denies it.
 */
export default function OrgProposalsPanel({ organization, proposals, revisions, permissions, onChanged }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const lng = i18n.language;
  const [view, setView] = useState('all');
  const [rules, setRules] = useState({});
  const [open, setOpen] = useState(null);

  // Rule names for the rule IDs each applied proposal carries.
  useEffect(() => {
    if (!apiClient?.listChangeRules || !organization?.id) return undefined;
    let active = true;
    apiClient
      .listChangeRules(tenantId, { organization: organization.id, pageNumber: 1, pageSize: 1000 })
      .then((r) => active && setRules(Object.fromEntries((r?.items || []).map((x) => [x.id, x.name]))))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, organization?.id, proposals]);

  const deniedDecide = holds(permissions, 'Approval', 'Update') ? '' : t('tips.orgProposals.deniedDecide');
  const shown = (proposals || []).filter((p) => inView(view, p));
  const pendingCount = (proposals || []).filter((p) => p.status === 'PendingApproval').length;
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');

  return (
    <section className="panel" aria-label={t('orgProposals.title')} data-testid="org-proposals">
      <div className="org-chart-bar">
        <div className="range-group segmented" role="group" aria-label={t('orgProposals.views.label')}>
          {VIEWS.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} className={`range-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)} data-testid={`org-proposals-view-${v}`} {...tip(t(`tips.orgProposals.views.${v}`))}>
              {v === 'needsApproval' ? t('orgProposals.views.needsApprovalCount', { count: pendingCount }) : t(`orgProposals.views.${v}`)}
            </button>
          ))}
        </div>
        <StudioLink to={pathFor('changeRules', null, { organization: organization.id })} className="button-secondary button-sm" testId="org-proposals-rules" tipText={t('tips.orgProposals.rulesLink')}>
          {t('orgProposals.rulesLink')}
        </StudioLink>
      </div>
      <p className="text-muted org-chart-note">{t('orgProposals.note')}</p>
      {shown.length === 0 ? (
        <EmptyState title={t('orgProposals.emptyTitle')} body={t('orgProposals.emptyBody')} />
      ) : (
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t('orgProposals.title')}>
          <table className="data-table compact" data-testid="org-proposals-table">
            <thead>
              <tr>
                {['title', 'unit', 'agent', 'decision', 'updated'].map((c) => (
                  <th key={c} scope="col" {...tip(t(`tips.orgProposals.columns.${c}`))}>
                    {t(`orgProposals.columns.${c}`)}
                  </th>
                ))}
                <th scope="col" className="right" {...tip(t('tips.table.actionsColumn'))}>
                  {t('common.generic.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const detail = decisionDetail(t, p, rules);
                return (
                  <tr key={p.draftId} data-proposal={p.draftId}>
                    <td className="org-text">{p.title || p.draftId}</td>
                    <td>{p.unitName || p.unitId || '-'}</td>
                    <td>{p.agentName || p.agentId || '-'}</td>
                    <td>
                      <span className="org-proposal-decision">
                        <ProposalDecisionBadge decision={proposalDecision(p)} t={t} />
                        {detail && <span className="text-muted" data-testid="org-proposal-detail">{detail}</span>}
                      </span>
                    </td>
                    <td className="nowrap">{when(p.lastUpdateUtc)}</td>
                    <td className="right nowrap">
                      <button type="button" className={p.status === 'PendingApproval' ? 'button-primary button-sm' : 'button-ghost button-sm'} onClick={() => setOpen(p)} data-testid={`org-proposal-open-${p.draftId}`} {...tip(t(p.status === 'PendingApproval' ? 'tips.orgProposals.decide' : 'tips.orgProposals.review.open'))}>
                        {p.status === 'PendingApproval' ? t('orgProposals.decide') : t('orgProposals.review.open')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {open && <ProposalModal key={open.draftId} organization={organization} summary={open} rules={rules} revisions={revisions} deniedDecide={deniedDecide} onClose={() => setOpen(null)} onDecided={onChanged} />}
    </section>
  );
}
