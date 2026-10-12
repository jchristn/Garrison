// Permission approvals (P12.3): the inbox configuration, the decide dialog (including 409 and 403), the rule tester,
// the deployment editor's approval settings and ordered rules, run detail additions, and the run timeline events.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import { ApprovalsProvider } from '../context/ApprovalsContext';
import ApprovalDecideModal from '../components/ApprovalDecideModal';
import ApprovalCheckPanel from '../components/ApprovalCheckPanel';
import RunTimeline from '../components/RunTimeline';
import RunTelemetryPanel from '../components/RunTelemetryPanel';
import Sidebar from '../components/Sidebar';
import { approvalsConfig, runsConfig } from '../views/runConfigs';
import { deploymentsConfig } from '../views/resourceConfigs';
import { approvalInputField, approvalCheckBody, parseApprovalNotice, approvalRulesToBody, approvalErrors, approvalFormDefaults } from '../utils/approvals';
import { withListItemErrors } from '../utils/errors';
import { translateServerText } from '../utils/serverText';
import { runTelemetry } from '../utils/telemetry';
import { ENUMS } from '../utils/constants';
import { findPage, pathFor } from '../config/navConfig';
import { respond, approval, decidedApproval, APPROVAL_CHECK } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const tenantUrl = (sub) => new URL(`http://127.0.0.1/v1.0/api/tenants/default/${sub}`);
const t = (...args) => i18n.t(...args);

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

/** Render into a real DOM node with the contexts the approval components read. */
function mount(element, { apiClient = {}, addToast = vi.fn(), refresh = vi.fn(), pending = 0 } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>
              <ApprovalsProvider value={{ pending, refresh }}>{element}</ApprovalsProvider>
            </ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast, refresh };
}

/** Set a controlled input's value the way React listens for it. */
function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);

describe('approvals navigation and enums', () => {
  it('adds an Approvals page that owns its detail route', () => {
    const page = findPage('approvals');
    expect(page.hub).toBe('approvals');
    expect(page.detail).toBe(true);
    expect(pathFor('approvals')).toBe('/dashboard/approvals');
    expect(pathFor('approvals', 'apr_1')).toBe('/dashboard/approvals/apr_1');
  });

  it('mirrors the server enums and the new audit event', () => {
    expect(ENUMS.approvalStatus).toEqual(['Pending', 'Approved', 'Denied', 'Expired', 'Cancelled']);
    expect(ENUMS.approvalRuleAction).toEqual(['Allow', 'Deny', 'Ask']);
    expect(ENUMS.approvalSource).toEqual(['Rule', 'Default', 'User', 'Timeout', 'Cancelled']);
    expect(ENUMS.approvalKind).toEqual(['Tool', 'Command', 'FileChange']);
    expect(ENUMS.auditEventType).toContain('ApprovalDecided');
    expect(ENUMS.resourceType).toContain('Approval');
  });

  it('shows the pending count on the sidebar item', () => {
    const { container } = mount(<Sidebar />, { pending: 3 });
    const badge = container.querySelector('[data-nav="approvals"] [data-testid="approvals-badge"]');
    expect(badge.textContent).toBe('3');
    expect(badge.getAttribute('data-tip')).toMatch(/3 tool calls are waiting/);
  });

  it('hides the badge when nothing is pending or the count is unknown', () => {
    const { container } = mount(<Sidebar />, { pending: 0 });
    expect(container.querySelector('[data-testid="approvals-badge"]')).toBeNull();
  });
});

describe('approvals inbox', () => {
  const ctx = { t, i18n, navigate: vi.fn(), setExtraModal: vi.fn(), reload: vi.fn() };
  const rows = () => respond('GET', tenantUrl('approvals?maxResults=25&skip=0')).objects;

  it('opens on pending approvals and filters by status, agent, source, and run', () => {
    expect(approvalsConfig.defaultFilters).toEqual({ status: 'Pending' });
    expect(approvalsConfig.filters.map((f) => f.name)).toEqual(['status', 'agentId', 'decisionSource', 'runId']);
    const agent = approvalsConfig.filters.find((f) => f.name === 'agentId');
    expect(agent.options({ agents: { agt_1: 'echo-agent' } })).toEqual(['agt_1']);
    expect(agent.optionLabel('agt_1', t, { agents: { agt_1: 'echo-agent' } })).toBe('echo-agent');
    expect(approvalsConfig.filters.find((f) => f.name === 'runId').type).toBe('text');
    expect(approvalsConfig.urlFilters).toContain('runId');
  });

  it('renders status, decision, source with the matched rule, and expiry', () => {
    const cols = Object.fromEntries(approvalsConfig.columns(ctx).map((c) => [c.key, c]));
    const pending = rows().find((r) => r.status === 'Pending');
    const byRule = rows().find((r) => r.decisionSource === 'Rule');
    const status = renderToStaticMarkup(cols.status.render(pending));
    expect(status).toContain('pill-warning');
    expect(status).toContain('Pending');
    expect(renderToStaticMarkup(cols.decision.render(pending))).toBe('-');
    expect(renderToStaticMarkup(cols.decision.render(byRule))).toContain('pill-success');
    const source = renderToStaticMarkup(cols.decisionSource.render(byRule));
    expect(source).toContain('Rule');
    expect(source).toContain('Bash(git status:*)');
    expect(cols.expiresUtc.render(byRule)).toBe('-');
    // Relative to now (mock times are fixed), with the exact time in the tooltip.
    expect(renderToStaticMarkup(cols.expiresUtc.render(pending))).toMatch(/^<span data-tip="[^"]+">[^<]+<\/span>$/);
    expect(['createdUtc', 'agentName', 'toolName', 'summary', 'status', 'decision', 'decisionSource', 'decidedBy', 'expiresUtc'].every((k) => !cols[k].defaultHidden)).toBe(true);
  });

  it('offers Allow and Deny only on pending rows and opens the decide dialog', () => {
    const pending = rows().find((r) => r.status === 'Pending');
    const decided = rows().find((r) => r.status === 'Denied');
    const visible = (r) => approvalsConfig.rowActions(r, ctx).filter((a) => !a.hidden).map((a) => a.label);
    expect(visible(pending)).toEqual(['Allow', 'Deny', 'Open run']);
    expect(visible(decided)).toEqual(['Open run']);
    approvalsConfig.rowActions(pending, ctx)[1].onClick();
    const modal = ctx.setExtraModal.mock.calls.at(-1)[0];
    expect(modal.props.approval.id).toBe(pending.id);
    expect(modal.props.initialDecision).toBe('Deny');
  });

  it('marks runs that wait for a person in the runs list', () => {
    const status = runsConfig.columns(ctx).find((c) => c.key === 'status');
    const waiting = respond('GET', tenantUrl('runs/run_0002'));
    expect(waiting.awaitingApproval).toBe(true);
    expect(renderToStaticMarkup(status.render(waiting))).toContain('Awaiting approval');
    expect(renderToStaticMarkup(status.render(respond('GET', tenantUrl('runs/run_0001'))))).not.toContain('Awaiting approval');
  });
});

describe('decide dialog', () => {
  const pending = approval(1);

  it('allows with a reason and remembers an edited rule', async () => {
    const decideApproval = vi.fn().mockResolvedValue(decidedApproval(pending.id));
    const onDecided = vi.fn();
    const { addToast, refresh } = mount(<ApprovalDecideModal approval={pending} onClose={() => {}} onDecided={onDecided} />, { apiClient: { decideApproval } });
    expect(q('[data-testid="decide-allow"]').checked).toBe(true);
    act(() => type(q('#approval-reason'), 'Release day'));
    act(() => q('[data-testid="decide-remember"]').click());
    const pattern = q('[data-testid="decide-rule-pattern"]');
    expect(pattern.value).toBe('Bash(git push:*)');
    act(() => type(pattern, 'Bash(git push origin:*)'));
    await act(async () => q('[data-testid="decide-submit"]').click());
    expect(decideApproval).toHaveBeenCalledWith('default', pending.id, { decision: 'Allow', reason: 'Release day', remember: true, rulePattern: 'Bash(git push origin:*)' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Allowed Bash and added the rule Bash(git push origin:*).' });
    expect(refresh).toHaveBeenCalled();
    expect(onDecided).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved' }));
  });

  it('denies without remembering and sends only the decision', async () => {
    const decideApproval = vi.fn().mockResolvedValue({ ...pending, status: 'Denied', decision: 'Deny' });
    mount(<ApprovalDecideModal approval={pending} initialDecision="Deny" onClose={() => {}} onDecided={() => {}} />, { apiClient: { decideApproval } });
    expect(q('[data-testid="decide-submit"]').className).toContain('button-danger');
    await act(async () => q('[data-testid="decide-submit"]').click());
    expect(decideApproval).toHaveBeenCalledWith('default', pending.id, { decision: 'Deny' });
  });

  it('needs a rule pattern when remembering', () => {
    mount(<ApprovalDecideModal approval={{ ...pending, suggestedRule: null }} onClose={() => {}} onDecided={() => {}} />, { apiClient: { decideApproval: vi.fn() } });
    act(() => q('[data-testid="decide-remember"]').click());
    expect(q('[data-testid="decide-submit"]').disabled).toBe(true);
    expect(document.body.textContent).toContain('This field is required.');
  });

  it('explains a 409 ApprovalNotPending with a warning and reports it decided', async () => {
    const err = Object.assign(new Error('not pending'), { status: 409, code: 'ApprovalNotPending' });
    const onDecided = vi.fn();
    const { addToast } = mount(<ApprovalDecideModal approval={pending} onClose={() => {}} onDecided={onDecided} />, { apiClient: { decideApproval: vi.fn().mockRejectedValue(err) } });
    await act(async () => q('[data-testid="decide-submit"]').click());
    expect(addToast).toHaveBeenCalledWith({ type: 'warning', message: expect.stringMatching(/already decided/) });
    expect(onDecided).toHaveBeenCalledWith(null);
  });

  it('explains a 403 on remember as a missing deployment permission and keeps the dialog open', async () => {
    const err = Object.assign(new Error('denied'), { status: 403, code: 'AuthorizationDenied' });
    const onDecided = vi.fn();
    const { addToast } = mount(<ApprovalDecideModal approval={pending} onClose={() => {}} onDecided={onDecided} />, { apiClient: { decideApproval: vi.fn().mockRejectedValue(err) } });
    act(() => q('[data-testid="decide-remember"]').click());
    await act(async () => q('[data-testid="decide-submit"]').click());
    expect(addToast).toHaveBeenCalledWith({ type: 'error', message: expect.stringMatching(/permission to update the deployment/) });
    expect(onDecided).not.toHaveBeenCalled();
    expect(q('[data-testid="approval-decide"]')).not.toBeNull();
  });
});

describe('rule tester', () => {
  it('maps tools to the input field Claude Code uses', () => {
    expect(approvalInputField('Bash')).toBe('command');
    expect(approvalInputField('WebFetch')).toBe('url');
    expect(approvalInputField('Edit')).toBe('file_path');
    expect(approvalInputField('NotebookEdit')).toBe('notebook_path');
    expect(approvalInputField('mcp__github__create_issue')).toBeNull();
    expect(approvalCheckBody(' Bash ', ' npm test ')).toEqual({ toolName: 'Bash', input: { command: 'npm test' } });
    expect(approvalCheckBody('mcp__github__create_issue', 'ignored')).toEqual({ toolName: 'mcp__github__create_issue' });
  });

  it('posts the tool call to approval-check and shows the rule that decided it', async () => {
    const checkApproval = vi.fn().mockResolvedValue(respond('POST', tenantUrl('deployments/dep_0001/approval-check')));
    mount(<ApprovalCheckPanel deploymentId="dep_0001" />, { apiClient: { checkApproval } });
    act(() => type(q('[data-testid="approval-check-value"]'), 'git status'));
    await act(async () => q('[data-testid="approval-check-run"]').click());
    expect(checkApproval).toHaveBeenCalledWith('default', 'dep_0001', { toolName: 'Bash', input: { command: 'git status' } });
    expect(q('[data-testid="approval-check-result"]').textContent).toContain('Allow by this rule:');
    expect(q('[data-testid="approval-check-rule"]').textContent).toBe(APPROVAL_CHECK.rulePattern);
  });

  it('says when approvals are off and asks to save a new deployment first', async () => {
    const checkApproval = vi.fn().mockResolvedValue({ action: 'Ask', source: 'Default', approvalsEnabled: false, suggestedRule: 'Read' });
    mount(<ApprovalCheckPanel deploymentId="dep_0002" />, { apiClient: { checkApproval } });
    act(() => type(q('[data-testid="approval-check-tool"]'), 'Read'));
    await act(async () => q('[data-testid="approval-check-run"]').click());
    expect(q('[data-testid="approval-check-result"]').textContent).toContain('by the deployment default');
    expect(q('[data-testid="approval-check-disabled"]')).not.toBeNull();
    mount(<ApprovalCheckPanel deploymentId={null} />);
    expect(q('[data-testid="approval-check-unsaved"]')).not.toBeNull();
  });
});

describe('deployment editor approvals', () => {
  const record = respond('GET', tenantUrl('deployments/dep_0001'));

  it('adds an Approvals step with the settings, ordered rules, and the tester', () => {
    expect(deploymentsConfig.steps.at(-1)).toBe('approvals');
    const fields = deploymentsConfig.fields(deploymentsConfig.toForm(record), { t, i18n, mode: 'edit', options: {} }).filter((f) => f.step === 6);
    expect(fields.map((f) => f.name)).toEqual(['approvalsEnabled', 'approvalDefaultAction', 'approvalTimeoutSeconds', 'approvalTimeoutDecision', 'approvalRules', 'approvalTest']);
    const rules = fields.find((f) => f.name === 'approvalRules');
    expect(rules.ordered).toBe(true);
    expect(rules.fields.map((f) => f.name)).toEqual(['action', 'pattern', 'inputPattern', 'description']);
    expect(rules.fields[0].options.map((o) => o.value)).toEqual(['Allow', 'Deny', 'Ask']);
    const timeout = fields.find((f) => f.name === 'approvalTimeoutSeconds');
    expect([timeout.min, timeout.max]).toEqual([10, 3600]);
    expect(fields.find((f) => f.name === 'approvalDefaultAction').options.map((o) => o.value)).toEqual(['Allow', 'Deny', 'Ask']);
    expect(fields.find((f) => f.name === 'approvalTimeoutDecision').options.map((o) => o.value)).toEqual(['Allow', 'Deny']);
  });

  it('keeps rule IDs and order through edit and save', () => {
    const form = deploymentsConfig.toForm(record);
    const reordered = { ...form, approvalRules: [form.approvalRules[2], form.approvalRules[0], { action: 'Deny', pattern: ' Bash(curl:*) ', inputPattern: '', description: '' }] };
    const body = deploymentsConfig.toBody(reordered);
    expect(body.approvalRules).toEqual([
      { id: 'dar_0003', action: 'Ask', pattern: 'WebFetch', inputPattern: '"url":"https://internal\\.', description: null },
      { id: 'dar_0001', action: 'Allow', pattern: 'Bash(git status:*)', inputPattern: null, description: 'Read-only status checks' },
      { action: 'Deny', pattern: 'Bash(curl:*)', inputPattern: null, description: null }
    ]);
    expect(body).toMatchObject({ approvalsEnabled: true, approvalDefaultAction: 'Ask', approvalTimeoutSeconds: 300, approvalTimeoutDecision: 'Deny' });
    expect(approvalRulesToBody(undefined)).toEqual([]);
  });

  it('fills server defaults for new and older deployments', () => {
    expect(approvalFormDefaults(null)).toEqual({ approvalsEnabled: false, approvalDefaultAction: 'Ask', approvalTimeoutSeconds: 300, approvalTimeoutDecision: 'Deny', approvalRules: [] });
    expect(deploymentsConfig.blank()).toMatchObject({ approvalsEnabled: false, approvalRules: [] });
  });

  it('validates rule patterns and the timeout before saving', () => {
    const errors = approvalErrors({ approvalRules: [{ pattern: 'Bash' }, { pattern: '' }, { pattern: 'a\nb' }], approvalTimeoutSeconds: 5 }, t);
    expect(errors.approvalRules).toBe('Item 2: Enter a rule pattern. Item 3: A rule pattern must fit on one line.');
    expect(errors.approvalTimeoutSeconds).toMatch(/10 to 3,600/);
    expect(approvalErrors({ approvalRules: [{ pattern: 'Read' }], approvalTimeoutSeconds: 300 }, t)).toEqual({});
  });

  it('shows server errors for one rule under the rules list', () => {
    const out = withListItemErrors(t, { 'approvalRules[1].pattern': 'Unclosed specifier.', name: 'Taken.' });
    expect(out.approvalRules).toBe('Item 2: Unclosed specifier.');
    expect(out.name).toBe('Taken.');
    expect(withListItemErrors(t, null)).toBeNull();
  });
});

describe('run detail and timeline', () => {
  it('reports the approval wait in telemetry', () => {
    expect(runTelemetry({ approvalWaitMs: 42000 }).approvalWaitMs).toBe(42000);
    expect(runTelemetry({}).approvalWaitMs).toBeNull();
    const markup = renderToStaticMarkup(
      <ToastContext.Provider value={{ addToast: () => {} }}>
        <RunTelemetryPanel run={{ id: 'run_1', approvalWaitMs: 42000, executionMs: 60000 }} />
      </ToastContext.Provider>
    );
    expect(markup).toContain('data-telemetry="approvalWaitMs"');
    expect(markup).toContain('data-testid="approval-wait-note"');
  });

  it('labels approval events, links the approval, and colors the verdict', () => {
    const notice = (status, decision) => JSON.stringify({ runId: 'run_1', approvalId: 'apr_0009', status, decision, decisionSource: decision ? 'User' : null, toolName: 'Bash', summary: 'git push' });
    const events = [
      { sequence: 1, eventType: 'Lifecycle', code: 'ApprovalRequested', text: 'Waiting for a person to approve Bash (git push); approval apr_0009 expires at 2026-10-09 12:05:00Z.', rawEventJson: notice('Pending') },
      { sequence: 2, eventType: 'Lifecycle', code: 'ApprovalDecided', text: 'Bash (git push) denied by admin@garrison (approval apr_0009): no.', rawEventJson: notice('Denied', 'Deny') }
    ];
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <RunTimeline events={events} />
      </MemoryRouter>
    );
    expect(markup).toContain('data-event-code="ApprovalRequested"');
    expect(markup).toContain('Approval requested');
    expect(markup).toContain('Approval decided');
    expect(markup).toContain('timeline-item timeline-warning');
    expect(markup).toContain('timeline-item timeline-danger');
    expect(markup).toContain('href="/dashboard/approvals/apr_0009"');
    expect(markup).toContain('Waiting for a person to approve Bash (git push); approval apr_0009 expires at 2026-10-09 12:05:00Z.');
    expect(parseApprovalNotice(events[1])).toEqual({ approvalId: 'apr_0009', status: 'Denied', decision: 'Deny', decisionSource: 'User' });
    expect(parseApprovalNotice({ code: 'ApprovalDecided', rawEventJson: 'not json' })).toBeNull();
    expect(parseApprovalNotice({ code: 'HarnessExited', rawEventJson: '{}' })).toBeNull();
  });

  it('translates the waiting message', async () => {
    await i18n.changeLanguage('de');
    const de = i18n.getFixedT('de');
    const text = 'Waiting for a person to approve Bash (git push); approval apr_1 expires at 2026-10-09 12:05:00Z.';
    const translated = translateServerText(de, text);
    expect(translated).not.toBe(text);
    expect(translated).toContain('apr_1');
    expect(translateServerText(de, 'Waiting for a person to approve WebFetch; approval apr_2.')).toContain('apr_2');
    await i18n.changeLanguage('en');
  });

  it('translates the approval labels in every locale', () => {
    for (const lng of ['de', 'es', 'fr', 'it', 'ja', 'zh-Hans', 'zh-Hant', 'yue-Hant']) {
      const tl = i18n.getFixedT(lng);
      expect(tl('nav.hubs.approvals.label'), lng).not.toBe('Approvals');
      expect(tl('enums.approvalStatus.Pending'), lng).not.toBe('Pending');
      expect(tl('components.approvals.awaiting'), lng).not.toBe('Awaiting approval');
    }
  });
});
