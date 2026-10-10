import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ExportMenu from './ExportMenu';
import { exportFileName, toCsv, buildChartSvg } from '../utils/exporters';
import { tip } from './Tooltip';
import { formatDateTime } from '../i18n/formatters';
import { runTelemetry, runPhases, formatMs, formatCount, formatRate, formatUsd } from '../utils/telemetry';

const PHASE_COLOR = { queue: 'var(--series-4)', startup: 'var(--series-1)', streaming: 'var(--series-3)', tail: 'var(--series-7)' };

/**
 * Every run telemetry field from plan section 10.6, each labeled with a tooltip that says what it measures and
 * who measures it. Nulls (not measurable for this run) render as the translated "n/a" placeholder.
 */
export default function RunTelemetryPanel({ run }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const na = t('common.generic.notAvailable');
  const tel = runTelemetry(run);
  const time = (v) => (v ? formatDateTime(v, lng, { dateStyle: 'medium', timeStyle: 'medium' }) : na);

  const rows = [
    ['timeToFirstTokenMs', formatMs(tel.timeToFirstTokenMs, lng, na)],
    ['streamingMs', formatMs(tel.streamingMs, lng, na)],
    ['executionMs', formatMs(tel.executionMs, lng, na)],
    ['queueMs', formatMs(tel.queueMs, lng, na)],
    ['totalMs', formatMs(tel.totalMs, lng, na)],
    ['outputTokensPerSecond', formatRate(tel.outputTokensPerSecond, lng, na, t('common.units.tokPerSec'))],
    ['inputTokens', formatCount(tel.inputTokens, lng, na)],
    ['outputTokens', formatCount(tel.outputTokens, lng, na)],
    ['cachedTokens', formatCount(tel.cachedTokens, lng, na)],
    ['reasoningTokens', formatCount(tel.reasoningTokens, lng, na)],
    ['toolCallCount', formatCount(tel.toolCallCount, lng, na)],
    ['costUsd', `${formatUsd(tel.costUsd, lng, na)}${tel.costUsd !== null && run?.costEstimated ? ` (${t('views.runDetail.estimated')})` : ''}`],
    ['firstTokenUtc', time(tel.firstTokenUtc)],
    ['lastTokenUtc', time(tel.lastTokenUtc)]
  ];
  const phases = runPhases(tel);
  const svgRef = useRef(null);
  const phaseLabel = (key) => t(`views.runDetail.telemetry.phase.${key}`);
  const chartTitle = t('views.runDetail.telemetry.phases');
  const fileName = (ext) => exportFileName('run-phases', run?.id || 'run', { agent: run?.agentName }, ext);

  return (
    <section className="panel" aria-labelledby="telemetry-title" data-testid="run-telemetry">
      <h2 id="telemetry-title" className="section-title" {...tip(t('tips.telemetry.panel'))}>
        {t('views.runDetail.telemetry.title')}
      </h2>
      {phases.length > 0 && (
        <>
          <div className="telemetry-phases-head">
            <ExportMenu
              title={chartTitle}
              testId="export-run-phases"
              fileName={fileName}
              csv={() => toCsv(['phase', 'duration_ms', 'share'], phases.map((p) => [p.key, p.ms, Number(p.share.toFixed(6))]))}
              json={() => JSON.stringify({ chart: 'run-phases', runId: run?.id, agent: run?.agentName, exportedUtc: new Date().toISOString(), telemetry: tel, phases }, null, 2)}
              svg={() => (svgRef.current ? buildChartSvg(svgRef.current, { title: `${chartTitle}: ${run?.agentName || ''}`, lines: [run?.id || '', run?.startedUtc ? `${run.startedUtc} / ${run.completedUtc || ''}` : ''].filter(Boolean), legend: phases.map((p) => ({ label: `${phaseLabel(p.key)} ${p.ms} ms`, color: PHASE_COLOR[p.key] })) }) : '')}
            />
          </div>
          <svg ref={svgRef} className="telemetry-phases" width="100%" height="14" viewBox="0 0 1000 14" preserveAspectRatio="none" role="img" aria-label={chartTitle} {...tip(t('tips.telemetry.phases'))}>
            {(() => {
              let x = 0;
              return phases.map((p) => {
                const w = Math.max(2, p.share * 1000);
                const rect = <rect key={p.key} x={x} y={0} width={Math.max(1, w - 2)} height={14} fill={PHASE_COLOR[p.key]} />;
                x += w;
                return rect;
              });
            })()}
          </svg>
          <div className="telemetry-legend">
            {phases.map((p) => (
              <span key={p.key} className="chart-legend-item" {...tip(t(`tips.telemetry.phase.${p.key}`))}>
                <span className="chart-swatch" style={{ background: PHASE_COLOR[p.key] }} aria-hidden="true" />
                {t(`views.runDetail.telemetry.phase.${p.key}`)} {formatMs(p.ms, lng, na)}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="telemetry-grid">
        {rows.map(([key, value]) => (
          <div className="detail-item" key={key} data-telemetry={key}>
            <div className="detail-item-label" {...tip(t(`tips.telemetry.${key}`))}>
              {t(`views.runDetail.telemetry.fields.${key}`)}
            </div>
            <div className="detail-item-value">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
