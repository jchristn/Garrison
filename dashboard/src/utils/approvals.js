// Helpers for permission approvals (P12.3): tool input fields for the rule tester, run event notices, and rule
// editing. Plain functions so Node-based tests can import them.

import { APPROVAL_TIMEOUT } from './constants';

/** Common tool names offered by the rule tester; any other tool name (for example an MCP tool) may be typed. */
export const APPROVAL_TEST_TOOLS = ['Bash', 'Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Glob', 'Grep', 'WebFetch', 'WebSearch'];

/** Example values the rule tester shows as placeholders, by input field. Literal values, so they are not translated. */
export const APPROVAL_INPUT_EXAMPLES = {
  command: 'npm run build && npm test',
  url: 'https://example.com/docs',
  query: 'release notes',
  file_path: 'src/index.js',
  notebook_path: 'notebooks/report.ipynb',
  pattern: '**/*.test.js'
};

/**
 * The tool input field the rule tester fills for a tool, matching Claude Code tool inputs (snake_case file_path and
 * notebook_path), or null for tools whose rules match on the name alone (MCP tools, for example).
 * @param {string} toolName Tool name such as Bash or WebFetch.
 * @returns {'command'|'url'|'query'|'file_path'|'notebook_path'|'pattern'|null}
 */
export function approvalInputField(toolName) {
  const tool = String(toolName || '').trim();
  if (tool === 'Bash') return 'command';
  if (tool === 'WebFetch') return 'url';
  if (tool === 'WebSearch') return 'query';
  if (['Read', 'Edit', 'Write', 'MultiEdit'].includes(tool)) return 'file_path';
  if (tool === 'NotebookEdit') return 'notebook_path';
  if (tool === 'Glob' || tool === 'Grep') return 'pattern';
  return null;
}

/**
 * Body for POST deployments/{id}/approval-check from the tester's tool name and value.
 * @returns {{toolName: string, input?: object}}
 */
export function approvalCheckBody(toolName, value) {
  const tool = String(toolName || '').trim();
  const field = approvalInputField(tool);
  const text = typeof value === 'string' ? value.trim() : '';
  return field && text ? { toolName: tool, input: { [field]: text } } : { toolName: tool };
}

/**
 * The approval notice a worker attaches as rawEvent (a JSON object) to ApprovalRequested and ApprovalDecided run
 * events, or null. Accepts camelCase and PascalCase property names.
 * @returns {{approvalId: string|null, status: string|null, decision: string|null, decisionSource: string|null}|null}
 */
export function parseApprovalNotice(event) {
  if (!event || (event.code !== 'ApprovalRequested' && event.code !== 'ApprovalDecided') || !event.rawEvent) return null;
  try {
    const raw = event.rawEvent;
    if (!raw || typeof raw !== 'object') return null;
    const pick = (name) => raw[name] ?? raw[name.charAt(0).toUpperCase() + name.slice(1)] ?? null;
    return { approvalId: pick('approvalId'), status: pick('status'), decision: pick('decision'), decisionSource: pick('decisionSource') };
  } catch {
    return null;
  }
}

/** Deployment form values for the approval settings, with the server defaults filled in for older records. */
export function approvalFormDefaults(record) {
  const r = record || {};
  return {
    approvalsEnabled: !!r.approvalsEnabled,
    approvalDefaultAction: r.approvalDefaultAction || 'Ask',
    approvalTimeoutSeconds: r.approvalTimeoutSeconds ?? APPROVAL_TIMEOUT.default,
    approvalTimeoutDecision: r.approvalTimeoutDecision || 'Deny',
    approvalRules: Array.isArray(r.approvalRules) ? r.approvalRules.map((rule) => ({ ...rule })) : []
  };
}

/**
 * Approval rules for the API body, in list order. Each rule keeps its id (dar_...) so the server updates it instead
 * of replacing it; new rules have none. Optional text is trimmed and sent as null when empty.
 */
export function approvalRulesToBody(rules) {
  return (Array.isArray(rules) ? rules : []).map((rule) => {
    const out = { action: rule.action || 'Ask', pattern: String(rule.pattern || '').trim() };
    if (rule.id) out.id = rule.id;
    const input = String(rule.inputPattern || '').trim();
    const description = String(rule.description || '').trim();
    out.inputPattern = input || null;
    out.description = description || null;
    return out;
  });
}

/**
 * Client-side checks that mirror the server's: a pattern on every rule, one line, at most 1,000 characters, at most
 * 500 rules, and a timeout from 10 to 3,600 seconds. Returns { field: message } (empty when valid).
 */
export function approvalErrors(form, t) {
  const errors = {};
  const rules = Array.isArray(form?.approvalRules) ? form.approvalRules : [];
  const problems = [];
  rules.forEach((rule, i) => {
    const pattern = String(rule?.pattern || '').trim();
    if (!pattern) problems.push(t('common.errors.listItem', { index: i + 1, message: t('resources.deployments.errors.rulePatternRequired') }));
    else if (/[\r\n]/.test(pattern)) problems.push(t('common.errors.listItem', { index: i + 1, message: t('resources.deployments.errors.rulePatternOneLine') }));
    else if (pattern.length > 1000) problems.push(t('common.errors.listItem', { index: i + 1, message: t('resources.deployments.errors.rulePatternTooLong') }));
  });
  if (rules.length > 500) problems.push(t('resources.deployments.errors.tooManyRules'));
  if (problems.length) errors.approvalRules = problems.join(' ');
  const timeout = form?.approvalTimeoutSeconds;
  if (timeout !== null && timeout !== undefined && timeout !== '' && (!Number.isInteger(Number(timeout)) || Number(timeout) < APPROVAL_TIMEOUT.min || Number(timeout) > APPROVAL_TIMEOUT.max)) {
    errors.approvalTimeoutSeconds = t('resources.deployments.errors.approvalTimeout');
  }
  return errors;
}

/**
 * One sidebar badge count for everything waiting for a person: pending approvals (P12.3) plus pending pipeline stage
 * reviews (P12.9). Null when both are unknown (null or undefined); an unknown part counts as zero.
 */
export function combinedPending(approvals, reviews) {
  const a = approvals ?? null;
  const r = reviews ?? null;
  if (a === null && r === null) return null;
  return (a ?? 0) + (r ?? 0);
}
