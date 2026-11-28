import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import OrgCanvas from '../studio/canvas/OrgCanvas';
import { SpendBar } from '../OrganizationBadges';
import { ReportHealthBadge } from '../ReportBadges';
import StudioLink from '../studio/StudioLink';
import { EmptyNote } from '../States';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { pathFor } from '../../config/navConfig';
import { formatCurrency, formatNumber } from '../../i18n/formatters';
import { reportHealthTone } from '../../utils/constants';
import { enumLabel } from '../../utils/enums';
import { spendOf } from '../../utils/organizations';
import { workingTreeOrgSource } from '../../utils/orgCanvasSource';

/** The activity windows the Chart view offers, in days; 7 is the default. */
export const CHART_RANGES = [1, 7, 30];

/**
 * The overlay lines of one unit (LP3.9): spend against each budget in the current window, then runs, escalations, and
 * cost of the unit's subtree in the chosen range (from GET .../performance, the same numbers as the Performance page).
 */
export function overlayLines(t, lng, { spendRows = [], metrics = null, days = 7 } = {}) {
  const lines = spendRows.map((r) =>
    r.amountUsd != null
      ? t('components.orgDesigner.overlay.spend', { period: enumLabel(t, 'budgetPeriod', r.period), spent: formatCurrency(r.spentUsd ?? 0, lng, 'USD'), amount: formatCurrency(r.amountUsd, lng, 'USD') })
      : t('components.orgDesigner.overlay.spendOnly', { period: enumLabel(t, 'budgetPeriod', r.period), spent: formatCurrency(r.spentUsd ?? 0, lng, 'USD') })
  );
  if (metrics)
    lines.push(
      t('components.orgDesigner.overlay.activity', {
        runs: formatNumber(metrics.runs ?? 0, {}, lng),
        escalations: formatNumber(metrics.escalationsRaised ?? 0, {}, lng),
        cost: formatCurrency(metrics.costUsd ?? 0, lng, 'USD'),
        count: days
      })
    );
  return lines;
}

/**
 * The read-only organization canvas of the Chart tab above 768px (LP3.9): each unit with its health from its latest
 * report, spend against budget, and runs, escalations, and cost in the chosen range. Clicking a unit (or Enter on it)
 * lists its recent runs, each with Open trail. units: the working tree or the live chart in the working-tree shape.
 */
export default function OrgChartCanvas({ organization, units = [], agents = [], spend = [], health = {} }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [days, setDays] = useState(7);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    if (!apiClient?.getOrganizationPerformance || !organization?.id) return undefined;
    let active = true;
    const toUtc = new Date();
    const fromUtc = new Date(toUtc.getTime() - days * 86400000);
    apiClient
      .getOrganizationPerformance(tenantId, organization.id, { fromUtc: fromUtc.toISOString(), toUtc: toUtc.toISOString() })
      .then((p) => active && setPerformance(p))
      .catch(() => active && setPerformance(null));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, organization?.id, days]);

  const shown = useMemo(() => ({ ...(organization || {}), units }), [organization, units]);
  const source = useMemo(() => workingTreeOrgSource({ apiClient, tenantId, organization: shown, agents }), [apiClient, tenantId, shown, agents]);
  const metricsOf = useMemo(() => new Map((performance?.units || []).map((u) => [u.unitId, u.metrics])), [performance]);
  const decorations = useMemo(() => {
    const out = {};
    for (const u of units) {
      const report = health?.[u.id];
      out[u.name] = {
        overlay: {
          health: report?.health ? enumLabel(t, 'reportHealth', report.health) : '',
          healthTone: report?.health ? reportHealthTone(report.health) : 'neutral',
          lines: overlayLines(t, lng, { spendRows: spendOf(spend, u.id), metrics: metricsOf.get(u.id) || null, days })
        }
      };
    }
    return out;
  }, [units, health, spend, metricsOf, days, t, lng]);

  const renderPanel = ({ key, unit }) => {
    if (!unit) return <EmptyNote key={key}>{t('components.orgDesigner.overlay.pick')}</EmptyNote>;
    const metrics = metricsOf.get(unit.unitId) || null;
    const runIds = metrics?.sampleRunIds || [];
    const report = health?.[unit.unitId];
    return (
      <div key={key} className="studio-canvas-props" data-testid="org-unit-activity" data-unit-activity={unit.name}>
        <h4 className="section-title" {...tip(t('tips.orgDesigner.overlay.unit'))}>
          {unit.name}
        </h4>
        {report ? <ReportHealthBadge health={report.health} t={t} /> : <p className="text-muted">{t('components.orgDesigner.overlay.noReport')}</p>}
        {spendOf(spend, unit.unitId).map((r) => (
          <SpendBar key={r.period} row={r} t={t} lng={lng} testId="org-unit-activity-spend" />
        ))}
        <p className="text-muted">{metrics ? overlayLines(t, lng, { metrics, days }).join(' ') : t('components.orgDesigner.overlay.noActivity')}</p>
        <div className="form-section-title" {...tip(t('tips.orgDesigner.overlay.runs'))}>
          {t('components.orgDesigner.overlay.runs')}
        </div>
        {runIds.length === 0 ? (
          <EmptyNote>{t('components.orgDesigner.overlay.noRuns')}</EmptyNote>
        ) : (
          <ul className="studio-list" data-testid="org-unit-activity-runs">
            {runIds.map((id) => (
              <li key={id} className="flex gap-sm items-center" data-activity-run={id}>
                <StudioLink to={pathFor('runs', id)} testId={`org-activity-run-${id}`} tipText={t('tips.orgDesigner.overlay.openRun')}>
                  <code>{id}</code>
                </StudioLink>
                <StudioLink to={pathFor('runs', id, { tab: 'trail' })} testId={`org-activity-trail-${id}`} tipText={t('tips.orgDesigner.overlay.openTrail')}>
                  {t('components.orgDesigner.overlay.openTrail')}
                </StudioLink>
              </li>
            ))}
          </ul>
        )}
        <StudioLink to={pathFor('performance', organization?.id)} testId="org-activity-performance" tipText={t('tips.views.organizationDetail.openPerformance')}>
          {t('views.organizationDetail.openPerformance')}
        </StudioLink>
      </div>
    );
  };

  return (
    <ReactFlowProvider>
      <div className="org-chart-canvas" data-testid="org-chart-canvas">
        <div className="range-group segmented" role="group" aria-label={t('components.orgDesigner.overlay.range')}>
          {CHART_RANGES.map((d) => (
            <button key={d} type="button" aria-pressed={days === d} className={`range-btn ${days === d ? 'active' : ''}`} onClick={() => setDays(d)} data-testid={`org-chart-range-${d}`} {...tip(t('tips.orgDesigner.overlay.range'))}>
              {t('components.orgDesigner.overlay.days', { count: d })}
            </button>
          ))}
        </div>
        <OrgCanvas source={source} scopeId={`chart-${organization?.id || ''}`} readOnly decorations={decorations} renderPanel={renderPanel} agents={agents} say={() => {}} />
      </div>
    </ReactFlowProvider>
  );
}
