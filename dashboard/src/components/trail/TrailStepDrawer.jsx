import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CopyableId from '../CopyableId';
import { LoadingState, ErrorBanner } from '../States';
import { XIcon } from '../Icons';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { errorMessage } from '../../utils/errors';
import { enumLabel } from '../../utils/enums';
import { jsonToText } from '../../utils/jsonFields';
import { formatDateTime, formatNumber } from '../../i18n/formatters';
import { formatMs, formatUsd } from '../../utils/telemetry';
import { owningRunId } from '../../utils/trailLayout';
import { TrailState, entrySurfaceLabel, entrySurfaceTip, kindLabel, kindTip, stateTip, stepPath, stepTitle } from './trailParts';

/**
 * Load the record behind a step from its existing detail route (LP-002: the trail itself carries no agent text).
 * Steps without a record of their own (caller, reply, trigger, keeper tick, pipeline run, redacted) load nothing.
 */
export async function loadStepRecord(apiClient, tenantId, trail, node) {
  switch (node.kind) {
    case 'Run':
      return apiClient.getRun(tenantId, node.id);
    case 'Message':
      return apiClient.getMessage(tenantId, node.id);
    case 'Report':
      return apiClient.getReport(tenantId, node.id);
    case 'Escalation':
      return apiClient.getEscalation(tenantId, node.id);
    case 'Approval':
      return apiClient.getApproval(tenantId, node.id);
    case 'FanOutGroup':
      return apiClient.getFanOutGroup(tenantId, node.id);
    case 'Effect': {
      const run = owningRunId(trail, node.id);
      if (!run) return null;
      const operations = await apiClient.listRunOperations(tenantId, run);
      return operations.find((o) => o.id === node.id) || null;
    }
    default:
      return null;
  }
}

/**
 * The pieces of agent-written (or person-written) text a record carries, each with who wrote it and in which run.
 * Returns [{ key, label, text, author, authorIsAgent, runId }]; empty texts are left out.
 */
export function stepTexts(t, node, record) {
  if (!record) return [];
  const out = [];
  const add = (key, label, text, author, authorIsAgent, runId) => {
    const value = jsonToText(text);
    if (value && value.trim()) out.push({ key, label, text: value, author: author || '', authorIsAgent, runId: runId || null });
  };
  switch (node.kind) {
    case 'Run':
      add('result', t('trail.drawer.texts.result'), record.resultText, record.agentName || node.agentName, true, record.id);
      break;
    case 'Message': {
      const agent = !!record.senderAgentId;
      const author = record.senderAgentName || record.senderName || record.senderPrincipalId;
      add('subject', t('trail.drawer.texts.subject'), record.subject, author, agent, record.senderRunId);
      add('body', t('trail.drawer.texts.body'), record.body, author, agent, record.senderRunId);
      break;
    }
    case 'Report': {
      const agent = !!record.authorAgentId;
      const author = record.authorAgentName || record.filedByName;
      add('title', t('trail.drawer.texts.title'), record.title, author, agent, record.runId);
      add('body', t('trail.drawer.texts.body'), record.body, author, agent, record.runId);
      break;
    }
    case 'Escalation':
      add('question', t('trail.drawer.texts.question'), record.question, record.agentName || node.agentName, !!record.agentId || !!record.raisingRunId, record.raisingRunId);
      add('context', t('trail.drawer.texts.context'), record.context, record.agentName || node.agentName, !!record.agentId || !!record.raisingRunId, record.raisingRunId);
      add('answer', t('trail.drawer.texts.answer'), record.answerText || record.answerChoice, record.resolvedBy, record.resolutionSource === 'Agent', record.routedRunId);
      break;
    case 'Approval':
      add('summary', t('trail.drawer.texts.summary'), record.summary, record.agentName || node.agentName, true, record.runId);
      add('input', t('trail.drawer.texts.input'), record.inputPreviewText ?? record.inputPreview ?? record.input, record.agentName || node.agentName, true, record.runId);
      break;
    default:
      break;
  }
  return out;
}

/** One piece of agent-written text, shown as data: a marked block with its provenance, escaped, never as markup. */
function AgentText({ t, item }) {
  const provenance = item.authorIsAgent
    ? item.runId
      ? t('trail.drawer.writtenByAgentInRun', { agent: item.author || t('trail.drawer.unknownAuthor'), run: item.runId })
      : t('trail.drawer.writtenByAgent', { agent: item.author || t('trail.drawer.unknownAuthor') })
    : t('trail.drawer.writtenBy', { name: item.author || t('trail.drawer.unknownAuthor') });
  return (
    <figure className="trail-agent-text" data-testid="trail-agent-text" data-text-key={item.key}>
      <figcaption className="trail-agent-text-caption">
        <span className="trail-agent-text-label">{item.label}</span>
        <span className="trail-agent-text-provenance" data-testid="trail-provenance" {...tip(t('tips.trail.drawer.provenance'))}>
          {provenance}
        </span>
      </figcaption>
      <pre className="trail-agent-text-body">{item.text}</pre>
    </figure>
  );
}

function Field({ label, tipText, children }) {
  return (
    <div className="trail-drawer-field">
      <dt {...tip(tipText)}>{label}</dt>
      <dd>{children ?? '-'}</dd>
    </div>
  );
}

/**
 * The step drawer of the activity trail (LP2.6): the step's kind, state (icon and label), agent, unit, times, tokens,
 * and cost from the trail, then the record loaded from its detail route. Text that an agent wrote (a result, a
 * message, a report, an escalation question, an approval's tool input) is shown as data (AA-025): in a marked block,
 * with a line naming who wrote it and in which run, as escaped plain text. A redacted step shows only its kind.
 * Escape closes the drawer; focus moves to its heading when it opens.
 */
export default function TrailStepDrawer({ trail, node, onClose }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const titleId = useId();
  const headingRef = useRef(null);
  const [state, setState] = useState({ loading: false, record: null, error: null });
  const nodeId = node?.id;
  const nodeKind = node?.kind;

  useEffect(() => {
    headingRef.current?.focus();
  }, [nodeId]);

  useEffect(() => {
    if (!node || !apiClient || node.kind === 'Redacted') {
      setState({ loading: false, record: null, error: null });
      return undefined;
    }
    let cancelled = false;
    setState({ loading: true, record: null, error: null });
    Promise.resolve()
      .then(() => loadStepRecord(apiClient, tenantId, trail, node))
      .then((record) => !cancelled && setState({ loading: false, record: record || null, error: null }))
      .catch((error) => !cancelled && setState({ loading: false, record: null, error }));
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId, nodeId, nodeKind]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!node) return null;
  const redacted = node.kind === 'Redacted';
  const href = redacted ? null : stepPath(trail, node, state.record);
  const texts = stepTexts(t, node, state.record);
  const when = (v) => (v ? formatDateTime(v, lng, { dateStyle: 'medium', timeStyle: 'medium' }) : null);
  const tokens = node.inputTokens == null && node.outputTokens == null ? null : t('trail.drawer.tokens', { input: formatNumber(node.inputTokens || 0, {}, lng), output: formatNumber(node.outputTokens || 0, {}, lng) });
  const record = state.record;

  return (
    <aside
      className="trail-drawer"
      role="region"
      aria-labelledby={titleId}
      data-testid="trail-drawer"
      data-tour="trail-drawer"
      data-step-id={node.id}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose?.();
        }
      }}
    >
      <div className="trail-drawer-head">
        <h3 id={titleId} ref={headingRef} tabIndex={-1} className="trail-drawer-title">
          {stepTitle(t, node)}
        </h3>
        <button type="button" className="icon-button" onClick={onClose} aria-label={t('trail.drawer.close')} data-testid="trail-drawer-close" {...tip(t('tips.trail.drawer.close'))}>
          <XIcon />
        </button>
      </div>

      {redacted ? (
        <div className="trail-drawer-redacted" data-testid="trail-drawer-redacted">
          <p>{t('trail.drawer.redacted', { kind: kindLabel(t, node.redactedKind || 'Redacted') })}</p>
          <dl className="trail-drawer-fields">
            <Field label={t('trail.drawer.fields.kind')} tipText={t('tips.trail.drawer.fields.kind')}>{kindLabel(t, node.redactedKind || 'Redacted')}</Field>
            <Field label={t('trail.drawer.fields.started')} tipText={t('tips.trail.drawer.fields.started')}>{when(node.startedUtc)}</Field>
          </dl>
        </div>
      ) : (
        <>
          <dl className="trail-drawer-fields">
            <Field label={t('trail.drawer.fields.kind')} tipText={t('tips.trail.drawer.fields.kind')}><span {...tip(kindTip(t, node.kind))}>{kindLabel(t, node.kind)}</span></Field>
            <Field label={t('trail.drawer.fields.state')} tipText={t('tips.trail.drawer.fields.state')}><span {...tip(stateTip(t, node.state))}><TrailState t={t} state={node.state} /></span></Field>
            {(node.agentName || node.callerName) && <Field label={t('trail.drawer.fields.agent')} tipText={t('tips.trail.drawer.fields.agent')}>{node.agentName || node.callerName}</Field>}
            {node.entrySurface && (
              <Field label={t('trail.drawer.fields.entrySurface')} tipText={t('tips.trail.drawer.fields.entrySurface')}>
                <span {...tip(entrySurfaceTip(t, node.entrySurface))}>{entrySurfaceLabel(t, node.entrySurface)}</span>
              </Field>
            )}
            {node.unitName && <Field label={t('trail.drawer.fields.unit')} tipText={t('tips.trail.drawer.fields.unit')}>{node.unitName}</Field>}
            {node.runKind && <Field label={t('trail.drawer.fields.runKind')} tipText={t('tips.trail.drawer.fields.runKind')}>{enumLabel(t, 'runKind', node.runKind)}</Field>}
            {node.toolName && <Field label={t('trail.drawer.fields.tool')} tipText={t('tips.trail.drawer.fields.tool')}><code>{node.toolName}</code></Field>}
            <Field label={t('trail.drawer.fields.started')} tipText={t('tips.trail.drawer.fields.started')}>{when(node.startedUtc)}</Field>
            {node.endedUtc && <Field label={t('trail.drawer.fields.ended')} tipText={t('tips.trail.drawer.fields.ended')}>{when(node.endedUtc)}</Field>}
            {node.durationMs != null && <Field label={t('trail.drawer.fields.duration')} tipText={t('tips.trail.drawer.fields.duration')}>{formatMs(node.durationMs, lng, '-')}</Field>}
            {tokens && <Field label={t('trail.drawer.fields.tokens')} tipText={t('tips.trail.drawer.fields.tokens')}>{tokens}</Field>}
            {node.costUsd != null && <Field label={t('trail.drawer.fields.cost')} tipText={t('tips.trail.drawer.fields.cost')}>{formatUsd(node.costUsd, lng, '-')}</Field>}
            <Field label={t('trail.drawer.fields.id')} tipText={t('tips.trail.drawer.fields.id')}><CopyableId value={node.id} max={32} /></Field>
            {node.kind === 'Effect' && record && (
              <>
                <Field label={t('trail.drawer.fields.argumentDigest')} tipText={t('tips.trail.drawer.fields.argumentDigest')}><code className="cell-break">{record.argumentDigest || '-'}</code></Field>
                <Field label={t('trail.drawer.fields.leaseEpoch')} tipText={t('tips.trail.drawer.fields.leaseEpoch')}>{formatNumber(record.leaseEpoch ?? 0, {}, lng)}</Field>
              </>
            )}
          </dl>

          {state.loading && <LoadingState label={t('trail.drawer.loading')} />}
          {state.error && <ErrorBanner message={state.error?.status === 404 ? t('trail.drawer.recordGone') : errorMessage(t, state.error)} />}
          {texts.length > 0 && (
            <div className="trail-drawer-texts">
              <p className="trail-agent-text-note" data-testid="trail-data-note">
                {t('trail.drawer.dataNote')}
              </p>
              {texts.map((item) => (
                <AgentText key={item.key} t={t} item={item} />
              ))}
            </div>
          )}

          {href && (
            <div className="trail-drawer-actions">
              <a
                href={href}
                className="button-secondary button-sm"
                data-testid="trail-drawer-open-record"
                {...tip(t('tips.trail.drawer.openRecord'))}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  navigate(href);
                }}
              >
                {t('trail.drawer.openRecord')}
              </a>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
