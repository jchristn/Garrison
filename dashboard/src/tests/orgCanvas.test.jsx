// Organizations on the studio canvas (AA7.10): the graph to nested units mapping, the nested layout, unit and peer
// line words for screen readers, unit operation bodies, the organization choices, and the side panel (members, peer
// lines, and unit actions).
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import OrgUnitPanel from '../components/studio/canvas/OrgUnitPanel';
import { operationBody } from '../utils/studioCanvas';
import { COLLAPSE_ABOVE_UNITS, ORG_LAYOUT, absoluteX, ancestorsOf, defaultCollapsed, descendantCount, shownMembers, UNIT_OPERATIONS, canvasOrganizations, defaultOrganization, layoutOrg, orgSummary, orgToFlow, parsePeerId, peerId, unitAgentChoices, unitHeaderHeight, unitLabel } from '../utils/orgCanvas';
import { graphOf, orgCanvasState } from '../../tests/e2e/canvasMocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  mounted.push({ root, container });
  return container;
}

const graph = () => graphOf(orgCanvasState());

describe('organization graph', () => {
  it('lists organizations and opens on the remembered one', () => {
    expect(canvasOrganizations(graph())).toEqual(['research-org']);
    expect(defaultOrganization(graph(), 'gone')).toBe('research-org');
    expect(canvasOrganizations({ nodes: [], edges: [{ kind: 'Peer', organization: 'x', from: 'a', to: 'b' }] })).toEqual(['x']);
    expect(defaultOrganization({ nodes: [] }, null)).toBe('');
  });

  it('turns OrgUnit nodes into a tree with leads, members, and unique peer lines', () => {
    const g = graph();
    g.edges.push({ kind: 'Peer', organization: 'research-org', from: 'Publishing', to: 'Research' });
    const flow = orgToFlow(g, 'research-org');
    expect(flow.units.map((u) => `${u.name}:${u.depth}:${u.parent || '-'}`)).toEqual(['Leadership:0:-', 'Publishing:1:Leadership', 'Research:1:Leadership']);
    expect(flow.roots).toEqual(['Leadership']);
    expect(flow.units[0]).toMatchObject({ lead: 'planner', members: [], children: ['Publishing', 'Research'], key: 'OrgUnit/research-org/Leadership', inDraft: true });
    expect(flow.units[2]).toMatchObject({ lead: 'researcher', members: ['writer'] });
    expect(flow.peers).toEqual([{ id: 'Research~Publishing', from: 'Research', to: 'Publishing' }]);
    expect(orgToFlow(g, 'other')).toMatchObject({ units: [], peers: [], roots: [] });
    expect(peerId('a', 'b')).toBe('a~b');
    expect(parsePeerId('a~b')).toEqual({ from: 'a', to: 'b' });
    expect(parsePeerId('nothing')).toEqual({ from: '', to: '' });
  });

  it('lays the tree out top down, each unit a card of one width centered over the units below it (UXP1-V002)', () => {
    const flow = orgToFlow(graph(), 'research-org');
    const layout = layoutOrg(flow);
    const [lead, publishing, research] = layout.boxes;
    const L = ORG_LAYOUT;
    expect(lead).toMatchObject({ id: 'Leadership', parent: null, depth: 0, y: L.margin, width: L.nodeWidth, hidden: false });
    expect(publishing).toMatchObject({ id: 'Publishing', parent: 'Leadership', depth: 1, x: L.margin, width: L.nodeWidth });
    expect(research.x).toBe(L.margin + L.nodeWidth + L.siblingGap);
    expect(publishing.y).toBe(research.y);
    expect(publishing.y).toBe(L.margin + unitHeaderHeight(flow.units[0]) + L.levelGap);
    expect(lead.x).toBe((publishing.x + research.x) / 2);
    expect(unitHeaderHeight(flow.units[2])).toBe(L.nameHeight + 2 * L.rowHeight + L.pad);
    expect(absoluteX(layout, 'Research')).toBe(research.x);
    expect(absoluteX(layout, 'gone')).toBe(0);
    expect(layout.width).toBe(research.x + L.nodeWidth + L.margin);
    // A collapsed unit hides what is below it, and the parent then sits alone.
    const closed = layoutOrg(flow, ['Leadership']);
    expect(closed.boxes.filter((b) => b.hidden).map((b) => b.id)).toEqual(['Publishing', 'Research']);
    expect(closed.boxes[0].x).toBe(L.margin);
  });

  it('caps the members a card lists, collapses large organizations below the first level, and finds ancestors', () => {
    const units = [{ name: 'root', parent: null, depth: 0, children: [], members: [] }];
    for (let i = 0; i < 4; i += 1) {
      units[0].children.push(`d1-${i}`);
      const kids = [0, 1, 2, 3].map((j) => `d2-${i}-${j}`);
      units.push({ name: `d1-${i}`, parent: 'root', depth: 1, children: kids, members: [] });
      for (const k of kids) units.push({ name: k, parent: `d1-${i}`, depth: 2, children: [], members: [] });
    }
    const flow = { units, roots: ['root'], peers: [] };
    expect(units.length).toBeGreaterThan(COLLAPSE_ABOVE_UNITS);
    expect(defaultCollapsed(flow)).toEqual(['d1-0', 'd1-1', 'd1-2', 'd1-3']);
    expect(defaultCollapsed({ units: units.slice(0, 3), roots: ['root'] })).toEqual([]);
    expect(descendantCount(flow, 'root')).toBe(20);
    expect(descendantCount(flow, 'd1-2')).toBe(4);
    expect(ancestorsOf(flow, 'd2-1-3')).toEqual(['d1-1', 'root']);
    const layout = layoutOrg(flow, defaultCollapsed(flow));
    expect(layout.boxes.filter((b) => !b.hidden)).toHaveLength(5);
    const many = { members: ['a', 'b', 'c', 'd', 'e', 'f'] };
    expect(shownMembers(many)).toEqual({ list: ['a', 'b', 'c', 'd'], more: 2 });
    expect(unitHeaderHeight(many)).toBe(ORG_LAYOUT.nameHeight + ORG_LAYOUT.rowHeight * 6 + ORG_LAYOUT.pad);
  });

  it('describes the organization and each unit in words', () => {
    const flow = orgToFlow(graph(), 'research-org');
    const summary = orgSummary(t, flow);
    expect(summary.overview).toBe('Organization research-org has 3 units. The root unit is Leadership. There is 1 peer line.');
    expect(summary.units).toEqual(['Leadership is the root unit and is led by planner.', 'Publishing reports to Leadership and is led by editor.', 'Research reports to Leadership and is led by researcher.']);
    expect(summary.peers).toEqual(['Research and Publishing have a peer line.']);
    expect(unitLabel(t, flow.units[2])).toBe('Research, reports to Leadership, Lead: researcher, members writer');
    expect(unitLabel(t, { ...flow.units[0], lead: '' })).toBe('Leadership, Root, No lead');
    expect(orgSummary(t, orgToFlow(graph(), '')).overview).toBe('There is no organization to describe.');
  });

  it('builds unit operation bodies without an app, and offers agents to lead or join', () => {
    expect(UNIT_OPERATIONS).toEqual(['AddUnit', 'RemoveUnit', 'AddUnitMember', 'RemoveUnitMember', 'ConnectUnits', 'DisconnectUnits']);
    expect(operationBody(3, 'AddUnit', { organization: 'research-org', unit: 'Archive', parent: 'Research', agent: 'reviewer', role: '' })).toEqual({ version: 3, operation: 'AddUnit', organization: 'research-org', unit: 'Archive', parent: 'Research', agent: 'reviewer' });
    expect(operationBody(4, 'ConnectUnits', { organization: 'o', from: 'a', to: 'b' })).toEqual({ version: 4, operation: 'ConnectUnits', organization: 'o', from: 'a', to: 'b' });
    expect(unitAgentChoices([{ name: 'zed' }, { name: 'agent-architect' }], graph())).toEqual(['editor', 'planner', 'researcher', 'writer', 'zed']);
  });

  it('explains each new field code', () => {
    for (const code of ['OneRoot', 'UnitNameTaken', 'UnitNotFound', 'UnitHasChildren', 'NoSuchPeerLine', 'OrganizationDeleted', 'PeerNotFound']) expect(t(`common.fieldCodes.${code}`), code).not.toBe(`common.fieldCodes.${code}`);
    for (const op of UNIT_OPERATIONS) expect(t(`components.studio.canvas.operations.${op}`), op).not.toBe(`components.studio.canvas.operations.${op}`);
  });
});

describe('organization panel', () => {
  const flow = () => orgToFlow(graph(), 'research-org');
  const handlers = () => ({ onAddMember: vi.fn(() => Promise.resolve(true)), onRemoveMember: vi.fn(), onDisconnect: vi.fn(), onStartPeer: vi.fn(), onRemoveUnit: vi.fn(), onAddChild: vi.fn() });
  const setValue = (el, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('shows the organization counts with nothing selected', () => {
    const c = mount(<OrgUnitPanel flow={flow()} choices={[]} blocked="" {...handlers()} />);
    expect(c.querySelector('[data-testid="studio-org-panel"]').textContent).toContain('Organization research-org');
    expect(c.textContent).toContain('Leadership');
  });

  it('edits a unit: add and remove members, disconnect peers, and unit actions', async () => {
    const h = handlers();
    const f = flow();
    const c = mount(<OrgUnitPanel flow={f} unit={f.units[2]} choices={['editor', 'writer', 'zed']} blocked="" {...h} />);
    expect(c.querySelector('[data-testid="studio-unit-lead"]').textContent).toContain('researcher');
    expect([...c.querySelectorAll('[data-member]')].map((li) => li.getAttribute('data-member'))).toEqual(['writer']);
    expect([...c.querySelectorAll('datalist option')].map((o) => o.value)).toEqual(['editor', 'zed']);
    await act(async () => setValue(c.querySelector('[data-testid="studio-unit-member-agent"]'), 'zed'));
    await act(async () => setValue(c.querySelector('[data-testid="studio-unit-member-title"]'), 'Clerk'));
    await act(async () => c.querySelector('[data-testid="studio-unit-add-member"]').click());
    expect(h.onAddMember).toHaveBeenCalledWith('Research', 'zed', 'Clerk');
    expect(c.querySelector('[data-testid="studio-unit-member-agent"]').value).toBe('');
    act(() => c.querySelector('[data-testid="studio-unit-remove-member-writer"]').click());
    expect(h.onRemoveMember).toHaveBeenCalledWith('Research', 'writer');
    act(() => c.querySelector('[data-testid="studio-unit-disconnect-Publishing"]').click());
    expect(h.onDisconnect).toHaveBeenCalledWith({ id: 'Research~Publishing', from: 'Research', to: 'Publishing' });
    act(() => c.querySelector('[data-testid="studio-unit-add-child"]').click());
    act(() => c.querySelector('[data-testid="studio-unit-start-peer"]').click());
    act(() => c.querySelector('[data-testid="studio-unit-remove"]').click());
    expect(h.onAddChild).toHaveBeenCalledWith('Research');
    expect(h.onStartPeer).toHaveBeenCalledWith('Research');
    expect(h.onRemoveUnit).toHaveBeenCalledWith('Research');
  });

  it('keeps every action off with the reason when editing is blocked', () => {
    const h = handlers();
    const f = flow();
    const c = mount(<OrgUnitPanel flow={f} unit={f.units[2]} choices={[]} blocked="The draft is applied." {...h} />);
    for (const id of ['studio-unit-add-member', 'studio-unit-remove-member-writer', 'studio-unit-disconnect-Publishing', 'studio-unit-add-child', 'studio-unit-start-peer', 'studio-unit-remove']) {
      const button = c.querySelector(`[data-testid="${id}"]`);
      expect(button.getAttribute('aria-disabled'), id).toBe('true');
      act(() => button.click());
    }
    expect(Object.values(h).every((fn) => fn.mock.calls.length === 0)).toBe(true);
  });

  it('shows a selected peer line with Disconnect', () => {
    const h = handlers();
    const f = flow();
    const c = mount(<OrgUnitPanel flow={f} peer={f.peers[0]} choices={[]} blocked="" {...h} />);
    expect(c.textContent).toContain('Peer line Research and Publishing');
    act(() => c.querySelector('[data-testid="studio-peer-disconnect"]').click());
    expect(h.onDisconnect).toHaveBeenCalledWith(f.peers[0]);
  });
});
