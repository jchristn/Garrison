// Studio canvas for organizations (AA7.10): helpers that turn the draft graph's Organization and OrgUnit nodes and its
// Peer edges into a tree of unit cards, lay it out top down with reporting lines between levels (UXP1-V002), and
// describe the tree in words for screen readers. Plain functions (no JSX, no React Flow) so Node-based tests can
// import them.

/** Unit operations of POST .../graph-operations. */
export const UNIT_OPERATIONS = ['AddUnit', 'RemoveUnit', 'AddUnitMember', 'RemoveUnitMember', 'ConnectUnits', 'DisconnectUnits'];

/**
 * Sizes of the top-down tree layout (UXP1-V002), in canvas pixels: every unit is a card of `nodeWidth` (so names stay
 * readable however large the organization is), `siblingGap` apart side by side, with `levelGap` between a level and the
 * one below it where the reporting lines run. A card shows its name and tags (`nameHeight`), one row per lead or
 * member (`rowHeight`, at most `maxPeople` members, then an "and N more" row), and `margin` is kept around the tree.
 * `pad` and `gap` remain for callers of the older nested layout.
 */
export const ORG_LAYOUT = {
  pad: 12,
  gap: 16,
  minWidth: 200,
  nodeWidth: 200,
  siblingGap: 36,
  levelGap: 56,
  nameHeight: 52,
  rowHeight: 20,
  maxPeople: 4,
  margin: 24
};

/** More units than this open with every unit below the first level collapsed (UXP1-V002). */
export const COLLAPSE_ABOVE_UNITS = 15;

/** Members a unit card lists before it says "and N more". */
export function shownMembers(unit) {
  const members = unit?.members || [];
  const max = ORG_LAYOUT.maxPeople;
  return members.length > max ? { list: members.slice(0, max), more: members.length - max } : { list: members, more: 0 };
}

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

/**
 * Height of a unit card (name, tags, lead, and the members it lists). `extraRows` makes room for the overlay lines of
 * the Chart view (LP3.9), each counted as two rows because a line may wrap on the card.
 */
export function unitHeaderHeight(unit) {
  const L = ORG_LAYOUT;
  const { list, more } = shownMembers(unit);
  return L.nameHeight + L.rowHeight * (1 + list.length + (more ? 1 : 0) + 2 * (unit?.extraRows || 0)) + L.pad;
}

/**
 * The units collapsed by default (UXP1-V002): none for a small organization, and for one of more than
 * COLLAPSE_ABOVE_UNITS units every unit from depth 1 down that has units below it, so the canvas opens on the root and
 * the units that report to it.
 */
export function defaultCollapsed(flow) {
  const units = flow?.units || [];
  if (units.length <= COLLAPSE_ABOVE_UNITS) return [];
  return units.filter((u) => u.depth >= 1 && (u.children || []).length > 0).map((u) => u.name);
}

/** How many units sit below a unit, at any depth. */
export function descendantCount(flow, name) {
  const byName = new Map((flow?.units || []).map((u) => [u.name, u]));
  let count = 0;
  const seen = new Set();
  const walk = (n) => {
    for (const c of byName.get(n)?.children || []) {
      if (seen.has(c)) continue;
      seen.add(c);
      count += 1;
      walk(c);
    }
  };
  walk(name);
  return count;
}

/** The units above a unit, nearest first (its parent, the parent's parent, up to the root). */
export function ancestorsOf(flow, name) {
  const byName = new Map((flow?.units || []).map((u) => [u.name, u]));
  const out = [];
  for (let u = byName.get(name), guard = 0; u?.parent && guard < 1000; u = byName.get(u.parent), guard += 1) {
    if (out.includes(u.parent)) break;
    out.push(u.parent);
  }
  return out;
}

/**
 * Lay the tree out top down (UXP1-V002): each unit is a card of the same width, the units that report to it side by
 * side on the level below, and the unit centered over them. Units below a collapsed unit are left out. Answers
 * { boxes, width, height } with boxes in the flow's unit order, each { id, parent, depth, x, y, width, height, hidden },
 * x and y on the canvas; width and height span the whole tree.
 */
export function layoutOrg(flow, collapsed = []) {
  const L = ORG_LAYOUT;
  const closed = new Set(collapsed || []);
  const byName = new Map(flow.units.map((u) => [u.name, u]));
  const visible = new Set();
  const levelHeight = [];
  const mark = (u, depth, seen) => {
    if (!u || seen.has(u.name)) return;
    seen.add(u.name);
    visible.add(u.name);
    levelHeight[depth] = Math.max(levelHeight[depth] || 0, unitHeaderHeight(u));
    if (!closed.has(u.name)) for (const c of u.children) mark(byName.get(c), depth + 1, seen);
  };
  const seen = new Set();
  for (const name of flow.roots) mark(byName.get(name), 0, seen);
  for (const u of flow.units) if (!seen.has(u.name) && !u.parent) mark(u, 0, seen);
  const levelY = [];
  let y = L.margin;
  for (let d = 0; d < levelHeight.length; d += 1) {
    levelY[d] = y;
    y += (levelHeight[d] || 0) + L.levelGap;
  }
  const place = new Map();
  let cursor = L.margin;
  const placeUnit = (u, depth) => {
    const kids = closed.has(u.name) ? [] : u.children.map((c) => byName.get(c)).filter((k) => k && visible.has(k.name) && !place.has(k.name));
    let x;
    if (!kids.length) {
      x = cursor;
      cursor += L.nodeWidth + L.siblingGap;
    } else {
      place.set(u.name, null);
      for (const k of kids) placeUnit(k, depth + 1);
      const first = place.get(kids[0].name);
      const last = place.get(kids[kids.length - 1].name);
      x = (first.x + last.x) / 2;
    }
    place.set(u.name, { x, y: levelY[depth] ?? L.margin, depth });
  };
  for (const name of flow.roots) if (byName.has(name) && !place.has(name)) placeUnit(byName.get(name), 0);
  for (const u of flow.units) if (visible.has(u.name) && !place.has(u.name)) placeUnit(u, u.depth || 0);
  const boxes = flow.units.map((u) => {
    const at = place.get(u.name);
    return {
      id: u.name,
      parent: u.parent,
      depth: at?.depth ?? u.depth ?? 0,
      x: at?.x ?? L.margin,
      y: at?.y ?? L.margin,
      width: L.nodeWidth,
      height: unitHeaderHeight(u),
      hidden: !visible.has(u.name)
    };
  });
  const shown = boxes.filter((b) => !b.hidden);
  return {
    boxes,
    width: shown.length ? Math.max(...shown.map((b) => b.x + b.width)) + L.margin : 0,
    height: shown.length ? Math.max(...shown.map((b) => b.y + b.height)) + L.margin : 0
  };
}

/** A unit card's x on the canvas. */
export function absoluteX(layout, name) {
  return layout.boxes.find((b) => b.id === name)?.x ?? 0;
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
