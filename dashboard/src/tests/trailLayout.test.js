// Activity trail layout (LP2.2) against the LP1.5 fixture: lane order (caller first, then agents by first
// appearance), rows in time order with shared rows and collapsed idle gaps, edges back to earlier rows and loops,
// right-to-left mirroring, keyboard order, graph layers, and the summary strip.
import { describe, it, expect } from 'vitest';
import fixture from './fixtures/runTrail.json';
import { CALLER_LANE, buildLanes, buildRows, filterTrailNodes, fitSequenceGeometry, graphFocusIds, graphLayers, pickHopRun, runHasHops, isSingleRunTrail, isTrailLive, layoutSequence, owningRunId, resultingRunId, stateTone, stepNeighbor, stepOrder, trailSummary } from '../utils/trailLayout';

const node = (id, lane, at, extra = {}) => ({ id, kind: 'Run', state: 'Succeeded', agentId: lane === 'caller' ? null : lane, agentName: lane, lane, startedUtc: at, endedUtc: null, ...extra });
const edge = (fromId, toId, kind, atUtc = null) => ({ fromId, toId, kind, atUtc });

describe('trail lanes', () => {
  it('puts the caller lane first, then agents by first appearance', () => {
    const lanes = buildLanes(fixture);
    expect(lanes.map((l) => l.id)).toEqual([CALLER_LANE, 'agt_lead', 'agt_triage', 'agt_logs', 'agt_metrics']);
    expect(lanes[1]).toMatchObject({ agentName: 'Incident lead', unitName: 'Site reliability' });
    expect(lanes[2].runKinds).toEqual(['Message']);
    expect(lanes[4].runKinds).toEqual(['Delegated', 'Retry']);
  });

  it('records Shadow and Eval run kinds on the lane so the header can mark them', () => {
    const trail = { nodes: [node('r1', 'agt_a', '2026-01-01T00:00:00Z', { runKind: 'Shadow' }), node('r2', 'agt_b', '2026-01-01T00:00:01Z', { runKind: 'Eval' })], edges: [] };
    expect(buildLanes(trail).map((l) => l.runKinds)).toEqual([['Shadow'], ['Eval']]);
  });
});

describe('trail rows', () => {
  it('orders rows by time and lets steps that start together in different lanes share a row', () => {
    const rows = buildRows(fixture);
    expect(rows[0].ids).toEqual(['usr_operator1']);
    const shared = rows.find((r) => r.ids.includes('run_c3'));
    expect(shared.ids).toEqual(['run_c3', 'run_c4']);
    expect(rows.flatMap((r) => r.ids)).toHaveLength(fixture.nodes.length);
  });

  it('collapses idle time longer than the threshold into a marked gap', () => {
    const trail = { nodes: [node('a', 'x', '2026-01-01T00:00:00Z'), node('b', 'x', '2026-01-01T00:00:30Z'), node('c', 'x', '2026-01-01T00:10:30Z')], edges: [] };
    const rows = buildRows(trail, 60000);
    expect(rows.map((r) => r.gapMs)).toEqual([0, 0, 600000]);
    const layout = layoutSequence(trail);
    expect(layout.gaps).toHaveLength(1);
    expect(layout.gaps[0].ms).toBe(600000);
    // The gap adds a fixed break, not ten minutes of height.
    const plain = layoutSequence({ ...trail, nodes: trail.nodes.map((n, i) => ({ ...n, startedUtc: `2026-01-01T00:00:0${i}Z` })) });
    expect(layout.height - plain.height).toBe(layout.geometry.gapHeight);
  });

  it('puts steps without a time after the timed ones in server order', () => {
    const trail = { nodes: [node('late', 'x', null), node('a', 'x', '2026-01-01T00:00:00Z')], edges: [] };
    expect(buildRows(trail).map((r) => r.ids[0])).toEqual(['a', 'late']);
  });
});

describe('trail sequence layout', () => {
  it('marks an answer back to an earlier row and bows edges within one lane', () => {
    const layout = layoutSequence(fixture);
    const answered = layout.edges.find((e) => e.kind === 'Answered');
    expect(answered.back).toBe(true);
    const performed = layout.edges.find((e) => e.kind === 'Performed');
    expect(performed.same).toBe(true);
    const woke = layout.edges.find((e) => e.fromId === 'msg_1');
    expect(woke).toMatchObject({ back: false, same: false });
    expect(layout.edges).toHaveLength(fixture.edges.length);
  });

  it('lays out a loop between two agents without hanging and keeps every record once', () => {
    const nodes = [node('r1', 'a', '2026-01-01T00:00:00Z'), node('m1', 'a', '2026-01-01T00:00:01Z', { kind: 'Message' }), node('r2', 'b', '2026-01-01T00:00:02Z'), node('m2', 'b', '2026-01-01T00:00:03Z', { kind: 'Message' })];
    const edges = [edge('r1', 'm1', 'Sent'), edge('m1', 'r2', 'Woke'), edge('r2', 'm2', 'Sent'), edge('m2', 'r1', 'Woke')];
    const trail = { originId: 'r1', nodes, edges };
    const layout = layoutSequence(trail);
    expect(layout.nodes).toHaveLength(4);
    expect(layout.edges.find((e) => e.fromId === 'm2').back).toBe(true);
    expect(graphLayers(trail).map((l) => l.layer)).toEqual([0, 1, 2, 3]);
  });

  it('mirrors the lanes right to left', () => {
    const ltr = layoutSequence(fixture);
    const rtl = layoutSequence(fixture, { rtl: true });
    expect(ltr.lanes[0].x).toBeLessThan(ltr.lanes[1].x);
    expect(rtl.lanes[0].x).toBeGreaterThan(rtl.lanes[1].x);
    for (let i = 0; i < ltr.lanes.length; i += 1) expect(rtl.lanes[i].x).toBe(ltr.width - ltr.lanes[i].x - ltr.geometry.laneWidth);
    expect(rtl.width).toBe(ltr.width);
  });

  it('fits the fixture inside the Run detail panel at 1366 wide with the sidebar open', () => {
    // 1366 minus the 244px sidebar and the page and panel padding leaves about 1050px.
    expect(layoutSequence(fixture).width).toBeLessThanOrEqual(1050);
  });
});

describe('trail keyboard order', () => {
  it('walks steps in time order and moves between lanes, mirrored right to left', () => {
    const layout = layoutSequence(fixture);
    const order = stepOrder(layout);
    expect(order[0]).toBe('usr_operator1');
    expect(order[order.length - 1]).toBe('rep_run_a1');
    expect(stepNeighbor(layout, 'usr_operator1', 'ArrowDown')).toBe('run_a1');
    expect(stepNeighbor(layout, 'run_a1', 'ArrowUp')).toBe('usr_operator1');
    expect(stepNeighbor(layout, 'run_b2', 'ArrowLeft')).toBe('msg_1');
    expect(stepNeighbor(layout, 'run_b2', 'ArrowRight')).toBe('run_c3');
    const rtl = layoutSequence(fixture, { rtl: true });
    expect(stepNeighbor(rtl, 'run_b2', 'ArrowLeft')).toBe('run_c3');
    expect(stepNeighbor(layout, 'run_a1', 'End')).toBe('rep_run_a1');
    expect(stepNeighbor(layout, 'usr_operator1', 'ArrowLeft')).toBe('usr_operator1');
  });
});

describe('trail graph layers', () => {
  it('places each step one layer after its cause, starting at the origin', () => {
    const layers = new Map(graphLayers(fixture).map((l) => [l.id, l.layer]));
    expect(layers.get('usr_operator1')).toBe(0);
    expect(layers.get('run_a1')).toBe(1);
    expect(layers.get('msg_1')).toBe(2);
    expect(layers.get('run_b2')).toBe(3);
    expect(layers.get('run_c5')).toBe(6);
    // The answer edge back to run_b2 does not move it.
    expect(layers.get('esc_1')).toBe(4);
  });
});

describe('trail summary and helpers', () => {
  it('sums agents, hops, duration, tokens, cost, and failures', () => {
    const s = trailSummary(fixture);
    expect(s.agents).toBe(4);
    expect(s.hops).toBe(2);
    expect(s.durationMs).toBe(250000);
    expect(s.inputTokens).toBe(5200 + 3100 + 1800 + 900 + 1000 + 2000);
    expect(s.outputTokens).toBe(1300 + 900 + 400 + 100 + 300 + 700);
    expect(s.costUsd).toBeCloseTo(0.093, 6);
    expect(s.failures).toBe(1);
  });

  it('tells live trails, single runs, owners, and woken runs apart', () => {
    expect(isTrailLive(fixture)).toBe(false);
    expect(isTrailLive({ nodes: [{ id: 'r', state: 'Running' }] })).toBe(true);
    expect(isSingleRunTrail(fixture)).toBe(false);
    expect(isSingleRunTrail({ nodes: [{ id: 'c', kind: 'Caller' }, { id: 'r', kind: 'Run' }, { id: 'p', kind: 'Reply' }] })).toBe(true);
    expect(owningRunId(fixture, 'eff_1')).toBe('run_a1');
    expect(owningRunId(fixture, 'rep_run_a1')).toBe('run_a1');
    expect(resultingRunId(fixture, 'msg_1')).toBe('run_b2');
    expect(stateTone('Failed')).toBe('danger');
    expect(stateTone('Delivered')).toBe('success');
    expect(stateTone('Cancelled')).toBe('neutral');
    expect(stateTone(null)).toBe('none');
    expect(filterTrailNodes(fixture.nodes, { kind: 'Message' }).map((n) => n.id)).toEqual(['msg_1', 'msg_2']);
    expect(filterTrailNodes(fixture.nodes, { agent: 'agt_metrics', state: 'Failed' }).map((n) => n.id)).toEqual(['run_c4']);
  });
});

// LP5.5 (UX pass 1): lanes sized to the canvas, bundled edges spread out, the graph's opening nodes, and hop runs.
describe('LP5.5 layout fixes', () => {
  it('shares the visible width between lanes within the limits (UXP1-V011)', () => {
    expect(fitSequenceGeometry(2, 1040)).toEqual({ laneWidth: 320, nodeWidth: 288 });
    expect(fitSequenceGeometry(5, 1040).laneWidth).toBe(Math.floor((1040 - 24 - 72) / 5));
    expect(fitSequenceGeometry(12, 1040)).toEqual({ laneWidth: 176, nodeWidth: 144 });
    expect(fitSequenceGeometry(3, 0)).toEqual({});
  });

  it('bows each further edge within one lane a step further out (UXP1-V011)', () => {
    const trail = {
      nodes: [
        { id: 'a', kind: 'Run', agentId: 'x', startedUtc: '2026-01-01T00:00:00Z' },
        { id: 'b', kind: 'Effect', agentId: 'x', startedUtc: '2026-01-01T00:00:01Z' },
        { id: 'c', kind: 'Effect', agentId: 'x', startedUtc: '2026-01-01T00:00:02Z' }
      ],
      edges: [
        { fromId: 'a', toId: 'b', kind: 'Performed' },
        { fromId: 'a', toId: 'c', kind: 'Performed' }
      ]
    };
    const layout = layoutSequence(trail);
    const [first, second] = layout.edges;
    expect(second.labelX).toBeGreaterThan(first.labelX);
    expect(layout.width).toBeGreaterThan(layout.lanes[0].x + layout.geometry.laneWidth + 40);
  });

  it('opens the graph on the focus run and its neighbours (UXP1-V001)', () => {
    const ids = graphFocusIds(fixture);
    expect(ids).toContain(fixture.focusRunId);
    expect(ids.length).toBeLessThanOrEqual(fixture.nodes.length);
    const chain = { originId: 'n0', nodes: Array.from({ length: 200 }, (_, i) => ({ id: `n${i}`, kind: 'Run', startedUtc: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString() })), edges: Array.from({ length: 199 }, (_, i) => ({ fromId: `n${i}`, toId: `n${i + 1}`, kind: 'Started' })) };
    expect(graphFocusIds(chain)).toEqual(['n0', 'n1', 'n2', 'n3']);
  });

  it('tells a hop of a longer request from a run that started on its own (UXP1-S001, S010)', () => {
    expect(runHasHops({ kind: 'Message' })).toBe(true);
    expect(runHasHops({ kind: 'Invoke', parentRunId: 'run_p' })).toBe(true);
    expect(runHasHops({ kind: 'Invoke', fanOutGroupId: 'fog_1' })).toBe(true);
    expect(runHasHops({ kind: 'Keeper', depth: 0 })).toBe(false);
    expect(pickHopRun([{ id: 'r1', kind: 'Keeper' }, { id: 'r2', kind: 'Message' }, { id: 'r3', kind: 'Delegated' }])?.id).toBe('r2');
    expect(pickHopRun([{ id: 'r1', kind: 'Keeper' }])).toBeNull();
  });
});
