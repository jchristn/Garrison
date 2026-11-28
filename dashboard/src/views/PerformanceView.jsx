import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Explainer from '../components/Explainer';
import LocalTableFrame from '../components/LocalTableFrame';
import StudioLink from '../components/studio/StudioLink';
import UnitPerformanceChart from '../components/UnitPerformanceChart';
import { OrganizationStatusBadge } from '../components/OrganizationBadges';
import { ActiveBadge, Badge } from '../components/StatusBadge';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { PlusIcon, RefreshIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { PERFORMANCE_LIMITS } from '../utils/constants';
import { formatCurrency, formatDateTime, formatDuration, formatNumber, formatPercent, formatRelativeTime } from '../i18n/formatters';
import { enumLabel } from '../utils/enums';
import { errorMessage } from '../utils/errors';
import { deniedProps, permissionDenied } from '../utils/permissions';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { PERFORMANCE_WINDOWS, blankCustomWindow, customWindowErrors, newCheckQuery, unitDepths, windowQuery } from '../utils/performance';

/** The metric columns both tables share, each with how to render it from a PerformanceMetrics object. */
const METRIC_COLUMNS = [
  { key: 'runs', render: (m, lng) => formatNumber(m.runs ?? 0, {}, lng) },
  { key: 'outcomes', render: (m, lng, t) => t('performance.outcomes', { succeeded: formatNumber(m.succeeded ?? 0, {}, lng), failed: formatNumber(m.failed ?? 0, {}, lng), cancelled: formatNumber(m.cancelled ?? 0, {}, lng) }) },
  { key: 'successRate', render: (m, lng) => formatPercent(m.successRate, lng) },
  { key: 'costUsd', render: (m, lng) => formatCurrency(m.costUsd ?? 0, lng, 'USD') },
  { key: 'latency', render: (m, lng) => (m.latencyP50Ms == null ? '-' : `${formatDuration(m.latencyP50Ms, lng)} / ${formatDuration(m.latencyP95Ms, lng)} / ${formatDuration(m.latencyP99Ms, lng)}`) },
  { key: 'escalations', render: (m, lng) => `${formatNumber(m.escalationsRaised ?? 0, {}, lng)} (${formatPercent(m.escalationRate, lng)})` },
  { key: 'loopGuardRejections', render: (m, lng) => formatNumber(m.loopGuardRejections ?? 0, {}, lng) },
  { key: 'evalScore', render: (m, lng, t) => (m.evalScore == null ? '-' : t('performance.evalScore', { score: formatPercent(m.evalScore, lng), count: m.evalRuns ?? 0 })) }
];

/** A panel heading (h2) with its tooltip and optional tools on the right. */
function PanelHead({ id, title, tipText, children }) {
  return (
    <div className="board-panel-head">
      <h2 id={id} {...tip(tipText)}>
        {title}
      </h2>
      {children ? <div className="board-panel-tools">{children}</div> : null}
    </div>
  );
}

/** Metric columns the units table hides until the operator picks them, so the default set fits without a sideways scroll. */
const UNIT_HIDDEN_METRICS = ['outcomes', 'loopGuardRejections'];

/** Metric columns the agents table hides by default: it also carries the agent, unit, and sample run columns. */
const AGENT_HIDDEN_METRICS = ['outcomes', 'latency', 'escalations', 'loopGuardRejections'];

/** The shared metric columns as TableFrame column definitions, with `hiddenKeys` marked hidden by default. */
function metricColumns(t, lng, hiddenKeys) {
  return METRIC_COLUMNS.map((c) => {
    const textual = c.key === 'outcomes' || c.key === 'latency';
    return {
      key: c.key,
      label: t(`performance.columns.${c.key}`),
      tip: t(`tips.performance.columns.${c.key}`),
      headerClass: textual ? '' : 'right',
      cellClass: textual ? 'nowrap' : 'right nowrap',
      defaultHidden: hiddenKeys.includes(c.key),
      render: (item) => <span data-metric={c.key}>{c.render(item.metrics || {}, lng, t)}</span>
    };
  });
}

/** The organization picker for /dashboard/organizations?tab=performance. */
function PerformancePicker() {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [orgs, setOrgs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiClient?.listOrganizations) return undefined;
    let active = true;
    apiClient
      .listOrganizations(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => active && setOrgs(r?.items || []))
      .catch((e) => {
        if (!active) return;
        setError(e);
        setOrgs([]);
      });
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  return (
    <div data-testid="performance-picker">
      <PageHeader title={t('performance.title')} subtitle={t('performance.subtitle')} />
      <Explainer topic="performance" />
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      {orgs === null ? (
        <LoadingState />
      ) : orgs.length === 0 ? (
        <EmptyState
          title={t('performance.picker.emptyTitle')}
          body={t('performance.picker.emptyBody')}
          action={
            <StudioLink to={pathFor('organizations')} className="button button-primary" testId="performance-picker-organizations" tipText={t('tips.board.picker.organizations')}>
              {t('board.picker.organizations')}
            </StudioLink>
          }
        />
      ) : (
        <section className="panel" aria-labelledby="performance-picker-title">
          <h2 id="performance-picker-title" className="form-section-title">
            {t('performance.picker.title')}
          </h2>
          <ul className="plain-list board-picker-list">
            {orgs.map((o) => (
              <li key={o.id}>
                <StudioLink to={pathFor('performance', o.id)} testId={`performance-picker-link-${o.id}`} tipText={t('tips.performance.picker.open')}>
                  {o.name}
                </StudioLink>{' '}
                <OrganizationStatusBadge status={o.status} t={t} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** The window picker: 24 hours, 7 days, 30 days, or a custom range of dates (at most 90 days). */
function WindowPicker({ choice, custom, onChoose, onApplyCustom, t }) {
  const [draft, setDraft] = useState(custom);
  const [errors, setErrors] = useState({});
  const apply = (e) => {
    e.preventDefault();
    const found = customWindowErrors(draft, t);
    setErrors(found);
    if (Object.keys(found).length === 0) onApplyCustom(draft);
  };
  return (
    <div className="perf-window" data-testid="performance-window">
      <div className="range-group segmented" role="group" aria-label={t('performance.window.label')}>
        {PERFORMANCE_WINDOWS.map((w) => (
          <button key={w} type="button" aria-pressed={choice === w} className={`range-btn ${choice === w ? 'active' : ''}`} onClick={() => onChoose(w)} data-testid={`performance-window-${w}`} {...tip(t(`tips.performance.window.${w}`))}>
            {t(`performance.window.${w}`)}
          </button>
        ))}
      </div>
      {choice === 'custom' && (
        <form className="perf-window-custom" onSubmit={apply} noValidate data-testid="performance-window-custom">
          <div className="field">
            <label htmlFor="performance-from" {...tip(t('tips.performance.window.from'))}>
              {t('performance.window.from')}
            </label>
            <input id="performance-from" type="date" value={draft.from} aria-invalid={errors.from ? 'true' : undefined} onChange={(e) => setDraft({ ...draft, from: e.target.value })} data-testid="performance-from" {...tip(t('tips.performance.window.from'))} />
            {errors.from && (
              <div className="field-error" role="alert">
                {errors.from}
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="performance-to" {...tip(t('tips.performance.window.to'))}>
              {t('performance.window.to')}
            </label>
            <input id="performance-to" type="date" value={draft.to} aria-invalid={errors.to ? 'true' : undefined} onChange={(e) => setDraft({ ...draft, to: e.target.value })} data-testid="performance-to" {...tip(t('tips.performance.window.to'))} />
            {errors.to && (
              <div className="field-error" role="alert" data-testid="performance-window-error">
                {errors.to}
              </div>
            )}
          </div>
          <button type="submit" className="button-secondary" data-testid="performance-window-apply" {...tip(t('tips.performance.window.apply'))}>
            {t('performance.window.apply')}
          </button>
        </form>
      )}
    </div>
  );
}

/** The performance of one organization (`/dashboard/performance/<id>`). */
function Performance({ organizationId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const lng = i18n.language;
  // UT-03: a scheduled check is a trigger, so New check needs Create on Trigger.
  const permissions = useCallerPermissions();
  const deniedCheck = permissionDenied(t, permissions, 'Trigger', 'Create');
  const [choice, setChoice] = useState(PERFORMANCE_LIMITS.defaultWindow);
  const [custom, setCustom] = useState(() => blankCustomWindow());
  const [unitId, setUnitId] = useState('');
  const [data, setData] = useState(null);
  const [allUnits, setAllUnits] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  const load = useCallback(() => {
    if (!apiClient?.getOrganizationPerformance) return;
    const range = windowQuery(choice, custom);
    if (!range) return;
    const mine = ++seq.current;
    setLoading(true);
    apiClient
      .getOrganizationPerformance(tenantId, organizationId, { ...range, unitId: unitId || undefined })
      .then((r) => {
        if (mine !== seq.current) return;
        setData(r);
        setError(null);
        if (!unitId) setAllUnits(r?.units || []);
      })
      .catch((e) => mine === seq.current && setError(e))
      .finally(() => mine === seq.current && setLoading(false));
  }, [apiClient, tenantId, organizationId, choice, custom, unitId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) {
    return (
      <div data-testid="performance">
        <PageHeader title={t('performance.title')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={load} />
        <EmptyState title={t('performance.notFoundTitle')} body={t('performance.notFoundBody')} />
      </div>
    );
  }
  if (!data) return <LoadingState />;

  const orgId = data.organizationId || organizationId;
  const units = data.units || [];
  const agents = data.agents || [];
  const checks = data.checks || [];
  const depths = unitDepths(units);
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const unitChoices = allUnits.length ? allUnits : units;

  return (
    <div className="performance" data-testid="performance">
      <PageHeader
        title={t('performance.heading', { name: data.name || orgId })}
        subtitle={
          <span className="text-muted" data-testid="performance-range">
            {t('performance.range', { from: formatDateTime(data.fromUtc, lng), to: formatDateTime(data.toUtc, lng) })}
          </span>
        }
        actions={
          <>
            <StudioLink to={pathFor('organizations', orgId)} className="button button-secondary" testId="performance-open-organization" tipText={t('tips.board.openOrganization')}>
              {t('board.openOrganization')}
            </StudioLink>
            <StudioLink to={pathFor('board', orgId)} className="button button-secondary" testId="performance-open-board" tipText={t('tips.views.organizationDetail.openBoard')}>
              {t('views.organizationDetail.openBoard')}
            </StudioLink>
            <button type="button" className="button-secondary" onClick={load} data-testid="performance-refresh" {...tip(t('tips.performance.refresh'))}>
              <RefreshIcon /> {t('board.refresh')}
            </button>
          </>
        }
      />
      <Explainer topic="performance" />
      <div className="perf-toolbar">
        <WindowPicker
          choice={choice}
          custom={custom}
          t={t}
          onChoose={setChoice}
          onApplyCustom={(c) => {
            setCustom(c);
            setChoice('custom');
          }}
        />
        <div className="field perf-unit-filter">
          <label htmlFor="performance-unit" {...tip(t('tips.performance.unit'))}>
            {t('performance.unit')}
          </label>
          <select id="performance-unit" value={unitId} onChange={(e) => setUnitId(e.target.value)} data-testid="performance-unit" {...tip(t('tips.performance.unit'))}>
            <option value="">{t('performance.allUnits')}</option>
            {unitChoices.map((u) => (
              <option key={u.unitId} value={u.unitId}>
                {u.unitName || u.unitId}
              </option>
            ))}
          </select>
        </div>
        {loading && <span className="text-muted">{t('common.generic.loading')}</span>}
      </div>
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}

      <div className="board-grid">
        <section className="panel board-panel board-wide" aria-labelledby="performance-chart-title" data-testid="performance-chart-panel">
          <PanelHead id="performance-chart-title" title={t('performance.chart.title')} tipText={t('tips.performance.chart.title')} />
          {units.length === 0 ? <p className="text-muted board-empty">{t('performance.units.empty')}</p> : <UnitPerformanceChart units={units} t={t} lng={lng} />}
        </section>

        <section className="panel board-panel board-wide" aria-labelledby="performance-units-title" data-testid="performance-units">
          <PanelHead id="performance-units-title" title={t('performance.units.title')} tipText={t('tips.performance.units.title')} />
          {units.length === 0 ? (
            <p className="text-muted board-empty" data-testid="performance-units-empty">
              {t('performance.units.empty')}
            </p>
          ) : (
            <LocalTableFrame
              tableId="performance-units"
              testId="performance-units-table"
              compact
              items={units}
              rowId={(u) => u.unitId}
              rowProps={(u) => ({ 'data-perf-unit': u.unitId })}
              columns={[
                {
                  key: 'unit',
                  label: t('performance.columns.unit'),
                  tip: t('tips.performance.columns.unit'),
                  pinned: true,
                  render: (u) => (
                    <span className="org-budget-unit" style={{ paddingInlineStart: `${Math.min(depths[u.unitId] || 0, 6) * 12}px` }}>
                      {u.unitName || u.unitId}
                    </span>
                  )
                },
                ...metricColumns(t, lng, UNIT_HIDDEN_METRICS)
              ]}
            />
          )}
        </section>

        <section className="panel board-panel board-wide" aria-labelledby="performance-agents-title" data-testid="performance-agents">
          <PanelHead id="performance-agents-title" title={t('performance.agents.title')} tipText={t('tips.performance.agents.title')} />
          {agents.length === 0 ? (
            <p className="text-muted board-empty" data-testid="performance-agents-empty">
              {t('performance.agents.empty')}
            </p>
          ) : (
            <LocalTableFrame
              tableId="performance-agents"
              testId="performance-agents-table"
              compact
              items={agents}
              rowId={(a) => `${a.unitId}-${a.agentId}`}
              rowProps={(a) => ({ 'data-perf-agent': a.agentId })}
              columns={[
                {
                  key: 'agent',
                  label: t('performance.columns.agent'),
                  tip: t('tips.performance.columns.agent'),
                  pinned: true,
                  render: (a) => (
                    <>
                      <StudioLink to={pathFor('agents', a.agentId)} tipText={t('tips.performance.openAgent')}>
                        {a.agentName || a.agentId}
                      </StudioLink>{' '}
                      {a.isLead && (
                        <Badge tone="info" tip={t('tips.performance.lead')}>
                          {t('performance.lead')}
                        </Badge>
                      )}
                    </>
                  )
                },
                { key: 'unit', label: t('performance.columns.unit'), tip: t('tips.performance.columns.unit'), render: (a) => a.unitName || a.unitId },
                ...metricColumns(t, lng, AGENT_HIDDEN_METRICS),
                {
                  key: 'samples',
                  label: t('performance.columns.samples'),
                  tip: t('tips.performance.columns.samples'),
                  cellClass: 'nowrap',
                  render: (a) =>
                    (a.metrics?.sampleRunIds || []).length === 0
                      ? '-'
                      : (a.metrics.sampleRunIds || []).map((id, k) => (
                          <span key={id}>
                            {k > 0 ? ' ' : ''}
                            <StudioLink to={pathFor('runs', id)} tipText={t('tips.performance.openRun')}>
                              {t('performance.sample', { n: k + 1 })}
                            </StudioLink>
                          </span>
                        ))
                }
              ]}
            />
          )}
        </section>

        <section className="panel board-panel board-wide" aria-labelledby="performance-checks-title" data-testid="performance-checks">
          <PanelHead id="performance-checks-title" title={t('performance.checks.title')} tipText={t('tips.performance.checks.title')}>
            <button type="button" className="button-primary button-sm" onClick={() => !deniedCheck && navigate(pathFor('triggers', null, newCheckQuery()))} data-testid="performance-new-check" {...deniedProps(deniedCheck)} {...tip(deniedCheck || t('tips.performance.checks.new'))}>
              <PlusIcon size={14} /> {t('performance.checks.new')}
            </button>
          </PanelHead>
          <p className="text-muted">{t('performance.checks.note')}</p>
          {checks.length === 0 ? (
            <p className="text-muted board-empty" data-testid="performance-checks-empty">
              {t('performance.checks.empty')}
            </p>
          ) : (
            <LocalTableFrame
              tableId="performance-checks"
              testId="performance-checks-table"
              compact
              items={checks}
              rowId={(c) => c.triggerId}
              rowProps={(c) => ({ 'data-check': c.triggerId })}
              columns={[
                {
                  key: 'check',
                  label: t('performance.checks.columns.check'),
                  tip: t('tips.performance.checks.columns.check'),
                  render: (c) => (
                    <>
                      {c.triggerName || c.triggerId}{' '}
                      <ActiveBadge active={c.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(c.active ? 'tips.badges.active' : 'tips.badges.inactive')} />
                    </>
                  )
                },
                {
                  key: 'evalSet',
                  label: t('performance.checks.columns.evalSet'),
                  tip: t('tips.performance.checks.columns.evalSet'),
                  render: (c) => (
                    <StudioLink to={pathFor('evaluations', c.evalSetId)} tipText={t('tips.performance.checks.openSet')}>
                      {c.evalSetName || c.evalSetId}
                    </StudioLink>
                  )
                },
                { key: 'deployment', label: t('performance.checks.columns.deployment'), tip: t('tips.performance.checks.columns.deployment'), cellClass: 'cell-id', defaultHidden: true, render: (c) => c.deploymentId || '-' },
                { key: 'schedule', label: t('performance.checks.columns.schedule'), tip: t('tips.performance.checks.columns.schedule'), render: (c) => <code>{c.cronExpression || '-'}</code> },
                {
                  key: 'lastRun',
                  label: t('performance.checks.columns.lastRun'),
                  tip: t('tips.performance.checks.columns.lastRun'),
                  cellClass: 'nowrap',
                  render: (c) => (
                    <>
                      {c.lastEvalRunId ? (
                        <StudioLink to={pathFor('evalRuns', c.lastEvalRunId)} testId={`performance-check-run-${c.triggerId}`} tipText={t('tips.performance.checks.openRun')}>
                          {c.lastRunUtc ? formatRelativeTime(c.lastRunUtc, lng) : c.lastEvalRunId}
                        </StudioLink>
                      ) : (
                        <span className="text-muted">{t('performance.checks.never')}</span>
                      )}{' '}
                      {c.lastStatus && <span className="text-muted">{enumLabel(t, 'evalRunStatus', c.lastStatus)}</span>}
                    </>
                  )
                },
                {
                  key: 'lastScore',
                  label: t('performance.checks.columns.lastScore'),
                  tip: t('tips.performance.checks.columns.lastScore'),
                  cellClass: 'nowrap',
                  render: (c) => (
                    <>
                      {c.lastScore == null ? '-' : formatPercent(c.lastScore, lng)}{' '}
                      {c.lastPassed != null && (
                        <Badge tone={c.lastPassed ? 'success' : 'danger'} tip={t(c.lastPassed ? 'tips.performance.checks.passed' : 'tips.performance.checks.failed')}>
                          {t(c.lastPassed ? 'performance.checks.passed' : 'performance.checks.failed')}
                        </Badge>
                      )}
                    </>
                  )
                },
                { key: 'nextFire', label: t('performance.checks.columns.nextFire'), tip: t('tips.performance.checks.columns.nextFire'), cellClass: 'nowrap', render: (c) => when(c.nextFireUtc) }
              ]}
            />
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Performance (AA11.7): how an organization's units and agents did over a window (24 hours, 7 days, 30 days, or a
 * custom range of at most 90 days), from one GET /organizations/{id}/performance call. A chart of success rate and cost
 * by unit, a unit table (each row covers the unit's subtree) and an agent table with run outcomes, cost, latency
 * percentiles, escalations, loop-guard rejections, and eval scores, and the scheduled checks (EvalSet triggers) with
 * their last score and eval run. "New check" opens the trigger editor preset to an EvalSet target. Without a record
 * ID (the Performance tab) it lists the organizations to pick from.
 */
export default function PerformanceView({ recordId }) {
  if (!recordId) return <PerformancePicker />;
  return <Performance organizationId={recordId} />;
}
