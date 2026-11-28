import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Background, MiniMap, ReactFlow, applyNodeChanges, useReactFlow } from '@xyflow/react';
import ConfirmModal from '../../ConfirmModal';
import { PlusIcon } from '../../Icons';
import { tip } from '../../Tooltip';
import { readStored, writeStored } from '../../../utils/studio';
import { absoluteX, layoutOrg, orgSummary, parsePeerId, peerId, unitHeaderHeight, unitLabel } from '../../../utils/orgCanvas';
import { ORG_HISTORY_LIMIT, draftOrgSource, inverseSteps } from '../../../utils/orgCanvasSource';
import CanvasUnitNode from './CanvasUnitNode';
import OrgUnitPanel from './OrgUnitPanel';
import OrgPeoplePalette from '../../orgDesigner/OrgPeoplePalette';
import OrgProblemsList from '../../orgDesigner/OrgProblemsList';
import { EmptyNote } from '../../States';

const NODE_TYPES = { unit: CanvasUnitNode };
const denied = (reason) => (reason ? { 'aria-disabled': 'true', 'data-denied': 'true' } : {});

/** More units than this show a minimap (LP3.10). */
export const MINIMAP_ABOVE_UNITS = 12;

function orgStorageKey(scope) {
  return `garrison.studio.canvasOrg.${scope}`;
}

function reducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The organization view of the studio canvas (AA7.10): one organization of the draft drawn as nested unit boxes (each
 * unit holds the units that report to it, so reporting lines follow from nesting), with the lead and members in each
 * box and peer lines drawn between units. Every change is a unit graph operation sent at once through runOperation
 * (one at a time, with the newest draft version):
 *
 * - the toolbar adds a unit (organization, name, parent, lead, and the lead's title); a new organization name starts
 *   a new organization, whose first unit is its root;
 * - drag from a unit's right handle to another unit, or use Start peer line, to connect them (ConnectUnits);
 * - the side panel adds and removes members, disconnects peer lines, and removes the unit after a confirmation;
 * - the keyboard does the same: units are focusable parent first, C starts or finishes a peer line, Delete removes a
 *   unit, N jumps to the Add unit field, Escape cancels; the outline lists each peer line as a button (Delete
 *   disconnects it).
 *
 * Every change goes through an organization canvas source (LP3.1, utils/orgCanvasSource.js). Without a `source` the
 * canvas builds the draft source over `graph` and `runOperation`, which sends the studio unit graph operations above.
 *
 * The organization designer (LP3.2 to LP3.10) uses the same canvas over the working tree source and adds:
 *
 * - Undo and Redo (Ctrl+Z, Ctrl+Shift+Z or Ctrl+Y): each change is undone by sending its inverse through the source;
 * - live checks after each change (source.validate), listed under the outline with a link to each unit;
 * - the people palette (`palette`): drag an agent onto a unit, or pick one and press Enter (member) or L (lead) on a
 *   focused unit;
 * - `decorations`: { [unit]: { keepers: { agent: text }, overlay: { health, healthTone, lines[] } } } drawn on the boxes;
 * - `renderPanel(ctx)`: the host's side panel in place of OrgUnitPanel (ctx carries the OrgUnitPanel props as
 *   `panelProps`, plus `perform(method, fields)` for changes that should join the undo history); `onNewAgent(unit)`
 *   adds New agent to the palette;
 * - `readOnly`: no editing at all (the Chart tab's overlays), with selection kept so a unit can be inspected;
 * - a minimap above MINIMAP_ABOVE_UNITS units, and Fit to screen without animation under prefers-reduced-motion.
 */
export default function OrgCanvas({ draft, graph, source = null, scopeId = '', blocked = '', readOnly = false, palette = false, decorations = null, renderPanel = null, onNewAgent = null, agents = [], runOperation, say }) {
  const { t } = useTranslation();
  const { fitView } = useReactFlow();
  const scope = scopeId || draft?.id || 'org';
  const [chosen, setChosen] = useState(() => readStored(orgStorageKey(scope)));
  const [selection, setSelection] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);
  const [target, setTarget] = useState('');
  const [removing, setRemoving] = useState(null);
  const [picked, setPicked] = useState('');
  const [history, setHistory] = useState({ undo: [], redo: [] });
  const [check, setCheck] = useState({ result: null, checking: false });
  const src = useMemo(() => source || draftOrgSource({ graph, runOperation }), [source, graph, runOperation]);
  const organizations = src.organizations();
  // The remembered organization when it still exists, else the first.
  const organization = chosen && organizations.includes(chosen) ? chosen : organizations[0] || '';
  const baseFlow = useMemo(() => src.load(organization), [src, organization]);
  // Overlay lines make a unit's own part taller, so the layout leaves room for them.
  const flow = useMemo(
    () => (decorations ? { ...baseFlow, units: baseFlow.units.map((u) => ({ ...u, extraRows: decorations[u.name]?.overlay?.lines?.length || 0 })) } : baseFlow),
    [baseFlow, decorations]
  );
  const layout = useMemo(() => layoutOrg(flow), [flow]);
  const choices = useMemo(() => src.choices(agents), [src, agents]);
  const flowRef = useRef(flow);
  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);
  const [form, setForm] = useState({
    organization: '',
    unit: '',
    parent: null,
    agent: '',
    role: ''
  });
  const addRef = useRef(null);
  const wrapperRef = useRef(null);
  const focusNext = useRef(null);
  const formOrg = form.organization.trim() || organization;
  const formFlow = formOrg === organization ? flow : src.load(formOrg);
  const parents = formFlow.units.map((u) => u.name);
  // The parent: the one picked, '' for none (a root), or by default the root of the organization the unit goes to.
  const parent = form.parent === '' ? '' : parents.includes(form.parent) ? form.parent : formFlow.roots[0] || '';
  const editBlocked = blocked || (readOnly ? 'readOnly' : '');

  // A selection or a peer line in progress that no longer exists falls back to the organization.
  useEffect(() => {
    if (selection?.type === 'unit' && !flow.units.some((u) => u.name === selection.id)) setSelection(null);
    if (selection?.type === 'peer' && !flow.peers.some((p) => p.id === selection.id)) setSelection(null);
    if (connectFrom && !flow.units.some((u) => u.name === connectFrom)) setConnectFrom(null);
  }, [flow, selection, connectFrom]);

  // Live checks (LP3.7): the source checks the organization after every change (each change gives a new flow).
  useEffect(() => {
    if (readOnly || !organization) return undefined;
    let live = true;
    setCheck((c) => ({ ...c, checking: true }));
    Promise.resolve(src.validate(organization))
      .then((result) => live && setCheck({ result, checking: false }))
      .catch((error) => live && setCheck({ result: { valid: null, problems: [], error }, checking: false }));
    return () => {
      live = false;
    };
  }, [src, organization, baseFlow, readOnly]);

  const choose = (name) => {
    setChosen(name);
    writeStored(orgStorageKey(scope), name || null);
    setSelection(null);
    setConnectFrom(null);
    setHistory({ undo: [], redo: [] });
  };

  // One change through the source. A change that went through joins the undo history with its inverse, worked out
  // from the flow as it was before; a new change clears Redo.
  const perform = useCallback(
    async (method, fields) => {
      const before = flowRef.current;
      const result = await src[method](fields);
      if (result) {
        setHistory((h) => ({
          undo: [...h.undo, { method, fields, inverse: inverseSteps(method, fields, before) }].slice(-ORG_HISTORY_LIMIT),
          redo: []
        }));
      }
      return result;
    },
    [src]
  );

  const runSteps = async (steps) => {
    for (const [method, fields] of steps) {
      if (!(await src[method](fields))) return false;
    }
    return true;
  };

  const changeName = (entry) => t(`components.orgDesigner.history.methods.${entry.method}`);

  const undo = async () => {
    const entry = history.undo[history.undo.length - 1];
    if (!entry || editBlocked || !entry.inverse.length) return;
    if (await runSteps(entry.inverse)) {
      setHistory((h) => ({ undo: h.undo.slice(0, -1), redo: [...h.redo, entry] }));
      say(t('components.orgDesigner.history.undone', { change: changeName(entry) }));
    }
  };

  const redo = async () => {
    const entry = history.redo[history.redo.length - 1];
    if (!entry || editBlocked) return;
    const before = flowRef.current;
    if (await src[entry.method](entry.fields)) {
      setHistory((h) => ({ undo: [...h.undo, { ...entry, inverse: inverseSteps(entry.method, entry.fields, before) }], redo: h.redo.slice(0, -1) }));
      say(t('components.orgDesigner.history.redone', { change: changeName(entry) }));
    }
  };

  const byName = useMemo(() => new Map(flow.units.map((u) => [u.name, u])), [flow]);
  const selectedId = selection?.type === 'unit' ? selection.id : null;
  const problemCounts = useMemo(() => {
    const counts = {};
    for (const p of check.result?.problems || []) if (p.unit) counts[p.unit] = (counts[p.unit] || 0) + 1;
    return counts;
  }, [check.result]);

  const placeAgent = useCallback(
    async ({ agent, unit, as }) => {
      if (editBlocked || !agent || !unit) return null;
      const lead = as === 'lead' && src.supports.setLead;
      const next = lead ? await perform('setLead', { organization, unit, agent, role: undefined }) : await perform('addMember', { organization, unit, agent, role: '' });
      if (next) {
        say(t(lead ? 'components.orgDesigner.announce.leadSet' : 'components.studio.canvas.org.announce.memberAdded', { name: agent, unit }));
        setSelection({ type: 'unit', id: unit });
      }
      return next;
    },
    [editBlocked, src, perform, organization, say, t]
  );
  const onDropAgent = useCallback((unit, agent, as) => placeAgent({ agent, unit, as }), [placeAgent]);

  const wanted = useMemo(
    () =>
      layout.boxes.map((box) => {
        const unit = byName.get(box.id);
        const deco = decorations?.[box.id] || null;
        return {
          id: box.id,
          type: 'unit',
          position: { x: box.x, y: box.y },
          parentId: box.parent || undefined,
          style: { width: box.width, height: box.height },
          width: box.width,
          height: box.height,
          data: {
            unit,
            header: unitHeaderHeight(unit),
            connecting: connectFrom === box.id,
            target: !!connectFrom && connectFrom !== box.id,
            problems: problemCounts[box.id] || 0,
            keepers: deco?.keepers || null,
            overlay: deco?.overlay || null,
            onDropAgent: palette && !editBlocked ? onDropAgent : null,
            canLead: !!src.supports.setLead
          },
          selected: selectedId === box.id,
          draggable: false,
          connectable: !editBlocked,
          deletable: false,
          ariaLabel: unitLabel(t, unit),
          domAttributes: {
            'data-canvas-unit': box.id,
            ...tip(readOnly ? t('tips.orgDesigner.unitOverlay') : blocked ? t('tips.studio.canvas.org.unitReadOnly') : t('tips.studio.canvas.org.unit'))
          }
        };
      }),
    [layout, byName, connectFrom, selectedId, blocked, readOnly, editBlocked, problemCounts, decorations, palette, onDropAgent, src, t]
  );
  // React Flow measures nodes into this state; a new layout replaces the nodes and keeps what it measured.
  const [rfNodes, setRfNodes] = useState([]);
  useEffect(() => {
    setRfNodes((prev) => {
      const old = new Map(prev.map((n) => [n.id, n]));
      return wanted.map((n) => ({ ...n, measured: old.get(n.id)?.measured }));
    });
  }, [wanted]);
  // A peer line has no direction, so it runs from the unit further left to the other one and never crosses its own box.
  const left = (a, b) => (absoluteX(layout, a) <= absoluteX(layout, b) ? [a, b] : [b, a]);
  const edges = flow.peers.map((p) => ({
    id: p.id,
    source: left(p.from, p.to)[0],
    target: left(p.from, p.to)[1],
    className: 'studio-canvas-edge is-peer',
    selected: selection?.type === 'peer' && selection.id === p.id,
    deletable: false,
    focusable: false,
    zIndex: 1000,
    ariaLabel: t('components.studio.canvas.org.summary.peer', {
      from: p.from,
      to: p.to
    }),
    domAttributes: { 'data-peer': p.id }
  }));

  // Focus a unit the person just added, so the keyboard flow continues from it.
  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    const quoted = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : String(id).replace(/["\\]/g, '\\$&');
    const el = wrapperRef.current?.querySelector(`.react-flow__node[data-id="${quoted}"]`);
    if (el) {
      focusNext.current = null;
      el.focus();
    }
  });

  const showUnit = (name) => {
    setSelection({ type: 'unit', id: name });
    focusNext.current = name;
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addUnit = async () => {
    const unit = form.unit.trim();
    if (editBlocked || !unit) return;
    const org = formOrg;
    if (!org) return;
    const next = await perform('addUnit', {
      organization: org,
      unit,
      parent,
      agent: form.agent.trim(),
      role: form.role.trim()
    });
    if (!next) return;
    if (org !== organization) choose(org);
    setForm({ organization: '', unit: '', parent: null, agent: '', role: '' });
    focusNext.current = unit;
    setSelection({ type: 'unit', id: unit });
    say(
      t('components.studio.canvas.org.announce.added', {
        name: unit,
        organization: org
      })
    );
  };

  const addChild = (name) => {
    setForm((f) => ({ ...f, organization: '', parent: name }));
    addRef.current?.focus();
  };

  const startPeer = (name) => {
    if (editBlocked) return;
    setConnectFrom(name);
    setTarget('');
    say(t('components.studio.canvas.org.announce.peerStart', { name }));
  };

  const cancelPeer = () => {
    if (!connectFrom) return;
    setConnectFrom(null);
    say(t('components.studio.canvas.announce.connectCancelled'));
  };

  const connect = async (from, to) => {
    setConnectFrom(null);
    if (editBlocked || !from || !to || from === to) return;
    const next = await perform('connectUnits', { organization, from, to });
    if (next) {
      setSelection({ type: 'peer', id: peerId(from, to) });
      say(t('components.studio.canvas.org.announce.connected', { from, to }));
    }
  };

  const disconnect = async (peer) => {
    if (editBlocked) return;
    const next = await perform('disconnectUnits', {
      organization,
      from: peer.from,
      to: peer.to
    });
    if (next) {
      setSelection(null);
      say(
        t('components.studio.canvas.org.announce.disconnected', {
          from: peer.from,
          to: peer.to
        })
      );
    }
  };

  const addMember = async (unit, agent, role) => {
    const next = await perform('addMember', {
      organization,
      unit,
      agent,
      role
    });
    if (next)
      say(
        t('components.studio.canvas.org.announce.memberAdded', {
          name: agent,
          unit
        })
      );
    return !!next;
  };

  const removeMember = async (unit, agent) => {
    const next = await perform('removeMember', {
      organization,
      unit,
      agent
    });
    if (next)
      say(
        t('components.studio.canvas.org.announce.memberRemoved', {
          name: agent,
          unit
        })
      );
  };

  const removeUnit = async () => {
    const unit = removing;
    setRemoving(null);
    const next = await perform('removeUnit', { organization, unit });
    if (next) {
      setSelection(null);
      say(
        t('components.studio.canvas.org.announce.removed', {
          name: unit,
          organization
        })
      );
    }
  };

  const onKeyDown = (event) => {
    const el = event.target;
    if (!(el instanceof Element) || el.closest('input, textarea, select, button, a')) return;
    const id = el.closest('.react-flow__node')?.getAttribute('data-id') || null;
    const key = event.key;
    if ((key === 'n' || key === 'N') && !event.ctrlKey && !event.metaKey && !event.altKey && !readOnly) {
      event.preventDefault();
      addRef.current?.focus();
      return;
    }
    if (id && readOnly && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      setSelection({ type: 'unit', id });
      return;
    }
    if (!id || editBlocked) return;
    const leadKey = (key === 'l' || key === 'L') && !event.ctrlKey && !event.metaKey && src.supports.setLead;
    if (picked && (key === 'Enter' || key === ' ' || leadKey)) {
      event.preventDefault();
      placeAgent({ agent: picked, unit: id, as: leadKey ? 'lead' : 'member' }).then((done) => done && setPicked(''));
    } else if ((key === 'Enter' || key === ' ') && connectFrom && connectFrom !== id) {
      event.preventDefault();
      connect(connectFrom, id);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      setSelection({ type: 'unit', id });
    } else if ((key === 'c' || key === 'C') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (connectFrom && connectFrom !== id) connect(connectFrom, id);
      else startPeer(id);
    } else if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      setRemoving(id);
    }
  };

  // Undo and Redo from anywhere in the canvas except a text field, which keeps its own undo.
  const onHistoryKey = (event) => {
    if (readOnly) return;
    const el = event.target;
    if (el instanceof Element && el.closest('input, textarea, select')) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = String(event.key || '').toLowerCase();
    if (mod && key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if (mod && ((key === 'z' && event.shiftKey) || key === 'y')) {
      event.preventDefault();
      redo();
    }
  };

  const summary = orgSummary(t, flow);
  const summaryId = `studio-org-summary-${scope}`;
  const selectedUnit = selection?.type === 'unit' ? byName.get(selection.id) || null : null;
  const selectedPeer = selection?.type === 'peer' ? flow.peers.find((p) => p.id === selection.id) || null : null;
  const targets = flow.units.map((u) => u.name).filter((n) => n !== connectFrom);
  const chosenTarget = targets.includes(target) ? target : targets[0] || '';
  const listId = `studio-org-agents-${scope}`;
  const lastUndo = history.undo[history.undo.length - 1];
  const lastRedo = history.redo[history.redo.length - 1];
  const undoTip = blocked || (lastUndo ? t('tips.orgDesigner.history.undo', { change: changeName(lastUndo) }) : t('tips.orgDesigner.history.nothingToUndo'));
  const redoTip = blocked || (lastRedo ? t('tips.orgDesigner.history.redo', { change: changeName(lastRedo) }) : t('tips.orgDesigner.history.nothingToRedo'));
  const placed = useMemo(() => {
    const out = {};
    for (const u of flow.units) for (const name of [u.lead, ...u.members].filter(Boolean)) if (!out[name]) out[name] = u.name;
    return out;
  }, [flow]);
  const panelProps = {
    flow,
    unit: selectedUnit,
    peer: selectedPeer,
    choices,
    blocked: readOnly ? t('tips.orgDesigner.readOnly') : blocked,
    onAddMember: addMember,
    onRemoveMember: removeMember,
    onDisconnect: disconnect,
    onStartPeer: startPeer,
    onRemoveUnit: (name) => setRemoving(name),
    onAddChild: addChild
  };
  const panelKey = selectedUnit ? `unit-${selectedUnit.name}` : selectedPeer ? `peer-${selectedPeer.id}` : `org-${organization}`;

  return (
    <div className="studio-org-canvas" data-testid="studio-org-canvas" onKeyDown={onHistoryKey}>
      <div className="studio-canvas-toolbar" data-testid="studio-org-toolbar">
        <div className="studio-canvas-tools" role="group" aria-label={t('components.studio.canvas.org.toolbar.label')}>
          {organizations.length > 1 && (
            <div className="flex gap-sm items-center">
              <label htmlFor="studio-canvas-org" {...tip(t('tips.studio.canvas.org.picker'))}>
                {t('components.studio.canvas.org.picker')}
              </label>
              <select id="studio-canvas-org" value={organization} onChange={(e) => choose(e.target.value)} data-testid="studio-canvas-org" {...tip(t('tips.studio.canvas.org.picker'))}>
                {organizations.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!readOnly && (
            <div className="studio-canvas-add studio-org-add">
              <label htmlFor="studio-org-add-unit" {...tip(t('tips.studio.canvas.org.addUnit'))}>
                {t('components.studio.canvas.org.toolbar.addUnit')}
              </label>
              <input
                id="studio-org-add-unit"
                ref={addRef}
                value={form.unit}
                placeholder={t('components.studio.canvas.org.toolbar.unitPlaceholder')}
                readOnly={!!blocked}
                autoComplete="off"
                onChange={(e) => set('unit', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUnit())}
                data-testid="studio-org-add-unit"
                {...tip(blocked || t('tips.studio.canvas.org.addUnit'))}
              />
              <label htmlFor="studio-org-add-parent" className="sr-only" {...tip(t('tips.studio.canvas.org.parent'))}>
                {t('components.studio.canvas.org.toolbar.parent')}
              </label>
              <select
                id="studio-org-add-parent"
                value={parent}
                disabled={!!blocked}
                onChange={(e) => set('parent', e.target.value)}
                data-testid="studio-org-add-parent"
                {...tip(t('tips.studio.canvas.org.parent'))}
              >
                <option value="">{t('components.studio.canvas.org.toolbar.noParent')}</option>
                {parents.map((p) => (
                  <option key={p} value={p}>
                    {t('components.studio.canvas.org.toolbar.under', { name: p })}
                  </option>
                ))}
              </select>
              <label htmlFor="studio-org-add-lead" className="sr-only" {...tip(t('tips.studio.canvas.org.leadAgent'))}>
                {t('components.studio.canvas.org.toolbar.lead')}
              </label>
              <input
                id="studio-org-add-lead"
                list={listId}
                value={form.agent}
                placeholder={t('components.studio.canvas.org.toolbar.leadPlaceholder')}
                readOnly={!!blocked}
                autoComplete="off"
                onChange={(e) => set('agent', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUnit())}
                data-testid="studio-org-add-lead"
                {...tip(blocked || t('tips.studio.canvas.org.leadAgent'))}
              />
              <datalist id={listId}>
                {choices.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <label htmlFor="studio-org-add-role" className="sr-only" {...tip(t('tips.studio.canvas.org.leadTitle'))}>
                {t('components.studio.canvas.org.toolbar.leadTitle')}
              </label>
              <input
                id="studio-org-add-role"
                value={form.role}
                placeholder={t('components.studio.canvas.org.toolbar.leadTitle')}
                readOnly={!!blocked}
                onChange={(e) => set('role', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUnit())}
                data-testid="studio-org-add-role"
                {...tip(blocked || t('tips.studio.canvas.org.leadTitle'))}
              />
              {src.kind === 'draft' && (
                <>
                  <label htmlFor="studio-org-add-org" className="sr-only" {...tip(t('tips.studio.canvas.org.organization'))}>
                    {t('components.studio.canvas.org.toolbar.organization')}
                  </label>
                  <input
                    id="studio-org-add-org"
                    value={form.organization}
                    placeholder={organization || t('components.studio.canvas.org.toolbar.organization')}
                    readOnly={!!blocked}
                    autoComplete="off"
                    onChange={(e) => set('organization', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUnit())}
                    data-testid="studio-org-add-org"
                    {...tip(blocked || t('tips.studio.canvas.org.organization'))}
                  />
                </>
              )}
              <button type="button" className="button-primary button-sm" onClick={addUnit} data-testid="studio-org-add" {...denied(blocked)} {...tip(blocked || t('tips.studio.canvas.org.add'))}>
                <PlusIcon size={14} /> {t('components.studio.canvas.org.toolbar.add')}
              </button>
            </div>
          )}
          {!readOnly && (
            <div className="flex gap-sm items-center" role="group" aria-label={t('components.orgDesigner.history.label')}>
              <button type="button" className="button-ghost button-sm" onClick={undo} data-testid="org-undo" {...denied(blocked || (lastUndo?.inverse.length ? '' : 'none'))} {...tip(undoTip)}>
                {t('components.orgDesigner.history.undo')}
              </button>
              <button type="button" className="button-ghost button-sm" onClick={redo} data-testid="org-redo" {...denied(blocked || (lastRedo ? '' : 'none'))} {...tip(redoTip)}>
                {t('components.orgDesigner.history.redo')}
              </button>
            </div>
          )}
          <button type="button" className="button-ghost button-sm" onClick={() => fitView({ padding: 0.2, duration: reducedMotion() ? 0 : 200 })} data-testid="studio-org-fit" {...tip(t('tips.studio.canvas.fit'))}>
            {t('components.studio.canvas.toolbar.fit')}
          </button>
        </div>
        {connectFrom && (
          <div className="info-banner studio-canvas-connect" data-testid="studio-org-connect-bar">
            <span role="status">
              {t('components.studio.canvas.org.connectBar.message', {
                name: connectFrom
              })}
            </span>
            <label htmlFor="studio-org-connect-to" {...tip(t('tips.studio.canvas.org.connectTo'))}>
              {t('components.studio.canvas.connectBar.to')}
            </label>
            <select id="studio-org-connect-to" value={chosenTarget} onChange={(e) => setTarget(e.target.value)} data-testid="studio-org-connect-to" {...tip(t('tips.studio.canvas.org.connectTo'))}>
              {targets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button-primary button-sm"
              onClick={() => chosenTarget && connect(connectFrom, chosenTarget)}
              data-testid="studio-org-connect-confirm"
              {...denied(chosenTarget ? '' : 'none')}
              {...tip(t('tips.studio.canvas.org.connectConfirm'))}
            >
              {t('components.studio.canvas.connectBar.confirm')}
            </button>
            <button type="button" className="button-ghost button-sm" onClick={cancelPeer} data-testid="studio-org-connect-cancel" {...tip(t('tips.studio.canvas.connectCancel'))}>
              {t('common.actions.cancel')}
            </button>
          </div>
        )}
        <details className="studio-canvas-keys">
          <summary {...tip(t('tips.studio.canvas.keys'))}>{t('components.studio.canvas.keys.title')}</summary>
          <ul className="studio-list">
            {(readOnly ? ['tab', 'select'] : ['tab', 'select', 'peer', 'remove', 'add', 'peers', 'escape']).map((k) => (
              <li key={k}>{t(`components.studio.canvas.org.keys.${k}`)}</li>
            ))}
            {!readOnly && <li>{t('components.orgDesigner.keys.undo')}</li>}
            {palette && !readOnly && <li>{t('components.orgDesigner.keys.place')}</li>}
          </ul>
        </details>
      </div>
      {!organization ? (
        <EmptyNote data-testid="studio-org-empty">
          {t('components.studio.canvas.org.none')}
        </EmptyNote>
      ) : (
        <div className="studio-canvas-layout">
          <div className="studio-canvas-main">
            <div
              className="studio-canvas-flow"
              ref={wrapperRef}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && connectFrom) cancelPeer();
                else if (event.key === 'Escape' && picked) setPicked('');
                else onKeyDown(event);
              }}
              data-testid={`studio-org-flow-${organization}`}
            >
              <ReactFlow
                aria-label={t('components.studio.canvas.org.flowLabel', {
                  organization
                })}
                aria-describedby={summaryId}
                nodes={rfNodes}
                onNodesChange={(changes) =>
                  setRfNodes((list) =>
                    applyNodeChanges(
                      changes.filter((c) => c.type !== 'remove'),
                      list
                    )
                  )
                }
                edges={edges}
                nodeTypes={NODE_TYPES}
                onConnect={(c) => connect(c.source, c.target)}
                isValidConnection={(c) => c.source !== c.target && !flow.peers.some((p) => (p.from === c.source && p.to === c.target) || (p.from === c.target && p.to === c.source))}
                onNodeClick={(_, node) => {
                  if (connectFrom && connectFrom !== node.id) connect(connectFrom, node.id);
                  else setSelection({ type: 'unit', id: node.id });
                }}
                onEdgeClick={(_, edge) => setSelection({ type: 'peer', id: edge.id })}
                onPaneClick={() => {
                  setSelection(null);
                  cancelPeer();
                }}
                nodesDraggable={false}
                nodesConnectable={!editBlocked}
                nodesFocusable
                edgesFocusable={false}
                deleteKeyCode={null}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                ariaLabelConfig={{
                  'node.a11yDescription.default': t('components.studio.canvas.org.a11y.unit'),
                  'node.a11yDescription.keyboardDisabled': t('components.studio.canvas.org.a11y.unit'),
                  'edge.a11yDescription.default': t('components.studio.canvas.org.a11y.peer'),
                  'handle.ariaLabel': t('components.studio.canvas.org.a11y.handle')
                }}
              >
                <Background gap={16} size={1} />
                {flow.units.length > MINIMAP_ABOVE_UNITS && <MiniMap pannable zoomable ariaLabel={t('components.orgDesigner.minimap')} className="org-minimap" />}
              </ReactFlow>
            </div>
            <div className="studio-canvas-outline" data-testid="studio-org-outline">
              <p id={summaryId} className="studio-canvas-summary" data-testid="studio-org-summary">
                {summary.overview}
              </p>
              <ul className="studio-list" data-testid="studio-org-units">
                {summary.units.map((line, i) => (
                  <li key={flow.units[i].name} data-unit-line={flow.units[i].name}>
                    {line}
                  </li>
                ))}
              </ul>
              <div className="form-section-title" id={`${summaryId}-peers`} {...tip(t('tips.studio.canvas.org.peers'))}>
                {t('components.studio.canvas.org.peerList', {
                  total: flow.peers.length
                })}
              </div>
              {flow.peers.length === 0 ? (
                <EmptyNote>{t('components.studio.canvas.org.noPeerLines')}</EmptyNote>
              ) : (
                <ul className="studio-list" aria-labelledby={`${summaryId}-peers`}>
                  {flow.peers.map((p, i) => {
                    const on = selection?.type === 'peer' && selection.id === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={`button-ghost button-sm studio-canvas-call${on ? ' is-selected' : ''}`}
                          aria-pressed={on}
                          onClick={() => setSelection({ type: 'peer', id: p.id })}
                          onKeyDown={(e) => {
                            if (!editBlocked && (e.key === 'Delete' || e.key === 'Backspace')) {
                              e.preventDefault();
                              disconnect(parsePeerId(p.id));
                            }
                          }}
                          data-peer-line={p.id}
                          {...tip(editBlocked ? t('tips.studio.canvas.callReadOnly') : t('tips.studio.canvas.org.peerLine'))}
                        >
                          {summary.peers[i]}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!readOnly && <OrgProblemsList result={check.result} checking={check.checking} onShowUnit={showUnit} idPrefix={`${summaryId}-problems`} />}
            </div>
          </div>
          <aside className="studio-canvas-side" aria-label={t('components.studio.canvas.panel.label')} data-testid="studio-org-panel-side">
            {palette && !readOnly && (
              <OrgPeoplePalette
                choices={choices}
                placed={placed}
                units={flow.units.map((u) => u.name)}
                defaultUnit={selectedUnit?.name || ''}
                picked={picked}
                canLead={!!src.supports.setLead}
                blocked={blocked}
                onPick={setPicked}
                onPlace={placeAgent}
                onNewAgent={onNewAgent}
                idPrefix={`${scope}-palette`}
              />
            )}
            {renderPanel ? renderPanel({ key: panelKey, flow, organization, unit: selectedUnit, peer: selectedPeer, choices, perform, panelProps, readOnly }) : <OrgUnitPanel key={panelKey} {...panelProps} />}
          </aside>
        </div>
      )}
      <ConfirmModal
        open={!!removing}
        danger
        title={t('components.studio.canvas.org.removeTitle')}
        message={t('components.studio.canvas.org.removeMessage', {
          name: removing || '',
          organization
        })}
        confirmLabel={t('components.studio.canvas.org.removeUnit')}
        confirmTip={t('tips.studio.canvas.org.removeUnit')}
        onConfirm={removeUnit}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
