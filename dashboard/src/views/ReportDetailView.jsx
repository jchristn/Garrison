import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import OpenTrailLink from '../components/trail/OpenTrailLink';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import JsonViewerModal from '../components/JsonViewerModal';
import ReportMetricChart from '../components/ReportMetricChart';
import { ReportHealthBadge, ReportIssueSeverityBadge } from '../components/ReportBadges';
import { EmptyNote, EmptyState, ErrorBanner, LoadingState } from '../components/States';
import { CodeIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { appPath, authorText, filedByText, periodText } from '../utils/reports';

function Detail({ name, t, span = false, children }) {
  return (
    <div className={`detail-item ${span ? 'detail-item-span' : ''}`} data-report-field={name}>
      <div className="detail-item-label" {...tip(t(`tips.views.reportDetail.fields.${name}`))}>
        {t(`views.reportDetail.fields.${name}`)}
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

function Section({ id, t, children, testId }) {
  return (
    <section className="panel" aria-labelledby={`report-${id}-title`} data-testid={testId}>
      <h2 id={`report-${id}-title`} className="section-title" {...tip(t(`tips.views.reportDetail.${id}`))}>
        {t(`views.reportDetail.${id}`)}
      </h2>
      {children}
    </section>
  );
}

/**
 * One report (AA5.10): its health, kind, audience, author, run, keeper, app, and period, the body as plain text, the
 * metrics table, the issues by severity, the decisions, and who filed it, then a chart of one metric across every
 * report of the same author. Reports are immutable, so the page has no edit or delete. Everything the author wrote is
 * data and renders as text, never as markup.
 */
export default function ReportDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    apiClient
      .getReport(tenantId, recordId)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e) => setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  if (error && !report) {
    return (
      <div>
        <PageHeader title={t('views.reportDetail.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('views.reportDetail.notFoundTitle')} body={t('views.reportDetail.notFoundBody')} />}
      </div>
    );
  }
  if (!report) return <LoadingState />;

  const r = report;
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'medium' })}</span> : '-');
  const author = authorText(r);
  const app = appPath(r);
  const metrics = r.metrics || [];
  const issues = r.issues || [];
  const decisions = r.decisions || [];

  return (
    <div className="page-flow" data-testid="report-detail">
      <PageHeader
        title={r.title}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={r.id} max={40} /> <ReportHealthBadge health={r.health} t={t} />{' '}
            <span className="pill pill-neutral" {...tip(enumTip(t, 'reportKind', r.kind))}>
              {enumLabel(t, 'reportKind', r.kind)}
            </span>
          </span>
        }
        back={
          <Link to={pathFor('reports')} tipText={t('tips.views.reportDetail.back')} testId="report-back">
            {t('views.reportDetail.back')}
          </Link>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.reportDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
          </>
        }
      />

      <p className="text-muted report-untrusted" data-testid="report-untrusted">
        {t('reports.untrusted')}
      </p>

      <div className="panel detail-grid">
        <Detail name="health" t={t}>
          <ReportHealthBadge health={r.health} t={t} />
        </Detail>
        <Detail name="kind" t={t}>
          <span {...tip(enumTip(t, 'reportKind', r.kind))}>{enumLabel(t, 'reportKind', r.kind)}</span>
        </Detail>
        <Detail name="audience" t={t}>
          <span {...tip(enumTip(t, 'reportAudience', r.audience))}>{enumLabel(t, 'reportAudience', r.audience)}</span>
        </Detail>
        <Detail name="author" t={t}>
          {r.authorAgentId ? (
            <Link to={pathFor('agents', r.authorAgentId)} tipText={t('tips.views.reportDetail.openAgent')} testId="report-author-link">
              {author}
            </Link>
          ) : (
            author || '-'
          )}
        </Detail>
        <Detail name="period" t={t}>{periodText(t, r, lng) || '-'}</Detail>
        <Detail name="createdUtc" t={t}>{when(r.createdUtc)}</Detail>
        <Detail name="filedBy" t={t}>{filedByText(t, r) || '-'}</Detail>
        <Detail name="runId" t={t}>
          {r.runId ? (
            <span className="inline-meta">
              <Link to={pathFor('runs', r.runId)} tipText={t('tips.views.reportDetail.openRun')} testId="report-run-link">
                <code>{r.runId}</code>
              </Link>
              <OpenTrailLink runId={r.runId} step={r.id} testId="report-open-trail" />
            </span>
          ) : (
            '-'
          )}
        </Detail>
        <Detail name="mandateId" t={t}>
          {r.mandateId ? (
            <Link to={pathFor('keepers', r.mandateId)} tipText={t('tips.views.reportDetail.openKeeper')} testId="report-keeper-link">
              <code>{r.mandateId}</code>
            </Link>
          ) : (
            '-'
          )}
        </Detail>
        <Detail name="mandateTickId" t={t}>{r.mandateTickId ? <CopyableId value={r.mandateTickId} /> : '-'}</Detail>
        <Detail name="app" t={t}>
          {app ? (
            <Link to={app} tipText={t('tips.views.reportDetail.openApp')} testId="report-app-link">
              {r.appName || r.appId}
            </Link>
          ) : (
            '-'
          )}
        </Detail>
        <Detail name="orgUnitId" t={t}>{r.orgUnitId ? <CopyableId value={r.orgUnitId} /> : '-'}</Detail>
      </div>

      <Section id="body" t={t} testId="report-body-panel">
        {r.body ? (
          <pre className="report-body" data-testid="report-body">
            {r.body}
          </pre>
        ) : (
          <EmptyNote>{t('views.reportDetail.noBody')}</EmptyNote>
        )}
      </Section>

      <Section id="metrics" t={t} testId="report-metrics-panel">
        {metrics.length === 0 ? (
          <EmptyNote>{t('views.reportDetail.noMetrics')}</EmptyNote>
        ) : (
          <div className="table-scroll">
            <table className="data-table compact" data-testid="report-metrics">
              <thead>
                <tr>
                  <th scope="col" {...tip(t('tips.views.reportDetail.columns.name'))}>{t('views.reportDetail.columns.name')}</th>
                  <th scope="col" className="right" {...tip(t('tips.views.reportDetail.columns.value'))}>{t('views.reportDetail.columns.value')}</th>
                  <th scope="col" {...tip(t('tips.views.reportDetail.columns.unit'))}>{t('views.reportDetail.columns.unit')}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={`${m.name}-${i}`}>
                    <td className="report-text-cell">{m.name}</td>
                    <td className="right nowrap">{formatNumber(m.value, { maximumFractionDigits: 6 }, lng)}</td>
                    <td>{m.unit || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section id="chart" t={t} testId="report-chart-panel">
        <ReportMetricChart report={r} />
      </Section>

      <Section id="issues" t={t} testId="report-issues-panel">
        {issues.length === 0 ? (
          <EmptyNote>{t('views.reportDetail.noIssues')}</EmptyNote>
        ) : (
          <ul className="report-list" data-testid="report-issues">
            {issues.map((issue, i) => (
              <li key={i}>
                <ReportIssueSeverityBadge severity={issue.severity} t={t} />
                <span className="report-text">{issue.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="decisions" t={t} testId="report-decisions-panel">
        {decisions.length === 0 ? (
          <EmptyNote>{t('views.reportDetail.noDecisions')}</EmptyNote>
        ) : (
          <ol className="report-list report-decisions" data-testid="report-decisions">
            {decisions.map((d, i) => (
              <li key={i}>
                <span className="report-text">{d.text}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <JsonViewerModal open={jsonOpen} value={r} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
