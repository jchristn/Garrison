import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Explainer from '../components/Explainer';
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

function MetricHeads({ t }) {
  return METRIC_COLUMNS.map((c) => (
    <th key={c.key} scope="col" className={c.key === 'outcomes' || c.key === 'latency' ? '' : 'right'} {...tip(t(`tips.performance.columns.${c.key}`))}>
      {t(`performance.columns.${c.key}`)}
    </th>
  ));
}

function MetricCells({ metrics, t, lng }) {
  const m = metrics || {};
  return METRIC_COLUMNS.map((c) => (
    <td key={c.key} className={c.key === 'outcomes' || c.key === 'latency' ? 'nowrap' : 'right nowrap'} data-metric={c.key}>
      {c.render(m, lng, t)}
    </td>
  ));
}

/** The organization picker for /dashboard/autonomy?tab=performance. */
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
            <div className="table-scroll" tabIndex={0} role="region" aria-label={t('performance.units.title')}>
              <table className="data-table compact" data-testid="performance-units-table">
                <caption className="sr-only">{t('performance.units.title')}</caption>
                <thead>
                  <tr>
                    <th scope="col" {...tip(t('tips.performance.columns.unit'))}>{t('performance.columns.unit')}</th>
                    <MetricHeads t={t} />
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.unitId} data-perf-unit={u.unitId}>
                      <th scope="row">
                        <span className="org-budget-unit" style={{ paddingInlineStart: `${Math.min(depths[u.unitId] || 0, 6) * 12}px` }}>
                          {u.unitName || u.unitId}
                        </span>
                      </th>
                      <MetricCells metrics={u.metrics} t={t} lng={lng} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel board-panel board-wide" aria-labelledby="performance-agents-title" data-testid="performance-agents">
          <PanelHead id="performance-agents-title" title={t('performance.agents.title')} tipText={t('tips.performance.agents.title')} />
          {agents.length === 0 ? (
            <p className="text-muted board-empty" data-testid="performance-agents-empty">
              {t('performance.agents.empty')}
            </p>
          ) : (
            <div className="table-scroll" tabIndex={0} role="region" aria-label={t('performance.agents.title')}>
              <table className="data-table compact" data-testid="performance-agents-table">
                <caption className="sr-only">{t('performance.agents.title')}</caption>
                <thead>
                  <tr>
                    <th scope="col" {...tip(t('tips.performance.columns.agent'))}>{t('performance.columns.agent')}</th>
                    <th scope="col" {...tip(t('tips.performance.columns.unit'))}>{t('performance.columns.unit')}</th>
                    <MetricHeads t={t} />
                    <th scope="col" {...tip(t('tips.performance.columns.samples'))}>{t('performance.columns.samples')}</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={`${a.unitId}-${a.agentId}`} data-perf-agent={a.agentId}>
                      <th scope="row">
                        <StudioLink to={pathFor('agents', a.agentId)} tipText={t('tips.performance.openAgent')}>
                          {a.agentName || a.agentId}
                        </StudioLink>{' '}
                        {a.isLead && (
                          <Badge tone="info" tip={t('tips.performance.lead')}>
                            {t('performance.lead')}
                          </Badge>
                        )}
                      </th>
                      <td>{a.unitName || a.unitId}</td>
                      <MetricCells metrics={a.metrics} t={t} lng={lng} />
                      <td className="nowrap">
                        {(a.metrics?.sampleRunIds || []).length === 0
                          ? '-'
                          : (a.metrics.sampleRunIds || []).map((id, k) => (
                              <span key={id}>
                                {k > 0 ? ' ' : ''}
                                <StudioLink to={pathFor('runs', id)} tipText={t('tips.performance.openRun')}>
                                  {t('performance.sample', { n: k + 1 })}
                                </StudioLink>
                              </span>
                            ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="table-scroll" tabIndex={0} role="region" aria-label={t('performance.checks.title')}>
              <table className="data-table compact" data-testid="performance-checks-table">
                <caption className="sr-only">{t('performance.checks.title')}</caption>
                <thead>
                  <tr>
                    {['check', 'evalSet', 'deployment', 'schedule', 'lastRun', 'lastScore', 'nextFire'].map((c) => (
                      <th key={c} scope="col" {...tip(t(`tips.performance.checks.columns.${c}`))}>
                        {t(`performance.checks.columns.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checks.map((c) => (
                    <tr key={c.triggerId} data-check={c.triggerId}>
                      <th scope="row">
                        {c.triggerName || c.triggerId}{' '}
                        <ActiveBadge active={c.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(c.active ? 'tips.badges.active' : 'tips.badges.inactive')} />
                      </th>
                      <td>
                        <StudioLink to={pathFor('evaluations', c.evalSetId)} tipText={t('tips.performance.checks.openSet')}>
                          {c.evalSetName || c.evalSetId}
                        </StudioLink>
                      </td>
                      <td>{c.deploymentId}</td>
                      <td>
                        <code>{c.cronExpression || '-'}</code>
                      </td>
                      <td className="nowrap">
                        {c.lastEvalRunId ? (
                          <StudioLink to={pathFor('evalRuns', c.lastEvalRunId)} testId={`performance-check-run-${c.triggerId}`} tipText={t('tips.performance.checks.openRun')}>
                            {c.lastRunUtc ? formatRelativeTime(c.lastRunUtc, lng) : c.lastEvalRunId}
                          </StudioLink>
                        ) : (
                          <span className="text-muted">{t('performance.checks.never')}</span>
                        )}{' '}
                        {c.lastStatus && <span className="text-muted">{enumLabel(t, 'evalRunStatus', c.lastStatus)}</span>}
                      </td>
                      <td className="nowrap">
                        {c.lastScore == null ? '-' : formatPercent(c.lastScore, lng)}{' '}
                        {c.lastPassed != null && (
                          <Badge tone={c.lastPassed ? 'success' : 'danger'} tip={t(c.lastPassed ? 'tips.performance.checks.passed' : 'tips.performance.checks.failed')}>
                            {t(c.lastPassed ? 'performance.checks.passed' : 'performance.checks.failed')}
                          </Badge>
                        )}
                      </td>
                      <td className="nowrap">{when(c.nextFireUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
