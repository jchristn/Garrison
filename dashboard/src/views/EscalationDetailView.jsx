import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import OpenTrailLink from '../components/trail/OpenTrailLink';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import EscalationAnswerModal from '../components/EscalationAnswerModal';
import { EscalationStatusBadge, EscalationSeverityBadge } from '../components/EscalationBadges';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useOpenEscalations } from '../context/EscalationsContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { deniedProps, permissionDenied } from '../utils/permissions';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { enumTip } from '../utils/tips';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { isAnswerable, optionLabel, targetText } from '../utils/escalations';

const POLL_MS = 5000;

function Detail({ name, t, span = false, children }) {
  return (
    <div className={`detail-item ${span ? 'detail-item-span' : ''}`} data-escalation-field={name}>
      <div className="detail-item-label" {...tip(t(`tips.resources.escalations.${name}`))}>
        {t(`resources.escalations.fields.${name}`)}
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
 * One escalation (AA2.13): the question and context the run wrote, its options and default answer, who it is
 * addressed to and what happens when it times out, links to the raising run, its keeper and tick, and the escalations
 * it was passed up from or to, and the answer once there is one. Answer and Cancel while it is open; refreshes while
 * open.
 */
export default function EscalationDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const { refresh } = useOpenEscalations();
  const [escalation, setEscalation] = useState(null);
  const [error, setError] = useState(null);
  const [answering, setAnswering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [keeperName, setKeeperName] = useState(null);
  const permissions = useCallerPermissions();
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    apiClient
      .getEscalation(tenantId, recordId)
      .then((e) => {
        setEscalation(e);
        setError(null);
      })
      .catch((e) => setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  // UT-12: name the keeper rather than show its identifier. The identifier stays in the tooltip.
  const mandateId = escalation?.mandateId || null;
  useEffect(() => {
    if (!apiClient || !mandateId || typeof apiClient.getMandate !== 'function') return undefined;
    let cancelled = false;
    apiClient
      .getMandate(tenantId, mandateId)
      .then((m) => !cancelled && setKeeperName(m?.name || null))
      .catch(() => !cancelled && setKeeperName(null));
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId, mandateId]);

  const open = escalation?.status === 'Open';
  useEffect(() => {
    if (!open) return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [open, load]);

  if (error && !escalation) {
    return (
      <div>
        <PageHeader title={t('views.escalationDetail.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('views.escalationDetail.notFoundTitle')} body={t('views.escalationDetail.notFoundBody')} />}
      </div>
    );
  }
  if (!escalation) return <LoadingState />;

  const e = escalation;
  const answerable = isAnswerable(e);
  const denied = permissionDenied(t, permissions, 'Escalation', 'Update', { resourceId: e.id });
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'medium' })}</span> : '-');
  const runLink = (id, testId) =>
    id ? (
      <Link to={pathFor('runs', id)} tipText={t('tips.views.escalationDetail.openRun')} testId={testId}>
        <code>{id}</code>
      </Link>
    ) : (
      '-'
    );
  const escalationLink = (id, testId) =>
    id ? (
      <Link to={pathFor('escalations', id)} tipText={t('tips.views.escalationDetail.openEscalation')} testId={testId}>
        <code>{id}</code>
      </Link>
    ) : (
      '-'
    );
  const cancel = async () => {
    try {
      const cancelled = await apiClient.cancelEscalation(tenantId, e.id, {});
      addToast({ type: 'success', message: t('resources.escalations.toasts.cancelled') });
      if (cancelled) setEscalation(cancelled);
    } catch (err) {
      addToast({ type: 'error', message: errorMessage(t, err) });
    } finally {
      setCancelling(false);
      refresh();
      load();
    }
  };

  return (
    <div data-testid="escalation-detail">
      <PageHeader
        title={t('views.escalationDetail.titleWithAgent', { agent: e.agentName || e.agentId || '-' })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={e.id} max={40} /> <EscalationStatusBadge escalation={e} t={t} /> <EscalationSeverityBadge severity={e.severity} t={t} />
          </span>
        }
        actions={
          <>
            <Link to={pathFor('escalations')} tipText={t('tips.views.escalationDetail.back')} testId="escalation-back">
              {t('views.escalationDetail.back')}
            </Link>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.escalationDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {answerable && (
              <>
                <button type="button" className="button-danger" onClick={() => !denied && setCancelling(true)} data-testid="escalation-cancel" {...deniedProps(denied)} {...tip(denied || t('tips.resources.escalations.actions.cancel'))}>
                  {t('resources.escalations.actions.cancel')}
                </button>
                <button type="button" className="button-primary" onClick={() => !denied && setAnswering(true)} data-testid="escalation-answer" {...deniedProps(denied)} {...tip(denied || t('tips.resources.escalations.actions.answer'))}>
                  {t('resources.escalations.actions.answer')}
                </button>
              </>
            )}
          </>
        }
      />

      {answerable && (
        <div className="warning-banner" role="status" data-testid="escalation-open-banner">
          {e.mode === 'Blocking' ? t('views.escalationDetail.openBlocking') : t('views.escalationDetail.open')}{' '}
          {e.expiresUtc && t('views.escalationDetail.expires', { when: formatRelativeTime(e.expiresUtc, lng), action: enumLabel(t, 'escalationTimeoutAction', e.timeoutAction) })}
        </div>
      )}
      {open && e.escalatedToId && (
        <div className="info-banner" role="status" data-testid="escalation-passed-up-banner">
          {t('views.escalationDetail.passedUp')} {escalationLink(e.escalatedToId, 'escalation-escalated-to-banner-link')}
        </div>
      )}

      <section className="panel" aria-labelledby="escalation-question-title">
        <h2 id="escalation-question-title" className="section-title" {...tip(t('tips.views.escalationDetail.question'))}>
          {t('views.escalationDetail.question')}
        </h2>
        <p className="escalation-question" data-testid="escalation-question">
          {e.question}
        </p>
        {e.context && (
          <>
            <div className="detail-item-label" {...tip(t('tips.resources.escalations.context'))}>
              {t('resources.escalations.fields.context')}
            </div>
            <pre className="escalation-context" data-testid="escalation-context">
              {e.context}
            </pre>
          </>
        )}
        {(e.options || []).length > 0 && (
          <>
            <div className="detail-item-label" {...tip(t('tips.resources.escalations.options'))}>
              {t('resources.escalations.fields.options')}
            </div>
            <ul className="escalation-options" data-testid="escalation-options">
              {e.options.map((o) => (
                <li key={o.key} className={e.answerChoice === o.key ? 'chosen' : ''}>
                  <code>{o.key}</code>
                  {o.label && <span>{o.label}</span>}
                  {o.key === e.defaultAnswer && <span className="pill pill-neutral">{t('components.escalations.default')}</span>}
                  {e.answerChoice === o.key && <span className="pill pill-success">{t('views.escalationDetail.chosen')}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {e.defaultAnswer && !(e.options || []).some((o) => o.key === e.defaultAnswer) && (
          <p className="text-muted">{t('components.escalations.defaultAnswer', { answer: e.defaultAnswer })}</p>
        )}
      </section>

      {(e.answerChoice || e.answerText || (e.status !== 'Open' && e.resolvedUtc)) && (
        <section className="panel" aria-labelledby="escalation-answer-title" data-testid="escalation-answer-panel">
          <h2 id="escalation-answer-title" className="section-title" {...tip(t('tips.views.escalationDetail.answer'))}>
            {t('views.escalationDetail.answer')}
          </h2>
          <div className="detail-grid">
            <Detail name="answerChoice" t={t}>{e.answerChoice ? optionLabel(e, e.answerChoice) : '-'}</Detail>
            <Detail name="resolvedBy" t={t}>{e.resolvedBy || '-'}</Detail>
            <Detail name="resolutionSource" t={t}>
              {e.resolutionSource ? <span {...tip(enumTip(t, 'escalationResolutionSource', e.resolutionSource))}>{enumLabel(t, 'escalationResolutionSource', e.resolutionSource)}</span> : '-'}
            </Detail>
            <Detail name="resolvedUtc" t={t}>{when(e.resolvedUtc)}</Detail>
            <Detail name="answerText" t={t} span>
              {e.answerText ? <pre className="escalation-context">{e.answerText}</pre> : '-'}
            </Detail>
          </div>
        </section>
      )}

      <div className="panel detail-grid">
        <Detail name="status" t={t}>
          <EscalationStatusBadge escalation={e} t={t} />
        </Detail>
        <Detail name="severity" t={t}>
          <EscalationSeverityBadge severity={e.severity} t={t} />
        </Detail>
        <Detail name="mode" t={t}>
          <span {...tip(enumTip(t, 'escalationMode', e.mode))}>{enumLabel(t, 'escalationMode', e.mode)}</span>
        </Detail>
        <Detail name="target" t={t}>
          <span {...tip(enumTip(t, 'escalationTargetKind', e.targetKind))}>{enumLabel(t, 'escalationTargetKind', e.targetKind)}</span>
          {targetText(e) ? `: ${targetText(e)}` : ''}
        </Detail>
        <Detail name="agent" t={t}>
          {e.agentId ? (
            <Link to={pathFor('agents', e.agentId)} tipText={t('tips.views.escalationDetail.openAgent')} testId="escalation-agent-link">
              {e.agentName || e.agentId}
            </Link>
          ) : (
            '-'
          )}
        </Detail>
        <Detail name="raisingRunId" t={t}>
          {runLink(e.raisingRunId, 'escalation-run-link')} <OpenTrailLink runId={e.raisingRunId} step={e.id} testId="escalation-open-trail" />
        </Detail>
        <Detail name="mandate" t={t}>
          {e.mandateId ? (
            <Link to={pathFor('keepers', e.mandateId)} tipText={keeperName ? t('tips.views.escalationDetail.openKeeperNamed', { id: e.mandateId }) : t('tips.views.escalationDetail.openKeeper')} testId="escalation-keeper-link">
              {keeperName || <code>{e.mandateId}</code>}
            </Link>
          ) : (
            '-'
          )}
        </Detail>
        <Detail name="mandateTickId" t={t}>{e.mandateTickId ? <CopyableId value={e.mandateTickId} /> : '-'}</Detail>
        <Detail name="routedRunId" t={t}>{runLink(e.routedRunId, 'escalation-routed-run-link')}</Detail>
        <Detail name="parentEscalationId" t={t}>{escalationLink(e.parentEscalationId, 'escalation-parent-link')}</Detail>
        <Detail name="escalatedToId" t={t}>{escalationLink(e.escalatedToId, 'escalation-escalated-to-link')}</Detail>
        <Detail name="timeoutAction" t={t}>
          <span {...tip(enumTip(t, 'escalationTimeoutAction', e.timeoutAction))}>{enumLabel(t, 'escalationTimeoutAction', e.timeoutAction)}</span>
        </Detail>
        <Detail name="expiresUtc" t={t}>{when(e.expiresUtc)}</Detail>
        <Detail name="createdUtc" t={t}>{when(e.createdUtc)}</Detail>
        <Detail name="leaseEpoch" t={t}>{e.leaseEpoch ?? '-'}</Detail>
      </div>

      {answering && (
        <EscalationAnswerModal
          escalation={e}
          onClose={() => setAnswering(false)}
          onAnswered={(answered) => {
            setAnswering(false);
            if (answered) setEscalation(answered);
            load();
          }}
        />
      )}
      <ConfirmModal
        open={cancelling}
        danger
        title={t('resources.escalations.cancelTitle')}
        message={t(e.mode === 'Blocking' ? 'resources.escalations.cancelBlocking' : 'resources.escalations.cancelMessage', { agent: e.agentName || e.agentId || '-' })}
        confirmLabel={t('resources.escalations.actions.cancel')}
        confirmTip={t('tips.resources.escalations.actions.cancel')}
        onCancel={() => setCancelling(false)}
        onConfirm={cancel}
      />
      <JsonViewerModal open={jsonOpen} value={e} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
