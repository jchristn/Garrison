// Column budget for list tables: with its default columns, no table may scroll sideways on a 1366 x 768 screen with the
// sidebar expanded, in English. The Columns button in the pagination bar turns the rest on.
//
// The budget comes from measuring every list page and hub tab in a browser against a seeded server
// (tests/audit/tableWidths.mjs). At 1366 pixels the table area is 1072 pixels wide. Before this budget, six tables
// scrolled: runs (13 columns counting Actions, 1429 px), deployments (13, 1397 px), usage quotas (11, 1416 px, 132
// header characters), memory (11, 1133 px), control plane (10, 1125 px), and apps (9, 1085 px). After trimming the
// defaults (and letting headers wrap between words, see .data-table th in index.css), every list table has 6 to 10
// default columns and the narrowest width the widest one can take is 954 px (workspaces), so all of them also fit at
// 1280 pixels (986 px) and in German at 1366.
//
// Width depends on the data too, so these limits are a guard against config drift, not a proof; the browser audit is.
//   - MAX_COLUMNS: 9 default-visible columns, counting the Actions column every ResourceView table adds. Ten fit only
//     where the columns are short and measured, listed in MEASURED_AT_TEN; the control plane table overflowed at ten.
//   - MAX_HEADER_CHARS: 100 characters of English header text across those columns. Header text sets the floor of
//     each column's width while the table has room. The widest table that fit had 96 (model prices), the
//     overflowing ones 111 (deployments) and 132 (usage quotas).
// A table over a limit needs a column marked `defaultHidden: true`, or a fresh browser measurement before a limit or
// the list below changes.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import i18n from '../i18n';
import * as resourceConfigs from '../views/resourceConfigs';
import * as runConfigs from '../views/runConfigs';

const MAX_COLUMNS = 9;
// Tables measured to fit with ten default columns: the narrowest width each can take at 1366 pixels, English.
const MEASURED_AT_TEN = {
  approvals: 882,
  shadowTrials: 913
};
const MAX_HEADER_CHARS = 100;
const ACTIONS_LABEL = 'Actions';

function tableConfigs() {
  const seen = new Set();
  const list = [];
  for (const config of [...Object.values(resourceConfigs), ...Object.values(runConfigs)]) {
    if (!config || typeof config !== 'object' || !config.id || typeof config.columns !== 'function' || seen.has(config.id)) continue;
    seen.add(config.id);
    list.push(config);
  }
  return list;
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('default table columns fit a 1366 pixel screen', () => {
  const t = (...args) => i18n.t(...args);
  const ctx = { t, i18n, apiClient: {}, tenantId: 'default', principal: { isAdmin: true }, lookups: {}, navigate: () => {}, addToast: () => {}, reload: () => {}, setExtraModal: () => {}, setJsonValue: () => {} };
  const configs = tableConfigs();

  function visible(config) {
    return config.columns(ctx).filter((col) => col.pinned || !col.defaultHidden);
  }

  it('finds the list tables', () => {
    expect(configs.length).toBeGreaterThan(40);
    for (const id of ['runs', 'deployments', 'memory', 'usageQuotas', 'controlNodes', 'apps', 'shadowTrials']) expect(configs.map((c) => c.id)).toContain(id);
  });

  it(`shows at most ${MAX_COLUMNS} columns by default, counting Actions, or ten where measured`, () => {
    const over = configs
      .map((config) => ({ id: config.id, count: visible(config).length + 1 }))
      .filter((row) => row.count > (MEASURED_AT_TEN[row.id] ? 10 : MAX_COLUMNS))
      .map((row) => `${row.id}: ${row.count}`);
    expect(over).toEqual([]);
  });

  it(`keeps the default headers within ${MAX_HEADER_CHARS} characters`, () => {
    const over = configs
      .map((config) => ({ id: config.id, chars: visible(config).reduce((n, col) => n + String(col.label || '').length, ACTIONS_LABEL.length) }))
      .filter((row) => row.chars > MAX_HEADER_CHARS)
      .map((row) => `${row.id}: ${row.chars}`);
    expect(over).toEqual([]);
  });

  it('keeps at least one pinned column so a row can always be identified', () => {
    const missing = configs.filter((config) => !config.columns(ctx).some((col) => col.pinned)).map((config) => config.id);
    expect(missing).toEqual([]);
  });
});
