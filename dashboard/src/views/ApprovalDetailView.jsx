import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CodeBlock from '../components/CodeBlock';
import CopyableId from '../components/CopyableId';
import CopyButton from '../components/CopyButton';
import NamedId from '../components/NamedId';
import JsonViewerModal from '../components/JsonViewerModal';
import ApprovalDecideModal from '../components/ApprovalDecideModal';
import { ApprovalStatusBadge, ApprovalDecisionBadge } from '../components/ApprovalBadges';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { formatMs } from '../utils/telemetry';
import { jsonToText } from '../utils/jsonFields';

const POLL_MS = 5000;

function Detail({ name, t, span = false, children }) {
  return (
    <div className={`detail-item ${span ? 'detail-item-span' : ''}`} data-approval-field={name}>
      <div className="detail-item-label" {...tip(t(`tips.resources.approvals.${name}`))}>
        {t(`resources.approvals.fields.${name}`)}
      </div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

function Link({ to, tipText, children, testId }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      data-testid={testId}
      {...tip(tipText)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

/**
 * One permission approval (P12.3) with every field: what the harness asked for (tool, summary, and the redacted input
 * preview), how it was decided (rule, deployment default, person, or timeout), the rule it matched and the rule it
 * suggests, links to its run, agent, and deployment, and Allow and Deny while it is pending. Refreshes while pending.
 */
export default function ApprovalDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [approval, setApproval] = useState(null);
  const [error, setError] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const [deciding, setDeciding] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    apiClient
      .getApproval(tenantId, recordId)
      .then((a) => {
        setApproval(a);
        setError(null);
      })
      .catch((e) => setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  const pending = approval?.status === 'Pending';
  useEffect(() => {
    if (!pending) return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [pending, load]);

  const deploymentId = approval?.deploymentId;
  useEffect(() => {
    if (!apiClient || !deploymentId) return;
    apiClient
      .getDeployment(tenantId, deploymentId)
      .then((d) => setDeployment({ name: d?.name || null, deleted: false }))
      .catch((e) => setDeployment({ name: null, deleted: e?.status === 404 }));
  }, [apiClient, tenantId, deploymentId]);

  if (error && !approval) {
    return (
      <div>
        <PageHeader title={t('views.approvalDetail.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('views.approvalDetail.notFoundTitle')} body={t('views.approvalDetail.notFoundBody')} />}
      </div>
    );
  }
  if (!approval) return <LoadingState />;

  const a = approval;
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'medium' })}</span> : '-');
  const runLink = (id, testId) =>
    id ? (
      <Link to={pathFor('runs', id)} tipText={t('tips.views.approvalDetail.openRun')} testId={testId}>
        <code>{id}</code>
      </Link>
    ) : (
      '-'
    );

  return (
    <div data-testid="approval-detail">
      <PageHeader
        title={t('views.approvalDetail.titleWithTool', { tool: a.toolName || '-' })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={a.id} max={40} /> <ApprovalStatusBadge status={a.status} t={t} /> <ApprovalDecisionBadge decision={a.decision} t={t} />
          </span>
        }
        actions={
          <>
            <Link to={pathFor('approvals')} tipText={t('tips.views.approvalDetail.backToInbox')} testId="approval-back">
              {t('views.approvalDetail.backToInbox')}
            </Link>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.approvalDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {pending && (
              <>
                <button type="button" className="button-danger" onClick={() => setDeciding('Deny')} data-testid="approval-deny" {...tip(t('tips.resources.approvals.actions.deny'))}>
                  {t('resources.approvals.actions.deny')}
                </button>
                <button type="button" className="button-primary" onClick={() => setDeciding('Allow')} data-testid="approval-allow" {...tip(t('tips.resources.approvals.actions.allow'))}>
                  {t('resources.approvals.actions.allow')}
                </button>
              </>
            )}
          </>
        }
      />

      {pending && (
        <div className="warning-banner" role="status" data-testid="approval-pending-banner">
          {a.expiresUtc
            ? t('views.approvalDetail.pendingExpires', { when: formatRelativeTime(a.expiresUtc, lng), decision: enumLabel(t, 'approvalDecision', a.timeoutDecision || 'Deny') })
            : t('views.approvalDetail.pending')}
        </div>
      )}

      <div className="panel detail-grid">
        <Detail name="status" t={t}>
          <ApprovalStatusBadge status={a.status} t={t} />
        </Detail>
        <Detail name="decision" t={t}>
          <ApprovalDecisionBadge decision={a.decision} t={t} />
        </Detail>
        <Detail name="decisionSource" t={t}>
          {a.decisionSource ? <span {...tip(enumTip(t, 'approvalSource', a.decisionSource))}>{enumLabel(t, 'approvalSource', a.decisionSource)}</span> : '-'}
        </Detail>
        <Detail name="decidedBy" t={t}>{a.decidedBy || '-'}</Detail>
        <Detail name="toolName" t={t}>
          <code>{a.toolName}</code>
        </Detail>
        <Detail name="kind" t={t}>
          {a.kind ? <span {...tip(enumTip(t, 'approvalKind', a.kind))}>{enumLabel(t, 'approvalKind', a.kind)}</span> : '-'}
        </Detail>
        <Detail name="harnessType" t={t}>{enumLabel(t, 'harnessType', a.harnessType)}</Detail>
        <Detail name="agentName" t={t}>
          {a.agentId ? (
            <Link to={pathFor('agents', a.agentId)} tipText={t('tips.views.approvalDetail.openAgent')} testId="approval-agent-link">
              {a.agentName || a.agentId}
            </Link>
          ) : (
            '-'
          )}
        </Detail>
        <Detail name="runId" t={t}>{runLink(a.runId, 'approval-run-link')}</Detail>
        <Detail name="rootRunId" t={t}>{runLink(a.rootRunId, 'approval-root-run-link')}</Detail>
        <Detail name="deploymentId" t={t}>
          {a.deploymentId ? (
            deployment?.name ? (
              <span className="inline-meta">
                <Link to={pathFor('deployments', null, { search: deployment.name })} tipText={t('tips.views.approvalDetail.openDeployment')} testId="approval-deployment-link">
                  {deployment.name}
                </Link>
                <CopyButton value={a.deploymentId} tipText={t('tips.copy.id')} />
              </span>
            ) : (
              <NamedId id={a.deploymentId} name={deployment?.deleted ? a.deploymentId : null} deleted={!!deployment?.deleted} />
            )
          ) : (
            '-'
          )}
        </Detail>
        <Detail name="leaseEpoch" t={t}>{a.leaseEpoch ?? '-'}</Detail>
        <Detail name="requestedUtc" t={t}>{when(a.requestedUtc || a.createdUtc)}</Detail>
        <Detail name="expiresUtc" t={t}>{when(a.expiresUtc)}</Detail>
        <Detail name="decidedUtc" t={t}>{when(a.decidedUtc)}</Detail>
        <Detail name="waitMs" t={t}>{formatMs(a.waitMs ?? null, lng, t('common.generic.notAvailable'))}</Detail>
        <Detail name="timeoutDecision" t={t}>
          <ApprovalDecisionBadge decision={a.timeoutDecision} t={t} />
        </Detail>
        <Detail name="toolCallId" t={t}>{a.toolCallId ? <CopyableId value={a.toolCallId} max={32} /> : '-'}</Detail>
        <Detail name="reason" t={t} span>
          {a.reason || '-'}
        </Detail>
      </div>

      <section className="panel" aria-labelledby="approval-request-title">
        <h2 id="approval-request-title" className="section-title" {...tip(t('tips.views.approvalDetail.request'))}>
          {t('views.approvalDetail.request')}
        </h2>
        <div className="flex-col gap-md">
          <Detail name="summary" t={t} span>
            {a.summary ? <code className="approval-summary">{a.summary}</code> : '-'}
          </Detail>
          <div className="detail-item detail-item-span">
            <div className="detail-item-label" {...tip(t('tips.resources.approvals.inputPreview'))}>
              {t('resources.approvals.fields.inputPreview')}
            </div>
            <div data-testid="approval-input-preview">
              <CodeBlock value={a.input ? jsonToText(a.input) : a.inputPreview} prettyJson emptyText={t('views.approvalDetail.noInput')} />
            </div>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="approval-rules-title">
        <h2 id="approval-rules-title" className="section-title" {...tip(t('tips.views.approvalDetail.rules'))}>
          {t('views.approvalDetail.rules')}
        </h2>
        <div className="detail-grid">
          <Detail name="rulePattern" t={t}>
            {a.rulePattern ? <code data-testid="approval-rule-pattern">{a.rulePattern}</code> : t('views.approvalDetail.noRule')}
          </Detail>
          <Detail name="ruleId" t={t}>{a.ruleId ? <CopyableId value={a.ruleId} /> : '-'}</Detail>
          <Detail name="suggestedRule" t={t}>
            {a.suggestedRule ? (
              <span className="inline-meta">
                <code data-testid="approval-suggested-rule">{a.suggestedRule}</code>
                <CopyButton value={a.suggestedRule} tipText={t('tips.views.approvalDetail.copyRule')} />
              </span>
            ) : (
              '-'
            )}
          </Detail>
          <Detail name="rememberedRuleId" t={t}>{a.rememberedRuleId ? <CopyableId value={a.rememberedRuleId} /> : '-'}</Detail>
        </div>
      </section>

      {deciding && (
        <ApprovalDecideModal
          approval={a}
          initialDecision={deciding}
          onClose={() => setDeciding(null)}
          onDecided={(decided) => {
            setDeciding(null);
            if (decided) setApproval(decided);
            load();
          }}
        />
      )}
      <JsonViewerModal open={jsonOpen} value={a} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
