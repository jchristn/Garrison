// LP5.5 (UX pass 1) fixes on the run pages that need no DOM: the Follow a request tour picks a request that crossed
// agents (UXP1-S010), and the Result tab finds the JSON in a run result (UXP1-V037).
import { describe, it, expect, vi } from 'vitest';
import { findTour } from '../config/tours';
import { HOP_RUN_SCAN, resolveTourRecords, tenantHas } from '../utils/tours';
import { resultSegments } from '../utils/runResult';

describe('Follow a request picks a multi-agent request (UXP1-S010)', () => {
  const tour = findTour('follow-a-request');
  const runs = [
    { id: 'run_tick', kind: 'Keeper' },
    { id: 'run_hop', kind: 'Message' },
    { id: 'run_old', kind: 'Invoke' }
  ];

  it('offers the site reliability example, whose keepers message each other', () => {
    expect(tour.sample).toEqual({ needs: 'trails', example: 'siteReliability' });
  });

  it('opens the newest run that is a hop of a longer request', async () => {
    const apiClient = { listRuns: vi.fn(async () => ({ items: runs })) };
    const records = await resolveTourRecords(apiClient, 'default', tour);
    expect(apiClient.listRuns).toHaveBeenCalledWith('default', { pageNumber: 1, pageSize: HOP_RUN_SCAN });
    expect(records.run).toBe('run_hop');
  });

  it('falls back to the newest run when no run is a hop', async () => {
    const apiClient = { listRuns: vi.fn(async () => ({ items: [runs[0], runs[2]] })) };
    expect((await resolveTourRecords(apiClient, 'default', tour)).run).toBe('run_tick');
  });

  it('keeps the newest run for other tours', async () => {
    const apiClient = { listRuns: vi.fn(async () => ({ items: runs })) };
    const records = await resolveTourRecords(apiClient, 'default', findTour('run-an-agent'));
    expect(apiClient.listRuns).toHaveBeenCalledWith('default', { pageNumber: 1, pageSize: 1 });
    expect(records.run).toBe('run_tick');
  });

  it('counts a tenant with only single-agent runs as having no trail to follow', async () => {
    expect(await tenantHas({ listRuns: async () => ({ items: [runs[0]] }) }, 'default', 'trails')).toBe(false);
    expect(await tenantHas({ listRuns: async () => ({ items: runs }) }, 'default', 'trails')).toBe(true);
    expect(await tenantHas({ listRuns: async () => { throw new Error('down'); } }, 'default', 'trails')).toBe(true);
  });
});

describe('run result JSON (UXP1-V037)', () => {
  it('pretty-prints a result that is JSON', () => {
    const segments = resultSegments('{"status":"ok","items":[1,2,3],"note":"done"}');
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('json');
    expect(segments[0].value.items).toEqual([1, 2, 3]);
  });

  it('splits prose from a JSON tool result on its own line', () => {
    const text = 'Echo: Research the outage.\nTool result: {"fanOutGroupId":"fog_1","status":"Running","members":[]}\nDone.';
    const segments = resultSegments(text);
    expect(segments.map((s) => s.type)).toEqual(['text', 'json', 'text']);
    expect(segments[0].text).toBe('Echo: Research the outage.\nTool result:');
    expect(segments[1].value.status).toBe('Running');
    expect(segments[2].text).toBe('Done.');
  });

  it('leaves prose and short or broken JSON to the Markdown view', () => {
    expect(resultSegments('A plain answer with {braces} in it.')).toBeNull();
    expect(resultSegments('Result: {"a":1}')).toBeNull();
    expect(resultSegments('Result: {"unterminated": "value that goes on and on')).toBeNull();
    expect(resultSegments('')).toBeNull();
    expect(resultSegments(null)).toBeNull();
  });
});
