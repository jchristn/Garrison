// G-16: enum values are shown as translated labels, never as raw wire values, while forms still submit the wire value.
//
// The checks run in the zz pseudo-locale, where every catalog string is wrapped in ⟦ ⟧, so any enum value that
// reaches the screen without going through enums.<group>.<value> shows up as bare text. They cover every column of
// every record page (rendered against the e2e mock rows, which tests/contract keeps faithful to the server) and every
// select and multiselect option of every create, edit, and view form, including list-editor sub-fields.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { en, TRANSLATIONS } from '../i18n/resources';
import * as resourceConfigs from '../views/resourceConfigs';
import * as runConfigs from '../views/runConfigs';
import { ENUMS } from '../utils/constants';
import { respond } from '../../tests/e2e/mocks.js';

const configs = [...Object.values(resourceConfigs), ...Object.values(runConfigs)].filter((c) => c && typeof c === 'object' && c.id);

/** Collection each record page lists, as served by the mocks. */
const COLLECTIONS = {
  tenants: '/v1.0/api/tenants',
  nodes: '/v1.0/api/nodes',
  controlNodes: '/v1.0/api/control-nodes',
  nodePools: '/v1.0/api/node-pools',
  users: 'users',
  credentials: 'credentials',
  roles: 'roles',
  permissions: 'permissions',
  userAssignments: 'user-role-assignments',
  credentialAssignments: 'credential-scope-assignments',
  harnessProfiles: 'harness-profiles',
  promptTemplates: 'prompt-templates',
  mcpServers: 'mcp-servers',
  secrets: 'secrets',
  workspaces: 'workspace-templates',
  artifactStores: 'artifact-stores',
  agents: 'agents',
  deployments: 'deployments',
  runs: 'runs',
  audit: 'audit'
};

function rows(id) {
  const path = COLLECTIONS[id];
  if (!path) return [];
  const url = new URL(`http://127.0.0.1${path.startsWith('/') ? path : `/v1.0/api/tenants/default/${path}`}?maxResults=25&skip=0&pageSize=25`);
  const body = respond('GET', url);
  return body?.objects || [];
}

/** Values whose label is the value itself in every locale (A2A, S3, Stdout): showing them bare is not a bug. */
function invariant(group, value) {
  return [en, ...Object.values(TRANSLATIONS)].every((c) => c.enums?.[group]?.[value] === value);
}

const RAW = new Map();
for (const [group, values] of Object.entries(ENUMS)) for (const v of values) if (!invariant(group, v)) RAW.set(v, group);

/** Visible text fragments of rendered markup, split on the separators list cells use. */
function fragments(markup) {
  const text = markup.replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
  return text
    .split(/\n|, | \/ /)
    .map((s) => s.replace(/^[\s⚠]+|\s+$/g, ''))
    .filter(Boolean);
}

function walkFields(fields, visit, prefix = '') {
  for (const f of fields || []) {
    visit(f, `${prefix}${f.name}`);
    if (f.fields) walkFields(f.fields, visit, `${prefix}${f.name}.`);
  }
}

beforeAll(async () => {
  await i18n.changeLanguage('zz');
});

afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('enum values render as translated labels (G-16)', () => {
  const t = (...args) => i18n.t(...args);
  const ctx = { t, i18n, apiClient: {}, tenantId: 'default', principal: { isAdmin: true }, navigate: () => {}, addToast: () => {}, reload: () => {}, setExtraModal: () => {}, setJsonValue: () => {} };

  it('mock rows exercise every record page with enum columns', () => {
    for (const id of Object.keys(COLLECTIONS)) expect(rows(id).length, id).toBeGreaterThan(0);
  });

  it('shows no raw enum value in any table cell', () => {
    const problems = [];
    for (const config of configs) {
      const data = rows(config.id);
      for (const col of config.columns(ctx)) {
        for (const row of data) {
          const out = col.render(row);
          if (out === null || out === undefined) continue;
          const markup = renderToStaticMarkup(<MemoryRouter>{typeof out === 'object' ? out : <>{String(out)}</>}</MemoryRouter>);
          for (const frag of fragments(markup)) if (RAW.has(frag)) problems.push(`${config.id}.${col.key}: "${frag}" (enums.${RAW.get(frag)})`);
        }
      }
    }
    expect([...new Set(problems)]).toEqual([]);
  });

  it('labels every enum option in every form while submitting the wire value', () => {
    const problems = [];
    let checked = 0;
    for (const config of configs) {
      if (!config.fields) continue;
      const blank = config.blank ? config.blank() : {};
      for (const mode of ['create', 'edit', 'view']) {
        walkFields(config.fields(blank, { ...ctx, mode, options: {} }), (f, name) => {
          if (f.type !== 'select' && f.type !== 'multiselect') return;
          // Row-dependent options (object list items) are resolved for an empty row and for each role or kind.
          const opts = typeof f.options === 'function' ? [...f.options({}), ...f.options({ role: 'System', kind: 'McpServer' })] : f.options || [];
          for (const o of opts) {
            const value = typeof o === 'object' ? o.value : o;
            if (!RAW.has(value)) continue;
            checked += 1;
            const label = typeof o === 'object' ? o.label : f.optionLabel ? f.optionLabel(o) : o;
            if (label === value || !String(label).startsWith('⟦')) problems.push(`${config.id} ${mode} ${name}: option ${value} shows "${label}"`);
          }
        });
      }
    }
    expect(checked).toBeGreaterThan(50);
    expect([...new Set(problems)]).toEqual([]);
  });

  it('labels the agent Delegation dropdown and the deployment binding Kind (the original G-16 report)', () => {
    const agentField = resourceConfigs.agentsConfig.fields(resourceConfigs.agentsConfig.blank(), { ...ctx, mode: 'create', options: {} }).find((f) => f.name === 'delegationMode');
    expect(agentField.options.map((o) => o.value)).toEqual(ENUMS.delegationMode);
    expect(agentField.options.every((o) => o.label.startsWith('⟦'))).toBe(true);
    const bindings = resourceConfigs.deploymentsConfig.fields(resourceConfigs.deploymentsConfig.blank(), { ...ctx, mode: 'create', options: {} }).find((f) => f.name === 'resourceBindings');
    const kind = bindings.fields.find((f) => f.name === 'kind');
    expect(kind.options.map((o) => o.value)).toEqual(ENUMS.resourceBindingKind);
    expect(kind.options.every((o) => o.label.startsWith('⟦'))).toBe(true);
  });
});
