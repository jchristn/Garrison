import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import CodeBlock from './CodeBlock';
import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { pathFor } from '../config/navConfig';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { translateServerText } from '../utils/serverText';
import { formatCurrency, formatDateTime, formatDuration, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { hintsKnown, isDerived, isShared, lockedReasonKey, requirementText, sourceOf } from '../utils/capabilities';
import { jsonToText } from '../utils/jsonFields';

/**
 * Where a capability comes from, as links (AD4.8): an Agent entry links to the agent's page; an McpTool entry links to
 * its MCP server (the MCP Servers tab searched for its name) and names the tool; a HarnessBuiltIn entry links to the
 * harness profile that probes it and shows the node label a run needs. Manual entries without a source say so.
 * `lookups` maps IDs to names: { agents, mcpServers, harnessProfiles }.
 */
export function CapabilitySource({ descriptor, lookups = {}, t }) {
  const source = sourceOf(descriptor);
  if (source.type === 'agent') {
    const name = lookups.agents?.[source.id];
    return (
      <span className="capability-source" data-source="agent">
        <Link to={pathFor('agents', source.id)} data-testid="capability-source-link" {...tip(t('tips.capabilities.sourceAgent', { name: name || source.id }))}>
          {name || source.id}
        </Link>
      </span>
    );
  }
  if (source.type === 'mcpServer') {
    const name = lookups.mcpServers?.[source.id];
    return (
      <span className="capability-source" data-source="mcpServer">
        <Link to={pathFor('mcpServers', null, name ? { search: name } : undefined)} data-testid="capability-source-link" {...tip(t('tips.capabilities.sourceMcpServer', { name: name || source.id }))}>
          {name || source.id}
        </Link>
        {source.tool && (
          <>
            {' / '}
            <code {...tip(t('tips.capabilities.sourceTool', { tool: source.tool }))}>{source.tool}</code>
          </>
        )}
      </span>
    );
  }
  if (source.type === 'harnessProfile') {
    const name = lookups.harnessProfiles?.[source.id];
    const labels = (descriptor.requirements || []).map(requirementText).filter(Boolean);
    return (
      <span className="capability-source" data-source="harnessProfile">
        <Link to={pathFor('harnessProfiles', null, name ? { search: name } : undefined)} data-testid="capability-source-link" {...tip(t('tips.capabilities.sourceProfile', { name: name || source.id }))}>
          {name || source.id}
        </Link>
        {labels.map((label) => (
          <code key={label} className="capability-label" data-testid="capability-node-label" {...tip(t('tips.capabilities.nodeLabel', { label }))}>
            {label}
          </code>
        ))}
      </span>
    );
  }
  return (
    <span className="text-muted" data-source="none" {...tip(t('tips.capabilities.noSource'))}>
      {t('components.capabilities.noSource')}
    </span>
  );
}

/**
 * Cost and latency hints in one line: median and p90 duration and the mean cost, or an Unknown badge when too few runs
 * finished in the window. Unknown values are never shown as zero.
 */
export function CapabilityHints({ hints, t, lng }) {
  if (!hintsKnown(hints)) {
    return (
      <span data-hints="Unknown">
        <Badge tip={t('tips.capabilities.hintsUnknown')}>{enumLabel(t, 'capabilityHintStatus', 'Unknown')}</Badge>
      </span>
    );
  }
  const values = {
    median: formatDuration(hints.medianDurationMs, lng),
    p90: formatDuration(hints.p90DurationMs, lng)
  };
  const text = hints.meanCostUsd === null || hints.meanCostUsd === undefined ? t('components.capabilities.hintsLineNoCost', values) : t('components.capabilities.hintsLine', { ...values, cost: formatCurrency(hints.meanCostUsd, lng) });
  return (
    <span data-hints="Known" {...tip(t('tips.capabilities.hintsKnown', { count: hints.sampleSize ?? 0, days: hints.windowDays ?? 0 }))}>
      {text}
    </span>
  );
}

/** One label and value in the detail grid; the label's tooltip says what the value means. */
function Item({ name, children, t, span = false }) {
  return (
    <div className={`detail-item ${span ? 'detail-item-span' : ''}`} data-item={name}>
      <div className="detail-item-label" {...tip(t(`tips.capabilities.fields.${name}`))}>
        {t(`components.capabilities.fields.${name}`)}
      </div>
      <div className="detail-item-value">{children}</div>
    </div>
  );
}

/**
 * Everything about one capability descriptor (AD4.8): the refresh warning (when the last refresh of its source failed),
 * why a derived entry cannot be changed here, kind, origin, source, tags, summary, the cost and latency hints, the node
 * labels a run needs, and the input and output schemas.
 */
export default function CapabilityDetail({ descriptor, lookups = {} }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  if (!descriptor) return null;
  const hints = descriptor.hints || { status: 'Unknown' };
  const known = hintsKnown(hints);
  const unknown = <span className="text-muted">{enumLabel(t, 'capabilityHintStatus', 'Unknown')}</span>;
  const locked = lockedReasonKey(descriptor);
  const requirements = (descriptor.requirements || []).map(requirementText).filter(Boolean);
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  return (
    <div className="capability-detail" data-testid="capability-detail" data-origin={descriptor.origin} data-kind={descriptor.kind}>
      {descriptor.refreshWarning && (
        <div className="warning-banner" role="alert" data-testid="capability-warning" {...tip(t('tips.capabilities.refreshWarning'))}>
          <strong>{'⚠'} {t('components.capabilities.refreshWarning')}</strong>
          <span>{translateServerText(t, descriptor.refreshWarning)}</span>
        </div>
      )}
      {locked && (
        <div className="info-banner" data-testid="capability-locked" {...tip(t('tips.capabilities.lockedBanner'))}>
          {t(locked)}
        </div>
      )}
      <div className="detail-grid">
        <Item name="kind" t={t}>
          <Badge tone="info" tip={enumTip(t, 'capabilityKind', descriptor.kind)}>
            {enumLabel(t, 'capabilityKind', descriptor.kind)}
          </Badge>
        </Item>
        <Item name="origin" t={t}>
          <Badge tone={isDerived(descriptor) ? 'neutral' : 'success'} tip={enumTip(t, 'capabilityOrigin', descriptor.origin)}>
            {enumLabel(t, 'capabilityOrigin', descriptor.origin)}
          </Badge>{' '}
          {isShared(descriptor) && <Badge tip={t('tips.capabilities.shared')}>{t('components.capabilities.shared')}</Badge>}
        </Item>
        <Item name="source" t={t}>
          <CapabilitySource descriptor={descriptor} lookups={lookups} t={t} />
        </Item>
        <Item name="lastRefreshedUtc" t={t}>
          {when(descriptor.lastRefreshedUtc)}
        </Item>
        <Item name="tags" t={t}>
          {(descriptor.tags || []).join(', ') || '-'}
        </Item>
        <Item name="id" t={t}>
          <code>{descriptor.id}</code>
        </Item>
        <Item name="summary" t={t} span>
          <span className="pre-wrap">{descriptor.summary || '-'}</span>
        </Item>
      </div>

      <h3 className="section-title" {...tip(t('tips.capabilities.hintsTitle'))}>
        {t('components.capabilities.hintsTitle')}
      </h3>
      <div className="detail-grid" data-testid="capability-hints" data-status={known ? 'Known' : 'Unknown'}>
        <Item name="hintStatus" t={t}>
          <Badge tone={known ? 'success' : 'neutral'} tip={enumTip(t, 'capabilityHintStatus', known ? 'Known' : 'Unknown')}>
            {enumLabel(t, 'capabilityHintStatus', known ? 'Known' : 'Unknown')}
          </Badge>
        </Item>
        <Item name="sampleSize" t={t}>
          {known ? formatNumber(hints.sampleSize ?? 0, {}, lng) : unknown}
        </Item>
        <Item name="medianDurationMs" t={t}>
          {known && hints.medianDurationMs !== null && hints.medianDurationMs !== undefined ? formatDuration(hints.medianDurationMs, lng) : unknown}
        </Item>
        <Item name="p90DurationMs" t={t}>
          {known && hints.p90DurationMs !== null && hints.p90DurationMs !== undefined ? formatDuration(hints.p90DurationMs, lng) : unknown}
        </Item>
        <Item name="meanCostUsd" t={t}>
          {!known ? unknown : hints.meanCostUsd === null || hints.meanCostUsd === undefined ? <span className="text-muted">{t('components.capabilities.noCost')}</span> : formatCurrency(hints.meanCostUsd, lng)}
        </Item>
        <Item name="windowDays" t={t}>
          {hints.windowDays ? t('components.capabilities.windowDays', { count: hints.windowDays }) : '-'}
        </Item>
        <Item name="computedUtc" t={t}>
          {when(hints.computedUtc)}
        </Item>
      </div>

      <h3 className="section-title" {...tip(t('tips.capabilities.requirementsTitle'))}>
        {t('components.capabilities.requirementsTitle')}
      </h3>
      {requirements.length ? (
        <ul className="capability-list" data-testid="capability-requirements">
          {requirements.map((r) => (
            <li key={r}>
              <code {...tip(t('tips.capabilities.nodeLabel', { label: r }))}>{r}</code>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">{t('components.capabilities.noRequirements')}</p>
      )}

      <div className="field">
        <label {...tip(t('tips.capabilities.fields.inputSchema'))}>{t('components.capabilities.fields.inputSchema')}</label>
        <CodeBlock value={jsonToText(descriptor.inputSchema)} prettyJson emptyText={t('components.capabilities.noSchema')} />
      </div>
      <div className="field">
        <label {...tip(t('tips.capabilities.fields.outputSchema'))}>{t('components.capabilities.fields.outputSchema')}</label>
        <CodeBlock value={jsonToText(descriptor.outputSchema)} prettyJson emptyText={t('components.capabilities.noSchema')} />
      </div>
    </div>
  );
}
