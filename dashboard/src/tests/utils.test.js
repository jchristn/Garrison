import { describe, it, expect } from 'vitest';
import { normalizeBuckets } from '../utils/chart';
import { REQUEST_RANGES, requestRangeToParams, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, defaultServerUrl } from '../utils/constants';
import { extractVariables } from '../utils/templates';
import { diffLines } from '../utils/diff';
import { buildListParams, sortLocal, toUtcIso, stripForDuplicate } from '../utils/query';
import { parseSseFrame, normalizeEnumeration, ApiError } from '../utils/api';
import { flattenOpenApiSpec, resolvePath, buildUrl, isDestructive } from '../utils/openApi';
import { allowed, roleKey } from '../utils/principal';
import { pageBySlug, pathFor, PAGES, HUBS, LEGACY_REDIRECTS, hubForPath } from '../config/navConfig';
import { toStatusMap, overviewKpis } from '../utils/overview';

describe('normalizeBuckets', () => {
  const now = new Date('2026-10-09T12:34:56Z');
  it.each([
    ['hour', 60],
    ['day', 96],
    ['week', 84],
    ['month', 120]
  ])('returns exactly the bucket count for %s', (range, count) => {
    expect(REQUEST_RANGES[range].bucketCount).toBe(count);
    const out = normalizeBuckets([], range, now);
    expect(out).toHaveLength(count);
    expect(out.every((b) => b.successCount === 0 && b.failureCount === 0)).toBe(true);
  });

  it('places server buckets on the grid and drops out-of-range ones', () => {
    const grid = normalizeBuckets([], 'hour', now);
    const target = grid[10].bucketStartUtc;
    const out = normalizeBuckets(
      [
        { bucketStartUtc: target, successCount: 3, failureCount: 1 },
        { bucketStartUtc: '2000-01-01T00:00:00Z', successCount: 99 }
      ],
      'hour',
      now
    );
    expect(out).toHaveLength(60);
    expect(out[10].successCount).toBe(3);
    expect(out[10].failureCount).toBe(1);
    expect(out.reduce((s, b) => s + b.successCount, 0)).toBe(3);
  });

  it('builds query parameters for a range', () => {
    const p = requestRangeToParams('day', now);
    expect(p).toBeTruthy();
    expect(JSON.stringify(p)).toContain('2026');
  });
});

describe('constants', () => {
  it('uses the required page sizes with a default of 25', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([10, 25, 50, 100, 250, 500, 1000]);
    expect(DEFAULT_PAGE_SIZE).toBe(25);
  });
  it('prefers window.GARRISON_CONFIG.apiUrl for the default server URL', () => {
    window.GARRISON_CONFIG = { apiUrl: 'http://127.0.0.1:9999/' };
    expect(defaultServerUrl()).toContain('127.0.0.1:9999');
    window.GARRISON_CONFIG = { apiUrl: '' };
    expect(defaultServerUrl()).toMatch(/^http/);
  });
});

describe('extractVariables', () => {
  it('finds plain, filtered, and block variables', () => {
    const vars = extractVariables('Hi {{user.name}} {{x | default: "y"}} {{#if task}}{{task}}{{else}}none{{/if}} {{#each items}}{{this.a}}{{/each}} {{> footer}}');
    expect(vars).toEqual(['items', 'task', 'user.name', 'x']);
  });
  it('ignores raw blocks', () => {
    expect(extractVariables('{{{{raw}}}}{{notAVar}}{{{{/raw}}}}{{real}}')).toEqual(['real']);
  });
});

describe('diffLines', () => {
  it('marks added, removed, and unchanged lines', () => {
    const d = diffLines('a\nb\nc', 'a\nc\nd');
    expect(d).toEqual([
      { type: 'same', text: 'a' },
      { type: 'del', text: 'b' },
      { type: 'same', text: 'c' },
      { type: 'add', text: 'd' }
    ]);
  });
});

describe('query helpers', () => {
  it('maps server-sortable keys to ordering and drops empty filters', () => {
    expect(buildListParams({ pageNumber: 2, pageSize: 50, sortKey: 'name', sortDir: 'desc', search: 'x', filters: { a: '', b: 'v' } })).toEqual({
      pageNumber: 2,
      pageSize: 50,
      ordering: 'NameDescending',
      search: 'x',
      b: 'v'
    });
    expect(buildListParams({ sortKey: 'createdUtc', sortDir: 'asc' }).ordering).toBe('CreatedAscending');
  });
  it('sorts locally with nulls last', () => {
    const out = sortLocal([{ v: 2 }, { v: null }, { v: 1 }], 'v', 'asc');
    expect(out.map((x) => x.v)).toEqual([1, 2, null]);
  });
  it('converts local input to UTC ISO', () => {
    expect(toUtcIso('')).toBeUndefined();
    expect(toUtcIso('2026-01-01T00:00')).toMatch(/Z$/);
  });
  it('strips server fields for duplication', () => {
    const out = stripForDuplicate({ id: 'x', name: 'n', createdUtc: 'c', tenantId: 't', isBuiltIn: true, items: [{ id: 'c1', templateId: 'k', fooId: 'z' }] });
    expect(out).toEqual({ name: 'n-copy', items: [{ templateId: 'k' }] });
  });
});

describe('api helpers', () => {
  it('normalizes an EnumerationResult', () => {
    const n = normalizeEnumeration({ objects: [1, 2], totalRecords: 30, skip: 25, maxResults: 25 }, 2, 25);
    expect(n).toMatchObject({ items: [1, 2], pageNumber: 2, pageSize: 25, totalCount: 30 });
    expect(normalizeEnumeration([1, 2, 3]).totalCount).toBe(3);
  });
  it('parses SSE frames', () => {
    expect(parseSseFrame('event: run\ndata: {"a":1}')).toEqual({ a: 1 });
    expect(parseSseFrame('data: hello\ndata: world')).toBe('hello\nworld');
    expect(parseSseFrame(': keepalive')).toBeNull();
  });
  it('exposes error details on ApiError', () => {
    const e = new ApiError(403, { code: 'AuthorizationDenied', message: 'no', requestId: 'r1', requiredPermission: 'Read' });
    expect(e.status).toBe(403);
    expect(e.code).toBe('AuthorizationDenied');
    expect(e.requestId).toBe('r1');
  });
});

describe('openApi helpers', () => {
  const spec = {
    paths: {
      '/v1.0/api/tenants/{tenantId}/agents': {
        get: { tags: ['Agents'], summary: 'List agents', parameters: [{ name: 'tenantId', in: 'path', required: true }] },
        delete: { tags: ['Agents'], summary: 'Delete' }
      }
    }
  };
  it('flattens operations', () => {
    const ops = flattenOpenApiSpec(spec);
    expect(ops.length).toBe(2);
    expect(ops.map((o) => o.method).sort()).toEqual(['DELETE', 'GET']);
    expect(isDestructive(ops.find((o) => o.method === 'DELETE'))).toBe(true);
  });
  it('resolves paths and builds URLs', () => {
    expect(resolvePath('/t/{tenantId}/a', { tenantId: 'ten 1' })).toBe('/t/ten%201/a');
    expect(buildUrl('http://h/', '/p', { a: 1, b: '' })).toBe('http://h/p?a=1');
  });
});

describe('principal and routes', () => {
  it('gates admin routes', () => {
    const admin = { isAdmin: true };
    const user = { isAdmin: false, isTenantAdmin: false };
    expect(roleKey(admin)).toBe('roles.systemAdmin');
    expect(allowed(undefined, user)).toBe(true);
    const tenants = pageBySlug('tenants');
    expect(tenants).toBeTruthy();
    expect(allowed(tenants.requires, admin)).toBe(true);
    expect(allowed(tenants.requires, user)).toBe(false);
    expect(allowed('admin', { isTenantAdmin: true })).toBe(true);
    expect(roleKey({ principalType: 'Credential' })).toBe('roles.credential');
  });
  it('builds paths for every page', () => {
    for (const p of PAGES) expect(pathFor(p.id)).toMatch(/^\/dashboard\/[a-z-]+(\?tab=[a-z-]+)?$/);
    expect(pathFor('home')).toBe('/dashboard/home');
    expect(pathFor('runs')).toBe('/dashboard/runs');
    expect(pathFor('queue')).toBe('/dashboard/runs?tab=queue');
    expect(pathFor('mcpServers')).toBe('/dashboard/configuration?tab=mcp-servers');
    expect(pathFor('runs', 'run_1')).toBe('/dashboard/runs/run_1');
    expect(pathFor('promptTemplates', 'new')).toBe('/dashboard/prompt-templates/new');
    expect(pathFor('runs', null, { status: 'Failed' })).toBe('/dashboard/runs?status=Failed');
    expect(pathFor('requests', null, { fromUtc: 'a b' })).toBe('/dashboard/monitoring?fromUtc=a+b');
    expect(pathFor('audit')).toBe('/dashboard/monitoring?tab=audit');
  });
  it('keeps the sidebar small and redirects every pre-hub route', () => {
    expect(HUBS.length).toBeGreaterThanOrEqual(7);
    expect(HUBS.length).toBeLessThanOrEqual(10);
    const hubSlugs = new Set(HUBS.map((h) => h.slug));
    for (const p of PAGES) {
      const covered = hubSlugs.has(p.slug) || LEGACY_REDIRECTS.some((r) => r.from === p.slug);
      expect(covered, p.slug).toBe(true);
    }
    for (const r of LEGACY_REDIRECTS) expect(hubSlugs.has(r.from), r.from).toBe(false);
    expect(hubForPath('/dashboard/prompt-templates/pt_1').key).toBe('configuration');
    expect(hubForPath('/dashboard/runs/run_1').key).toBe('runs');
    expect(hubForPath('/dashboard/nowhere')).toBeNull();
  });
});

describe('overview normalization', () => {
  it('accepts the server array shape and the fallback map shape', () => {
    expect(toStatusMap([{ status: 'Ready', count: 2 }, { status: 'Lost', count: 1 }])).toEqual({ Ready: 2, Lost: 1 });
    expect(toStatusMap({ Ready: 2 })).toEqual({ Ready: 2 });
    expect(toStatusMap(null)).toBeNull();
  });
  it('computes finite KPI values from the server response', () => {
    const k = overviewKpis({
      agents: 4,
      deployments: 4,
      runsLast24Hours: 15,
      runsByStatus: [{ status: 'Succeeded', count: 15 }],
      nodesByStatus: [{ status: 'Ready', count: 2 }],
      queued: 0,
      active: 0
    });
    expect(k).toEqual({ agents: 4, deployments: 4, active: 0, queued: 0, succeeded: 15, failed: 0, nodesReady: 2, nodesTotal: 2, nodesLost: 0 });
    for (const v of Object.values(k)) expect(Number.isFinite(v)).toBe(true);
  });
  it('reports unknown values as null rather than NaN', () => {
    const k = overviewKpis({});
    expect(k.nodesTotal).toBeNull();
    expect(k.agents).toBeNull();
    expect(overviewKpis({ nodesByStatus: [] }).nodesTotal).toBe(0);
  });
});
