// Tooltip coverage for everything generated from configuration (D-030): every column, field, sub-field,
// section, step, row action, filter, add button, navigation item, and explainer has real English text that
// explains more than its label. The Playwright test in tests/e2e/tooltips.spec.js covers the rendered pages.

import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../i18n';
import * as resourceConfigs from '../views/resourceConfigs';
import * as runConfigs from '../views/runConfigs';
import { HUBS, PAGES } from '../config/navConfig';
import { ENUMS } from '../utils/constants';
import { resourceTip, enumTip } from '../utils/tips';
import { ANALYTICS_CHARTS, METRIC_KEYS } from '../utils/analytics';

const MIN = 25;
const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function check(problems, where, tipText, label) {
  if (!tipText) problems.push(`${where}: missing`);
  else if (tipText.length < MIN) problems.push(`${where}: too short (${tipText})`);
  else if (label && norm(tipText) === norm(label)) problems.push(`${where}: restates its label`);
  else if (/\{\{|tips\./.test(tipText) && !/\{\{(secret|input|deployment|run|agent)\./.test(tipText) && !/\{\{>/.test(tipText) && !/\{\{variables\}\}/.test(tipText)) problems.push(`${where}: unresolved key or placeholder (${tipText})`);
}

const configs = [...Object.values(resourceConfigs), ...Object.values(runConfigs)].filter((c) => c && typeof c === 'object' && c.id);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('tooltip coverage for configured pages', () => {
  const t = (...args) => i18n.t(...args);
  const ctx = { t, i18n, apiClient: {}, tenantId: 'default', navigate: () => {}, addToast: () => {}, reload: () => {}, setExtraModal: () => {}, setJsonValue: () => {} };

  it('gives every column, field, sub-field, and section a useful tooltip', () => {
    const problems = [];
    for (const config of configs) {
      for (const col of config.columns(ctx)) check(problems, `${config.id} column ${col.key}`, col.tip, col.label);
      const blank = config.blank ? config.blank() : {};
      for (const mode of ['create', 'edit', 'view']) {
        for (const f of config.fields(blank, { ...ctx, mode, options: {} })) {
          check(problems, `${config.id} field ${f.name}`, f.tip, f.label);
          for (const sub of f.fields || []) check(problems, `${config.id} field ${f.name}.${sub.name}`, sub.tip, sub.label);
        }
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('gives every step, row action, filter, add button, and explainer real text', () => {
    const problems = [];
    for (const config of configs) {
      for (const s of config.steps || []) check(problems, `${config.id} step ${s}`, t(`tips.resources.${config.id}.steps.${s}`), t(`resources.${config.id}.steps.${s}`));
      if (config.api.create) check(problems, `${config.id} add`, t(`tips.resources.${config.id}.add`, { defaultValue: '' }), t(`resources.${config.id}.add`));
      if (config.rowActions) {
        for (const status of ['Running', 'Succeeded', 'Ready', 'Cordoned']) {
          for (const a of config.rowActions({ id: 'x', name: 'x', status, isBuiltIn: true }, ctx)) check(problems, `${config.id} action ${a.label}`, a.tip, a.label);
        }
      }
      for (const f of config.filters || []) check(problems, `${config.id} filter ${f.name}`, t(`tips.filters.${f.name}`), f.label(t));
      if (config.explainer) {
        check(problems, `${config.id} explainer title`, `${t(`explainers.${config.explainer}.title`)} ${'.'.repeat(MIN)}`, '');
        check(problems, `${config.id} explainer body`, t(`explainers.${config.explainer}.p1`), '');
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('gives every hub and tab a navigation tooltip longer than its label', () => {
    const problems = [];
    for (const hub of HUBS) check(problems, `hub ${hub.key}`, t(`tips.nav.hubs.${hub.key}`), t(`nav.hubs.${hub.key}.label`));
    for (const page of PAGES.filter((p) => p.tab)) check(problems, `tab ${page.id}`, t(`tips.nav.tabs.${page.id}`), t(`nav.items.${page.id}.label`));
    expect(problems).toEqual([]);
  });

  it('explains every status badge value', () => {
    const problems = [];
    for (const group of ['runStatus', 'runOutcome', 'nodeStatus', 'harnessType', 'agentKind', 'secretKind', 'workspaceKind', 'promptTemplateKind', 'mcpTransport', 'permissionType', 'artifactStoreKind', 'auditEventType']) {
      for (const value of ENUMS[group]) check(problems, `enum ${group}.${value}`, enumTip(t, group, value), t(`enums.${group}.${value}`, { defaultValue: value }));
    }
    expect(problems).toEqual([]);
  });

  it('explains every analytics chart, metric, and run telemetry field', () => {
    const problems = [];
    for (const c of ANALYTICS_CHARTS) check(problems, `chart ${c.id}`, t(`tips.analytics.charts.${c.id}`), t(`views.analytics.charts.${c.id}.title`));
    for (const m of [...METRIC_KEYS, 'totalTokens']) check(problems, `metric ${m}`, t(`tips.analytics.metrics.${m}`), t(`views.analytics.metrics.${m}`));
    for (const f of Object.keys(i18n.getResource('en', 'translation', 'views.runDetail.telemetry.fields'))) check(problems, `telemetry ${f}`, t(`tips.telemetry.${f}`), t(`views.runDetail.telemetry.fields.${f}`));
    expect(problems).toEqual([]);
  });

  it('falls back to shared field tips and returns empty text for unknown keys', () => {
    expect(resourceTip(t, 'tenants', 'createdUtc')).toBe(t('tips.common.fields.createdUtc'));
    expect(resourceTip(t, 'tenants', 'noSuchField')).toBe('');
    expect(enumTip(t, 'runStatus', 'NoSuchStatus')).toBe('');
  });

  it('keeps template syntax in tooltip text instead of interpolating it away', () => {
    expect(t('tips.resources.secrets.add')).toContain('alias');
    expect(t('tips.resources.deployments.resourceBindingsItems.alias')).toContain('{{secret.anthropic}}');
  });
});
