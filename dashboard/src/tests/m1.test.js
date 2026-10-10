// Unit tests for helpers added for the M1 session fixes (P9.17).
import { describe, it, expect } from 'vitest';
import { validateSetting, settingsSaveFailed } from '../utils/settings';
import { defaultTemplateFor, templatesForRole, profileSecretNeeds } from '../utils/deployments';
import { seriesDisplayLabel, chartsForTtftMode, parseAnalyticsParams, analyticsSearch } from '../utils/analytics';
import { runTelemetry, runPhases } from '../utils/telemetry';
import { observabilityServices, loopbackUrl } from '../utils/observability';
import { translateServerText, stripCodePrefix } from '../utils/serverText';
import { suggestCloneName } from '../components/CloneTemplateModal';

const t = (key, opts = {}) => {
  const values = { ...opts };
  delete values.defaultValue;
  return `${key}${Object.keys(values).length ? JSON.stringify(values) : ''}`;
};

describe('settings validation (M1-01)', () => {
  const port = { path: 'Rest.Port', type: 'integer', min: 1, max: 65535 };
  it('rejects out-of-range values instead of clamping', () => {
    expect(validateSetting(port, -5)).toEqual({ key: 'range', params: { min: 1, max: 65535 } });
    expect(validateSetting(port, 70000)).toEqual({ key: 'range', params: { min: 1, max: 65535 } });
    expect(validateSetting(port, 8700)).toBeNull();
    expect(validateSetting(port, 1.5)).toEqual({ key: 'integer', params: {} });
    expect(validateSetting(port, '')).toEqual({ key: 'number', params: {} });
    expect(validateSetting({ type: 'integer', min: 0 }, -1)).toEqual({ key: 'min', params: { min: 0 } });
  });
  it('checks allowed values and booleans', () => {
    expect(validateSetting({ type: 'enum', options: ['Sqlite', 'Postgresql'] }, 'Mysql').key).toBe('allowed');
    expect(validateSetting({ type: 'enum', options: ['Sqlite', 'Postgresql'] }, 'Sqlite')).toBeNull();
    expect(validateSetting({ type: 'boolean' }, 'maybe').key).toBe('boolean');
  });
  it('treats a response that reports errors as not saved', () => {
    expect(settingsSaveFailed({ saved: false })).toBe(true);
    expect(settingsSaveFailed({ errors: { 'Audit.RetentionDays': 'x' } })).toBe(true);
    expect(settingsSaveFailed({ saved: true, errors: {} })).toBe(false);
  });
});

describe('deployment wizard defaults (M1-03, M1-04)', () => {
  const templates = [
    { id: 'new', name: 'zz-newest', kind: 'Fragment' },
    { id: 'sys', name: 'builtin/default-system', kind: 'System', isBuiltIn: true },
    { id: 'task', name: 'builtin/default-task', kind: 'Task', isBuiltIn: true },
    { id: 'del', name: 'builtin/delegated-task', kind: 'Task', isBuiltIn: true },
    { id: 'mine', name: 'my-system', kind: 'System' }
  ];
  it('binds each role to the built-in of its kind, never the newest template', () => {
    expect(defaultTemplateFor('System', templates)).toBe('sys');
    expect(defaultTemplateFor('Task', templates)).toBe('task');
    expect(defaultTemplateFor('DelegatedTask', templates)).toBe('del');
    expect(defaultTemplateFor('System', [templates[0], templates[4]])).toBe('mine');
    expect(defaultTemplateFor('Custom', templates)).toBe('');
  });
  it('offers templates of the matching kind, keeping the current one', () => {
    expect(templatesForRole('System', templates).map((x) => x.id)).toEqual(['sys', 'mine']);
    expect(templatesForRole('Task', templates, 'new').map((x) => x.id)).toEqual(['task', 'del', 'new']);
  });
  it('reads the secrets a harness profile expects', () => {
    const profile = {
      environment: [{ valueTemplate: '{{secret.kind.AnthropicApiKey}}' }, { valueTemplate: '{{secret.kind.ClaudeCodeOAuthToken}}' }, { valueTemplate: '{{secret.github}}' }],
      files: [{ pathTemplate: 'auth.json', contentTemplate: '{{secret.kind.CodexAuthJson}}', condition: '{{#if secret.openai}}' }]
    };
    expect(profileSecretNeeds(profile)).toEqual({ aliases: ['github', 'openai'], kinds: ['AnthropicApiKey', 'ClaudeCodeOAuthToken', 'CodexAuthJson'] });
    expect(profileSecretNeeds(null)).toEqual({ aliases: [], kinds: [] });
  });
});

describe('telemetry and analytics (M1-08, M1-24)', () => {
  it('adds a delegation phase before the first token', () => {
    const tel = runTelemetry({ queueMs: 10, executionMs: 12000, timeToFirstTokenMs: 11700, timeToFirstTokenExcludingDelegationMs: 4700, delegationWaitMs: 7000, streamingMs: 0 });
    expect(tel.delegationWaitMs).toBe(7000);
    const phases = Object.fromEntries(runPhases(tel).map((p) => [p.key, p.ms]));
    expect(phases).toMatchObject({ queue: 10, startup: 4700, delegation: 7000, tail: 300 });
  });
  it('switches the TTFT chart to the excluding-delegation metrics', () => {
    expect(chartsForTtftMode('excluding').find((c) => c.id === 'ttft').grouped).toBe('timeToFirstTokenExcludingDelegationMsAvg');
    expect(chartsForTtftMode('all').find((c) => c.id === 'ttft').grouped).toBe('timeToFirstTokenMsAvg');
    expect(parseAnalyticsParams(new URLSearchParams('ttft=excluding')).ttft).toBe('excluding');
    expect(analyticsSearch({ range: 'day', ttft: 'excluding', groupBy: 'none' }).toString()).toBe('ttft=excluding');
  });
  it('labels harness series with display names', () => {
    const name = (h) => ({ ClaudeCode: 'Claude Code', Codex: 'Codex' })[h] || h;
    expect(seriesDisplayLabel({ key: 'ClaudeCode', label: 'ClaudeCode' }, 'harness', name, 'Unknown model')).toBe('Claude Code');
    expect(seriesDisplayLabel({ key: 'Codex|unknown', label: 'Codex / unknown' }, 'harnessModel', name, 'Unknown model')).toBe('Codex / Unknown model');
    expect(seriesDisplayLabel({ key: 'unknown', label: 'unknown' }, 'model', name, 'Unknown model')).toBe('Unknown model');
  });
});

describe('server text, observability, and clone names', () => {
  it('translates known server messages and leaves others alone', () => {
    expect(translateServerText(t, 'Workspace prepared at /w/run_1.')).toBe('common.serverText.workspacePrepared{"path":"/w/run_1","interpolation":{"escapeValue":false}}');
    expect(translateServerText(t, 'Something new.')).toBe('Something new.');
    expect(stripCodePrefix('RunFinished: Run x already finished', 'RunFinished')).toBe('Run x already finished');
  });
  it('lists only configured services and never localhost', () => {
    expect(observabilityServices({ restUrl: 'http://127.0.0.1:8700' }, null)).toEqual([]);
    expect(observabilityServices({ observability: { grafanaUrl: 'http://localhost:3000' } }, { fields: [{ path: 'Telemetry.PrometheusUrl', value: 'https://prom.example.com' }] })).toEqual([
      { id: 'grafana', url: 'http://127.0.0.1:3000' },
      { id: 'prometheus', url: 'https://prom.example.com' }
    ]);
    expect(loopbackUrl('http://localhost')).toBe('http://127.0.0.1');
  });
  it('suggests a free name for a clone', () => {
    expect(suggestCloneName('builtin/default-system')).toBe('default-system-custom');
    expect(suggestCloneName('builtin/default-system', ['default-system-custom', 'default-system-custom-2'])).toBe('default-system-custom-3');
  });
});
