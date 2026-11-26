// Studio canvas for organizations (AA7.10): helpers that turn the draft graph's Organization and OrgUnit nodes and its
// Peer edges into nested unit boxes, lay them out (each unit holds its child units, so reporting lines follow from
// nesting), and describe the tree in words for screen readers. Plain functions (no JSX, no React Flow) so Node-based
// tests can import them.

/** Unit operations of POST .../graph-operations. */
export const UNIT_OPERATIONS = ['AddUnit', 'RemoveUnit', 'AddUnitMember', 'RemoveUnitMember', 'ConnectUnits', 'DisconnectUnits'];

/**
 * Box sizes of the nested layout, in canvas pixels: the padding inside a unit, the gap between sibling units, the
 * narrowest unit, the height of the name and tags, one row per lead or member, and the margin around the roots.
 */
export const ORG_LAYOUT = {
  pad: 12,
  gap: 16,
  minWidth: 200,
  nameHeight: 52,
  rowHeight: 20,
  margin: 24
};

/** The id of a peer line on the canvas: `from~to` (unit names; a peer line has no direction). */
export function peerId(from, to) {
  return `${from}~${to}`;
}

/** The two units of a peer line id. */
export function parsePeerId(id) {
  const at = String(id || '').indexOf('~');
  return at < 0 ? { from: '', to: '' } : { from: id.slice(0, at), to: id.slice(at + 1) };
}

/** Organizations the graph holds: Organization nodes, then organizations named by units or peer lines, unique. */
export function canvasOrganizations(graph) {
  const names = [];
  const add = (n) => n && !names.includes(n) && names.push(n);
  for (const n of graph?.nodes || []) if (n.kind === 'Organization') add(n.name);
  for (const n of graph?.nodes || []) if (n.kind === 'OrgUnit') add(n.organization);
  for (const e of graph?.edges || []) if (e.kind === 'Peer') add(e.organization);
  return names;
}

/** The organization the canvas opens on: the remembered one when it still exists, else the first. */
export function defaultOrganization(graph, remembered) {
  const names = canvasOrganizations(graph);
  if (remembered && names.includes(remembered)) return remembered;
  return names[0] || '';
}

/**
 * One organization of the graph as a tree. Units carry their name, parent, lead, members (agents whose `unitOf` names
 * the unit, the lead left out), depth, and child unit names, in depth-first order with the root first. Peer lines are
 * unique pairs of unit names. A unit whose parent is missing counts as a root.
 */
export function orgToFlow(graph, organization) {
  const nodes = graph?.nodes || [];
  const orgNode = nodes.find((n) => n.kind === 'Organization' && n.name === organization);
  const raw = nodes.filter((n) => n.kind === 'OrgUnit' && n.organization === organization);
  const unitName = (n) => (n.name.startsWith(`${organization}/`) ? n.name.slice(organization.length + 1) : n.name);
  const names = new Set(raw.map(unitName));
  const agents = nodes.filter((n) => n.kind === 'Agent');
  const shaped = raw.map((n) => {
    const name = unitName(n);
    const position = `${organization}/${name}`;
    const members = agents
      .filter((a) => (a.unitOf || []).includes(position) && a.name !== n.lead)
      .map((a) => a.name)
      .sort();
    return {
      id: name,
      key: n.key || `OrgUnit/${position}`,
      name,
      parent: n.parentUnit && names.has(n.parentUnit) ? n.parentUnit : null,
      lead: n.lead || '',
      members,
      inDraft: !!n.inDraft,
      children: [],
      depth: 0
    };
  });
  const byName = new Map(shaped.map((u) => [u.name, u]));
  for (const u of shaped) if (u.parent) byName.get(u.parent).children.push(u.name);
  const units = [];
  const walk = (u, depth) => {
    if (units.includes(u)) return;
    u.depth = depth;
    units.push(u);
    for (const c of u.children) walk(byName.get(c), depth + 1);
  };
  for (const u of shaped) if (!u.parent) walk(u, 0);
  for (const u of shaped) if (!units.includes(u)) walk(u, 0);
  const peers = [];
  for (const e of graph?.edges || []) {
    if (e.kind !== 'Peer' || e.organization !== organization || !names.has(e.from) || !names.has(e.to)) continue;
    if (peers.some((p) => (p.from === e.from && p.to === e.to) || (p.from === e.to && p.to === e.from))) continue;
    peers.push({ id: peerId(e.from, e.to), from: e.from, to: e.to });
  }
  return {
    organization,
    inDraft: !!orgNode?.inDraft,
    deleted: !!orgNode?.deleted,
    units,
    peers,
    roots: units.filter((u) => !u.parent).map((u) => u.name)
  };
}

/** Height of a unit's own part (name, tags, lead, and members), above its child units. */
export function unitHeaderHeight(unit) {
  const L = ORG_LAYOUT;
  return L.nameHeight + L.rowHeight * (1 + (unit.members?.length || 0)) + L.pad;
}

/**
 * Lay the tree out as nested boxes: each unit holds its child units side by side under its own header. Answers
 * { boxes } in the flow's unit order (parents before children), each { id, parent, x, y, width, height } with x and y
 * relative to the parent box (or to the canvas for a root, roots side by side).
 */
export function layoutOrg(flow) {
  const L = ORG_LAYOUT;
  const byName = new Map(flow.units.map((u) => [u.name, u]));
  const size = new Map();
  const measure = (u) => {
    if (size.has(u.name)) return size.get(u.name);
    size.set(u.name, { width: L.minWidth, height: 0 });
    const kids = u.children.map((c) => measure(byName.get(c)));
    const header = unitHeaderHeight(u);
    const inner = kids.reduce((w, k) => w + k.width, 0) + L.gap * Math.max(0, kids.length - 1);
    const s = {
      width: Math.max(L.minWidth, kids.length ? inner + 2 * L.pad : 0),
      height: header + (kids.length ? Math.max(...kids.map((k) => k.height)) + L.pad : 0)
    };
    size.set(u.name, s);
    return s;
  };
  for (const u of flow.units) measure(u);
  const place = new Map();
  let rootX = L.margin;
  for (const name of flow.roots) {
    place.set(name, { x: rootX, y: L.margin });
    rootX += size.get(name).width + L.gap * 2;
  }
  for (const u of flow.units) {
    let x = L.pad;
    for (const c of u.children) {
      place.set(c, { x, y: unitHeaderHeight(u) });
      x += size.get(c).width + L.gap;
    }
  }
  return {
    boxes: flow.units.map((u) => ({
      id: u.name,
      parent: u.parent,
      ...(place.get(u.name) || { x: L.margin, y: L.margin }),
      ...size.get(u.name)
    }))
  };
}

/** A unit box's x on the canvas: its own x plus every parent's. */
export function absoluteX(layout, name) {
  const byId = new Map(layout.boxes.map((b) => [b.id, b]));
  let x = 0;
  for (let box = byId.get(name), guard = 0; box && guard < 1000; box = box.parent ? byId.get(box.parent) : null, guard += 1) x += box.x;
  return x;
}

/** The accessible name of a unit box: its name, root marker, lead, member count, and draft state. */
export function unitLabel(t, unit) {
  const parts = [unit.name];
  if (!unit.parent) parts.push(t('components.studio.canvas.org.node.root'));
  else parts.push(t('components.studio.canvas.org.node.reportsTo', { name: unit.parent }));
  parts.push(unit.lead ? t('components.studio.canvas.org.node.lead', { name: unit.lead }) : t('components.studio.canvas.org.node.noLead'));
  if (unit.members.length)
    parts.push(
      t('components.studio.canvas.org.node.members', {
        list: unit.members.join(', ')
      })
    );
  return parts.join(', ');
}

/** One peer line in words. */
export function peerSentence(t, peer) {
  return t('components.studio.canvas.org.summary.peer', {
    from: peer.from,
    to: peer.to
  });
}

/**
 * The organization in words for screen readers, built with `t`: the unit count and root, then one sentence per unit
 * ("Billing reports to Leadership and is led by agent-2.") and one per peer line. Answers { overview, units[], peers[] }.
 */
export function orgSummary(t, flow) {
  if (!flow.organization)
    return {
      overview: t('components.studio.canvas.org.summary.none'),
      units: [],
      peers: []
    };
  const count = t('components.studio.canvas.org.summary.units', {
    organization: flow.organization,
    count: flow.units.length
  });
  const root = flow.roots.length
    ? t('components.studio.canvas.org.summary.root', {
        name: flow.roots.join(', ')
      })
    : '';
  const lines = t('components.studio.canvas.org.summary.peerCount', {
    count: flow.peers.length
  });
  const units = flow.units.map((u) => {
    const lead = u.lead ? t('components.studio.canvas.org.summary.ledBy', { name: u.lead }) : t('components.studio.canvas.org.summary.noLead');
    return u.parent
      ? t('components.studio.canvas.org.summary.unitChild', {
          name: u.name,
          parent: u.parent,
          lead
        })
      : t('components.studio.canvas.org.summary.unitRoot', {
          name: u.name,
          lead
        });
  });
  return {
    overview: [count, root, lines].filter(Boolean).join(' '),
    units,
    peers: flow.peers.map((p) => peerSentence(t, p))
  };
}

/** Agents that can lead or join a unit: tenant agents and the graph's agents, unique and sorted. */
export function unitAgentChoices(agents, graph) {
  const names = new Set();
  for (const a of agents || []) if (a?.name && a.name !== 'agent-architect') names.add(a.name);
  for (const n of graph?.nodes || []) if (n.kind === 'Agent' && !n.deleted) names.add(n.name);
  return [...names].sort();
}
