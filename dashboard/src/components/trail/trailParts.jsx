// Shared words, icons, and links for the activity trail views (LP2.3 to LP2.7). Every view draws a step the same way:
// its kind, its state as an icon plus a label (never color alone), and the record it opens.

import { pathFor } from '../../config/navConfig';
import { formatDuration } from '../../i18n/formatters';
import { enumLabel } from '../../utils/enums';
import { optionalText } from '../../utils/tips';
import { owningRunId, stateTone } from '../../utils/trailLayout';

/** Translated label of a node kind. A redacted step shows the kind it hides. */
export function kindLabel(t, kind) {
  return t(`trail.kinds.${kind}`, { defaultValue: String(kind || '') });
}

/** Translated label of an edge kind. */
export function edgeLabel(t, kind) {
  return t(`trail.edges.${kind}`, { defaultValue: String(kind || '') });
}

/** Translated label of an entry surface (LP-013): how the request came in, such as REST API or MCP. */
export function entrySurfaceLabel(t, surface) {
  return surface ? t(`trail.entrySurfaces.${surface}`, { defaultValue: String(surface) }) : '';
}

/** Tooltip of an entry surface. */
export function entrySurfaceTip(t, surface) {
  return surface ? optionalText(t, `tips.trail.entrySurfaces.${surface}`) : '';
}

/** Tooltip of a node kind: what that kind of step is. */
export function kindTip(t, kind) {
  return optionalText(t, `tips.trail.kinds.${kind}`);
}

/** Tooltip of an edge kind: how the trail got from one step to the next. */
export function edgeTip(t, kind) {
  return optionalText(t, `tips.trail.edges.${kind}`);
}

/** Translated label of a node state, or '' for a node without one. */
export function stateLabel(t, state) {
  if (!state) return '';
  return t(`trail.states.${state}`, { defaultValue: String(state) });
}

/** Tooltip of a node state: what that state means for the step. */
export function stateTip(t, state) {
  return state ? optionalText(t, `tips.trail.states.${stateTone(state)}`, { state: stateLabel(t, state) }) : '';
}

/** The first line of a step: its kind, with the run kind, the tool name, or the caller's name when it has one. */
export function stepTitle(t, node) {
  if (node.kind === 'Redacted') return t('trail.redactedTitle', { kind: kindLabel(t, node.redactedKind || 'Redacted') });
  if (node.kind === 'Run' && node.runKind && node.runKind !== 'Invoke') return t('trail.runOfKind', { kind: enumLabel(t, 'runKind', node.runKind) });
  if (node.kind === 'Effect' && node.toolName) return node.toolName;
  if ((node.kind === 'Caller' || node.kind === 'Reply') && node.callerName) return `${kindLabel(t, node.kind)}: ${node.callerName}`;
  return kindLabel(t, node.kind);
}

/** The second line of a step: its state label and duration, and for a Caller its entry surface. */
export function stepDetail(t, node, lng) {
  const parts = [];
  const label = stateLabel(t, node.state);
  if (label) parts.push(label);
  // The caller lane says how the request came in (LP-013): Rest, Mcp, A2a, App, and so on.
  if (node.kind === 'Caller' && node.entrySurface) parts.push(entrySurfaceLabel(t, node.entrySurface));
  if (node.durationMs !== null && node.durationMs !== undefined && node.kind !== 'Message') parts.push(formatDuration(node.durationMs, lng));
  return parts.join(' · ');
}

/** The words a screen reader hears for a step (kind, agent, state, focus). */
export function stepAriaLabel(t, node, lng) {
  const who = node.agentName || node.callerName || '';
  const parts = [stepTitle(t, node), who, stepDetail(t, node, lng), node.isFocus ? t('trail.focusRun') : ''].filter(Boolean);
  return parts.join(', ');
}

/** The name of a lane: the agent, or "Caller" for the caller lane. */
export function laneName(t, lane) {
  if (lane.id === 'caller') return t('trail.callerLane');
  if (lane.agentName) return lane.agentName;
  if (lane.id.startsWith('kind:')) return kindLabel(t, lane.id.slice(5));
  return lane.agentId || lane.id;
}

/**
 * The dashboard page of a step's record, or null when it has none of its own. `record` is the record the drawer
 * loaded, when it needs one (a message opens its thread).
 */
export function stepPath(trail, node, record = null) {
  switch (node.kind) {
    case 'Run':
      return pathFor('runs', node.id);
    case 'Message': {
      const thread = record?.threadId || node.id;
      return pathFor('messageThreads', thread, thread !== node.id ? { message: node.id } : undefined);
    }
    case 'Report':
      return pathFor('reports', node.id);
    case 'Escalation':
      return pathFor('escalations', node.id);
    case 'Approval':
      return pathFor('approvals', node.id);
    case 'PipelineRun':
      return pathFor('pipelineRuns', node.id);
    case 'Trigger':
      return pathFor('triggers', null, { fires: node.id });
    case 'Effect': {
      const run = owningRunId(trail, node.id);
      return run ? pathFor('runs', run) : null;
    }
    case 'FanOutGroup': {
      const run = owningRunId(trail, node.id);
      return run ? pathFor('runs', run, { tab: 'children', group: node.id }) : null;
    }
    case 'Reply': {
      const run = owningRunId(trail, node.id);
      return run ? pathFor('runs', run) : null;
    }
    default:
      return null;
  }
}

/** The trail page of a run with one step selected (LP2.8 entry points). */
export function trailPath(runId, stepId) {
  return pathFor('runs', runId, stepId ? { tab: 'trail', step: stepId } : { tab: 'trail' });
}

/** A small status icon per tone, drawn in an SVG or inline. Decorative: the label next to it carries the meaning. */
export function ToneIcon({ tone, size = 12, x, y }) {
  const inSvg = x !== undefined;
  const glyph = (
    <g className={`trail-tone-icon tone-${tone}`} aria-hidden="true">
      {tone === 'success' && <path d="M2.5 6.5 L5 9 L9.5 3.5" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {tone === 'danger' && <path d="M3 3 L9 9 M9 3 L3 9" fill="none" strokeWidth="1.8" strokeLinecap="round" />}
      {tone === 'running' && (
        <>
          <circle cx="6" cy="6" r="4.2" fill="none" strokeWidth="1.5" />
          <path d="M6 3.6 L6 6 L7.8 7.2" fill="none" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {tone === 'neutral' && <path d="M3 6 L9 6" fill="none" strokeWidth="1.8" strokeLinecap="round" />}
      {tone === 'none' && <circle cx="6" cy="6" r="2.2" />}
    </g>
  );
  if (inSvg) {
    return (
      <svg x={x} y={y} width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        {glyph}
      </svg>
    );
  }
  return (
    <svg className="trail-tone-svg" width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {glyph}
    </svg>
  );
}

/** A state as an icon plus its label, for lists and the drawer. */
export function TrailState({ t, state }) {
  if (!state) return <span className="text-muted">-</span>;
  const tone = stateTone(state);
  return (
    <span className={`trail-state tone-${tone}`} data-tone={tone}>
      <ToneIcon tone={tone} /> <span>{stateLabel(t, state)}</span>
    </span>
  );
}
