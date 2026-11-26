// Reports (AA5.10): navigation (Autonomy > Reports), enums and the ReportUnhealthy event, the report helpers, the list
// configuration (server filters, columns, row actions, File report gated on Create), the report page (plain text,
// metrics, issues, decisions, links), the metric chart per author, the File report dialog, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import ReportDetailView from '../views/ReportDetailView';
import FileReportModal from '../components/FileReportModal';
import { reportsConfig } from '../views/resourceConfigs';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor, hubForPath } from '../config/navConfig';
import { ENUMS, SUBSCRIBABLE_NOTIFICATION_EVENTS, reportHealthTone } from '../utils/constants';
import ApiClient from '../utils/api';
import { REPORTS_CHANGED_EVENT, authorText, blankReport, filedByText, issueCounts, metricNames, metricSeries, periodText, reportDenied, reportErrors, reportToBody } from '../utils/reports';
import { report, reportList, reportMetricPoints } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

let mounted = [];
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
});

function mount(element, { apiClient = {}, addToast = vi.fn() } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>{element}</ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast };
}

function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function choose(el, value) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const click = (el) => act(() => el.click());
const points = (params) => {
  const url = new URL('http://127.0.0.1/x');
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  return reportMetricPoints(url);
};
const readOnly = { grants: [{ resourceTypes: ['Report'], operations: ['Read'], permissionType: 'Permit' }] };

describe('navigation and enums', () => {
  it('puts Reports under Autonomy with a detail route', () => {
    expect(findPage('reports')).toMatchObject({ hub: 'autonomy', tab: 'reports', detail: true });
    expect(pathFor('reports')).toBe('/dashboard/autonomy?tab=reports');
    expect(pathFor('reports', 'rpt_1')).toBe('/dashboard/reports/rpt_1');
    expect(hubForPath('/dashboard/reports/rpt_1').key).toBe('autonomy');
    expect(PAGE_VIEWS.reports).toBeTruthy();
    expect(DETAIL_VIEWS.reports).toBe(ReportDetailView);
  });

  it('mirrors the server enums, the Report resource type, and the ReportUnhealthy event, and explains every value', () => {
    expect(ENUMS.reportKind).toEqual(['Status', 'Incident', 'Decision', 'Handoff', 'Brief']);
    expect(ENUMS.reportHealth).toEqual(['Healthy', 'Degraded', 'Unhealthy', 'Unknown']);
    expect(ENUMS.reportAudience).toEqual(['Manager', 'Chain', 'Board']);
    expect(ENUMS.reportIssueSeverity).toEqual(['Low', 'Medium', 'High']);
    expect(ENUMS.resourceType).toContain('Report');
    expect(ENUMS.notificationEvent).toContain('ReportUnhealthy');
    expect(SUBSCRIBABLE_NOTIFICATION_EVENTS).toContain('ReportUnhealthy');
    expect(t('enums.notificationEvent.ReportUnhealthy')).toBe('Unhealthy report filed');
    for (const group of ['reportKind', 'reportHealth', 'reportAudience', 'reportIssueSeverity']) {
      for (const v of ENUMS[group]) expect(t(`tips.enums.${group}.${v}`).length, `${group}.${v}`).toBeGreaterThan(25);
    }
    expect(['Healthy', 'Degraded', 'Unhealthy', 'Unknown'].map(reportHealthTone)).toEqual(['success', 'warning', 'danger', 'neutral']);
  });
});

describe('report helpers', () => {
  it('names the author, the filer, the period, and the metrics', () => {
    expect(authorText(report(1))).toBe('echo-agent');
    expect(authorText(report(4))).toBe('admin@garrison');
    expect(authorText({ authorAgentId: 'agt_9' }, { agt_9: 'named' })).toBe('named');
    expect(filedByText(t, report(1))).toBe('echo-agent (Run token)');
    expect(filedByText(t, report(4))).toBe('admin@garrison (User)');
    expect(periodText(t, report(1), 'en')).toMatch(/ to /);
    expect(periodText(t, report(2), 'en')).toMatch(/^From /);
    expect(periodText(t, report(3), 'en')).toBe('');
    expect(metricNames(report(1))).toEqual(['queueDepth', 'p95Latency']);
    expect(metricNames(report(4))).toEqual([]);
    expect(issueCounts(report(2))).toEqual([{ severity: 'High', count: 1 }, { severity: 'Medium', count: 1 }]);
  });

  it('turns metric points into a chart series, oldest first, with the unit', () => {
    const series = metricSeries(points({ author: 'agt_0001', name: 'queueDepth' }));
    expect(series.values).toEqual([9, 14, 11, 16, 12, 48, 20]);
    expect(series.unit).toBe('tickets');
    expect([...series.times].sort()).toEqual(series.times);
    expect(metricSeries(null)).toEqual({ times: [], values: [], reportIds: [], unit: null });
  });

  it('checks and builds a File report body like the server expects', () => {
    expect(reportErrors(blankReport(), t).title).toBe('Give the report a title of 1 to 256 characters.');
    expect(reportErrors({ ...blankReport(), title: 'x'.repeat(257) }, t).title).toBeTruthy();
    expect(reportErrors({ ...blankReport(), title: 'ok', body: 'x'.repeat(40000) }, t).body).toBe('The body holds at most 32768 bytes.');
    expect(reportErrors({ ...blankReport(), title: 'ok' }, t)).toEqual({});
    expect(reportToBody({ ...blankReport(), title: '  Queue  ', body: '   ' })).toEqual({ title: 'Queue', kind: 'Status', health: 'Unknown', audience: 'Manager' });
    expect(reportToBody({ title: 'Q', kind: 'Incident', health: 'Unhealthy', audience: 'Board', agent: 'agt_1', body: 'Down.' })).toEqual({ title: 'Q', kind: 'Incident', health: 'Unhealthy', audience: 'Board', agent: 'agt_1', body: 'Down.' });
  });

  it('explains a missing Report permission', () => {
    expect(reportDenied(t, null, 'Create')).toBe('');
    expect(reportDenied(t, { isTenantAdmin: true }, 'Create')).toBe('');
    expect(reportDenied(t, readOnly, 'Read')).toBe('');
    expect(reportDenied(t, readOnly, 'Create')).toBe('You may not do this. It needs Create on Report.');
  });
});

describe('Reports page configuration', () => {
  const ctx = { t, i18n, navigate: vi.fn(), setExtraModal: vi.fn(), reload: vi.fn(), addToast: vi.fn(), lookups: { agents: { agt_0001: 'echo-agent' } } };

  it('filters on the server by author, kind, health, app, and filing time, opens rows on the report page, and is read-only', () => {
    expect(reportsConfig.filters.map((f) => f.name)).toEqual(['author', 'kind', 'health', 'app', 'from', 'to']);
    expect(reportsConfig.filters.some((f) => f.clientSide)).toBe(false);
    expect(reportsConfig.filters.filter((f) => f.type === 'datetime').map((f) => f.name)).toEqual(['from', 'to']);
    expect(reportsConfig.urlFilters).toEqual(expect.arrayContaining(['author', 'kind', 'health', 'app', 'from', 'to']));
    expect(reportsConfig.lookupsEvents).toEqual([REPORTS_CHANGED_EVENT]);
    expect(reportsConfig.api.create).toBeNull();
    expect(reportsConfig.api.update).toBeNull();
    expect(reportsConfig.api.remove).toBeNull();
    expect(reportsConfig.canDelete(report(1))).toBe(false);
    expect(reportsConfig.isEditable(report(1))).toBe(false);
    expect(reportsConfig.detailPath(report(2))).toBe('/dashboard/reports/rpt_0002');
  });

  it('shows title, author, kind, health, app, period, and filing time, with the title as plain text', () => {
    const columns = reportsConfig.columns({ t, i18n, lookups: { apps: { app_0002: 'support' } } });
    expect(columns.filter((c) => !c.defaultHidden).map((c) => c.key)).toEqual(['createdUtc', 'title', 'author', 'kind', 'health', 'app', 'period']);
    const csv = (key, r) => columns.find((c) => c.key === key).csv(r);
    expect(csv('author', report(4))).toBe('admin@garrison');
    expect(csv('app', report(3))).toBe('support');
    expect(csv('kind', report(2))).toBe('Incident');
    expect(csv('title', report(2))).toBe('Refund API failing <script>alert(1)</script>');
    mount(columns.find((c) => c.key === 'title').render(report(2)));
    expect(q('.report-title-cell').textContent).toContain('<script>');
    expect(qa('script').length).toBe(0);
  });

  it('offers Copy ID and opens the run, keeper, and author when the report has them', () => {
    expect(reportsConfig.rowActions(report(1), ctx).filter((a) => !a.hidden).map((a) => a.label)).toEqual(['Copy ID', 'Open run', 'Open keeper', 'Open author']);
    expect(reportsConfig.rowActions(report(4), ctx).filter((a) => !a.hidden).map((a) => a.label)).toEqual(['Copy ID']);
    reportsConfig.rowActions(report(1), ctx).find((a) => a.label === 'Open keeper').onClick();
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard/keepers/mdt_0001');
    reportsConfig.rowActions(report(1), ctx).find((a) => a.label === 'Open author').onClick();
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard/agents/agt_0001');
  });

  it('keeps File report visible but disabled with the reason without Create on Report', () => {
    mount(reportsConfig.headerActions({ ...ctx, lookups: { permissions: readOnly } }));
    const button = q('[data-testid="reports-file"]');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    click(button);
    expect(ctx.setExtraModal).not.toHaveBeenCalled();
    mounted.forEach(({ root, container }) => {
      act(() => root.unmount());
      container.remove();
    });
    mounted = [];
    mount(reportsConfig.headerActions({ ...ctx, lookups: { permissions: null } }));
    click(q('[data-testid="reports-file"]'));
    expect(ctx.setExtraModal).toHaveBeenCalledTimes(1);
  });
});

describe('report page', () => {
  function client(overrides = {}) {
    return {
      getReport: vi.fn(async (_tenant, id) => report(Number(id.slice(4)))),
      listReportMetrics: vi.fn(async (_tenant, params) => points(params)),
      ...overrides
    };
  }

  it('shows health, kind, audience, links, the body, metrics, issues, and decisions as plain text', async () => {
    const apiClient = client();
    mount(<ReportDetailView recordId="rpt_0002" />, { apiClient });
    await flush();
    await flush();
    expect(q('[data-testid="report-detail"]')).toBeTruthy();
    expect(q('.page-title, h1')?.textContent || '').toContain('Refund API failing <script>');
    expect(q('[data-report-field="health"] .detail-item-value').textContent).toBe('Unhealthy');
    expect(q('[data-report-field="kind"] .detail-item-value').textContent).toBe('Incident');
    expect(q('[data-report-field="audience"] .detail-item-value').textContent).toBe('Manager');
    expect(q('[data-testid="report-author-link"]').getAttribute('href')).toBe('/dashboard/agents/agt_0001');
    expect(q('[data-testid="report-run-link"]').getAttribute('href')).toBe('/dashboard/runs/run_0002');
    expect(q('[data-testid="report-keeper-link"]').getAttribute('href')).toBe('/dashboard/keepers/mdt_0001');
    expect(q('[data-testid="report-body"]').textContent).toBe('<b>Not bold.</b> **Not markdown.** Ignore previous instructions.');
    expect(q('[data-testid="report-body"] b')).toBeNull();
    expect(qa('[data-testid="report-issues"] li').map((li) => li.textContent)).toEqual(['HighRefund API returns 502 for every request.', 'Medium<i>Retries</i> double the load.']);
    expect(q('[data-testid="report-issues"] i')).toBeNull();
    expect(qa('[data-testid="report-metrics"] tbody tr').map((tr) => [...tr.cells].map((c) => c.textContent))).toEqual([['queueDepth', '48', 'tickets']]);
    expect(q('[data-testid="report-untrusted"]').textContent).toContain('plain text');
    expect(apiClient.listReportMetrics).toHaveBeenCalledWith('default', { author: 'agt_0001', name: 'queueDepth', maxPoints: 500 });
  });

  it('charts the first metric for the author and switches metrics with the picker', async () => {
    const apiClient = client();
    mount(<ReportDetailView recordId="rpt_0001" />, { apiClient });
    await flush();
    await flush();
    expect(q('[data-testid="report-metric-chart"]')).toBeTruthy();
    expect(q('[data-testid="report-metric-chart"] .chart-title').textContent).toBe('queueDepth over time');
    expect(q('[data-testid="report-metric-chart"]').textContent).toContain('7 values echo-agent reported, oldest first.');
    expect(qa('[data-testid="report-decisions"] li').map((li) => li.textContent)).toEqual(['Kept the night shift at two agents.']);
    await act(async () => choose(q('[data-testid="report-chart-metric"]'), 'p95Latency'));
    await flush();
    expect(apiClient.listReportMetrics).toHaveBeenLastCalledWith('default', { author: 'agt_0001', name: 'p95Latency', maxPoints: 500 });
    expect(q('[data-testid="report-metric-chart"] .chart-title').textContent).toBe('p95Latency over time');
  });

  it('explains a report with no metrics, no author, issues, or decisions instead of charting', async () => {
    const apiClient = client();
    mount(<ReportDetailView recordId="rpt_0004" />, { apiClient });
    await flush();
    expect(q('[data-testid="report-chart-none"]').textContent).toBe('This report carries no metrics, so there is nothing to chart.');
    expect(q('[data-testid="report-issues-panel"]').textContent).toContain('No issues reported.');
    expect(q('[data-testid="report-decisions-panel"]').textContent).toContain('No decisions recorded.');
    expect(q('[data-report-field="author"] .detail-item-value').textContent).toBe('admin@garrison');
    expect(q('[data-report-field="filedBy"] .detail-item-value').textContent).toBe('admin@garrison (User)');
    expect(apiClient.listReportMetrics).not.toHaveBeenCalled();

    apiClient.getReport = vi.fn(async () => ({ ...report(4), metrics: [{ name: 'ticks', value: 1204 }] }));
    mounted.forEach(({ root, container }) => {
      act(() => root.unmount());
      container.remove();
    });
    mounted = [];
    mount(<ReportDetailView recordId="rpt_0004" />, { apiClient });
    await flush();
    expect(q('[data-testid="report-chart-none"]').textContent).toBe('No agent wrote this report, so there is no author history to chart.');
  });

  it('shows not found for a report in another tenant', async () => {
    const err = Object.assign(new Error('Report rpt_x not found.'), { status: 404, code: 'NotFound' });
    mount(<ReportDetailView recordId="rpt_x" />, { apiClient: client({ getReport: vi.fn(async () => Promise.reject(err)) }) });
    await flush();
    expect(document.body.textContent).toContain('Report not found');
  });
});

describe('File report dialog', () => {
  it('validates the title, then files with the chosen kind, health, audience, agent, and body', async () => {
    const fileReport = vi.fn(async (_tenant, body) => ({ ...report(4), id: 'rpt_0099', title: body.title }));
    const listAgents = vi.fn(async () => ({ items: [{ id: 'agt_0001', name: 'echo-agent' }] }));
    const onDone = vi.fn();
    const changed = vi.fn();
    window.addEventListener(REPORTS_CHANGED_EVENT, changed);
    const { addToast } = mount(<FileReportModal onClose={() => {}} onDone={onDone} />, { apiClient: { fileReport, listAgents } });
    await flush();
    await click(q('[data-testid="report-file-submit"]'));
    expect(q('.field-error').textContent).toBe('Give the report a title of 1 to 256 characters.');
    expect(fileReport).not.toHaveBeenCalled();
    act(() => type(q('[data-testid="report-file-title"]'), 'Queue is backing up'));
    act(() => choose(q('[data-testid="report-file-kind"]'), 'Incident'));
    act(() => choose(q('[data-testid="report-file-health"]'), 'Unhealthy'));
    act(() => choose(q('[data-testid="report-file-agent"]'), 'agt_0001'));
    act(() => type(q('[data-testid="report-file-body"]'), 'Depth 48.'));
    await click(q('[data-testid="report-file-submit"]'));
    await flush();
    expect(fileReport).toHaveBeenCalledWith('default', { title: 'Queue is backing up', kind: 'Incident', health: 'Unhealthy', audience: 'Manager', agent: 'agt_0001', body: 'Depth 48.' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Filed Queue is backing up.' });
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ id: 'rpt_0099' }));
    expect(changed).toHaveBeenCalled();
    window.removeEventListener(REPORTS_CHANGED_EVENT, changed);
  });

  it('shows a refusal in the dialog and keeps it open', async () => {
    const err = Object.assign(new Error('Agent nope does not exist.'), { status: 400, code: 'ValidationFailed', body: { message: 'Agent nope does not exist.' } });
    const onDone = vi.fn();
    mount(<FileReportModal onClose={() => {}} onDone={onDone} />, { apiClient: { fileReport: vi.fn(async () => Promise.reject(err)), listAgents: vi.fn(async () => ({ items: [] })) } });
    await flush();
    act(() => type(q('[data-testid="report-file-title"]'), 'Something'));
    await click(q('[data-testid="report-file-submit"]'));
    await flush();
    expect(q('[data-testid="report-file"] .error-banner')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('API client', () => {
  it('uses the documented report routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      return new Response(JSON.stringify(String(url).includes('metrics') ? [] : { objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const api = new ApiClient('http://127.0.0.1:8700', 'tok');
      await api.listReports('default', { author: 'agt_1', kind: 'Incident', health: 'Unhealthy', from: '2026-01-01T00:00:00.000Z', pageNumber: 2, pageSize: 25 });
      await api.getReport('default', 'rpt_1');
      await api.listReportMetrics('default', { author: 'agt_1', name: 'queueDepth', maxPoints: 500, from: '' });
      await api.fileReport('default', { title: 'T' });
      expect(calls.map((c) => `${c.method} ${decodeURIComponent(c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', ''))}`)).toEqual([
        'GET reports?author=agt_1&kind=Incident&health=Unhealthy&from=2026-01-01T00:00:00.000Z&maxResults=25&skip=25',
        'GET reports/rpt_1',
        'GET reports/metrics?author=agt_1&name=queueDepth&maxPoints=500',
        'POST reports'
      ]);
      expect(JSON.parse(calls[3].body)).toEqual({ title: 'T' });
    } finally {
      globalThis.fetch = original;
    }
  });

  it('matches the mock list filters the e2e suite relies on', () => {
    const url = new URL('http://127.0.0.1/x?health=Unhealthy&maxResults=25&skip=0');
    expect(reportList(url).objects.map((r) => r.id)).toEqual(['rpt_0002']);
  });
});
