import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Background, ReactFlow, applyNodeChanges, useReactFlow } from '@xyflow/react';
import ConfirmModal from '../../ConfirmModal';
import { PlusIcon } from '../../Icons';
import { tip } from '../../Tooltip';
import { readStored, writeStored } from '../../../utils/studio';
import { absoluteX, canvasOrganizations, defaultOrganization, layoutOrg, orgSummary, orgToFlow, parsePeerId, peerId, unitAgentChoices, unitHeaderHeight, unitLabel } from '../../../utils/orgCanvas';
import CanvasUnitNode from './CanvasUnitNode';
import OrgUnitPanel from './OrgUnitPanel';

const NODE_TYPES = { unit: CanvasUnitNode };
const denied = (reason) => (reason ? { 'aria-disabled': 'true', 'data-denied': 'true' } : {});

function orgStorageKey(draftId) {
  return `garrison.studio.canvasOrg.${draftId}`;
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
 */
export default function OrgCanvas({ draft, graph, blocked = '', agents = [], runOperation, say }) {
  const { t } = useTranslation();
  const { fitView } = useReactFlow();
  const [chosen, setChosen] = useState(() => readStored(orgStorageKey(draft.id)));
  const [selection, setSelection] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);
  const [target, setTarget] = useState('');
  const [removing, setRemoving] = useState(null);
  const organizations = canvasOrganizations(graph);
  const organization = defaultOrganization(graph, chosen);
  const flow = useMemo(() => orgToFlow(graph, organization), [graph, organization]);
  const layout = useMemo(() => layoutOrg(flow), [flow]);
  const choices = useMemo(() => unitAgentChoices(agents, graph), [agents, graph]);
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
  const formFlow = formOrg === organization ? flow : orgToFlow(graph, formOrg);
  const parents = formFlow.units.map((u) => u.name);
  // The parent: the one picked, '' for none (a root), or by default the root of the organization the unit goes to.
  const parent = form.parent === '' ? '' : parents.includes(form.parent) ? form.parent : formFlow.roots[0] || '';

  // A selection or a peer line in progress that no longer exists falls back to the organization.
  useEffect(() => {
    if (selection?.type === 'unit' && !flow.units.some((u) => u.name === selection.id)) setSelection(null);
    if (selection?.type === 'peer' && !flow.peers.some((p) => p.id === selection.id)) setSelection(null);
    if (connectFrom && !flow.units.some((u) => u.name === connectFrom)) setConnectFrom(null);
  }, [flow, selection, connectFrom]);

  const choose = (name) => {
    setChosen(name);
    writeStored(orgStorageKey(draft.id), name || null);
    setSelection(null);
    setConnectFrom(null);
  };

  const byName = useMemo(() => new Map(flow.units.map((u) => [u.name, u])), [flow]);
  const selectedId = selection?.type === 'unit' ? selection.id : null;
  const wanted = useMemo(
    () =>
      layout.boxes.map((box) => {
        const unit = byName.get(box.id);
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
            target: !!connectFrom && connectFrom !== box.id
          },
          selected: selectedId === box.id,
          draggable: false,
          connectable: !blocked,
          deletable: false,
          ariaLabel: unitLabel(t, unit),
          domAttributes: {
            'data-canvas-unit': box.id,
            ...tip(blocked ? t('tips.studio.canvas.org.unitReadOnly') : t('tips.studio.canvas.org.unit'))
          }
        };
      }),
    [layout, byName, connectFrom, selectedId, blocked, t]
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
    const el = wrapperRef.current?.querySelector(`.react-flow__node[data-id="${CSS.escape(id)}"]`);
    if (el) {
      focusNext.current = null;
      el.focus();
    }
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addUnit = async () => {
    const unit = form.unit.trim();
    if (blocked || !unit) return;
    const org = formOrg;
    if (!org) return;
    const next = await runOperation('AddUnit', {
      organization: org,
      unit,
      parent: parent || undefined,
      agent: form.agent.trim() || undefined,
      role: form.role.trim() || undefined
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
    if (blocked) return;
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
    if (blocked || !from || !to || from === to) return;
    const next = await runOperation('ConnectUnits', { organization, from, to });
    if (next) {
      setSelection({ type: 'peer', id: peerId(from, to) });
      say(t('components.studio.canvas.org.announce.connected', { from, to }));
    }
  };

  const disconnect = async (peer) => {
    if (blocked) return;
    const next = await runOperation('DisconnectUnits', {
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
    const next = await runOperation('AddUnitMember', {
      organization,
      unit,
      agent,
      role: role || undefined
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
    const next = await runOperation('RemoveUnitMember', {
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
    const next = await runOperation('RemoveUnit', { organization, unit });
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
    if ((key === 'n' || key === 'N') && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      addRef.current?.focus();
      return;
    }
    if (!id || blocked) return;
    if ((key === 'Enter' || key === ' ') && connectFrom && connectFrom !== id) {
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

  const summary = orgSummary(t, flow);
  const summaryId = `studio-org-summary-${draft.id}`;
  const selectedUnit = selection?.type === 'unit' ? byName.get(selection.id) || null : null;
  const selectedPeer = selection?.type === 'peer' ? flow.peers.find((p) => p.id === selection.id) || null : null;
  const targets = flow.units.map((u) => u.name).filter((n) => n !== connectFrom);
  const chosenTarget = targets.includes(target) ? target : targets[0] || '';
  const listId = `studio-org-agents-${draft.id}`;

  return (
    <div className="studio-org-canvas" data-testid="studio-org-canvas">
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
            <button type="button" className="button-primary button-sm" onClick={addUnit} data-testid="studio-org-add" {...denied(blocked)} {...tip(blocked || t('tips.studio.canvas.org.add'))}>
              <PlusIcon size={14} /> {t('components.studio.canvas.org.toolbar.add')}
            </button>
          </div>
          <button type="button" className="button-ghost button-sm" onClick={() => fitView({ padding: 0.2, duration: 200 })} data-testid="studio-org-fit" {...tip(t('tips.studio.canvas.fit'))}>
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
            {['tab', 'select', 'peer', 'remove', 'add', 'peers', 'escape'].map((k) => (
              <li key={k}>{t(`components.studio.canvas.org.keys.${k}`)}</li>
            ))}
          </ul>
        </details>
      </div>
      {!organization ? (
        <div className="text-muted" data-testid="studio-org-empty">
          {t('components.studio.canvas.org.none')}
        </div>
      ) : (
        <div className="studio-canvas-layout">
          <div className="studio-canvas-main">
            <div
              className="studio-canvas-flow"
              ref={wrapperRef}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && connectFrom) cancelPeer();
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
                nodesConnectable={!blocked}
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
                <div className="text-muted">{t('components.studio.canvas.org.noPeerLines')}</div>
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
                            if (!blocked && (e.key === 'Delete' || e.key === 'Backspace')) {
                              e.preventDefault();
                              disconnect(parsePeerId(p.id));
                            }
                          }}
                          data-peer-line={p.id}
                          {...tip(blocked ? t('tips.studio.canvas.callReadOnly') : t('tips.studio.canvas.org.peerLine'))}
                        >
                          {summary.peers[i]}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          <aside className="studio-canvas-side" aria-label={t('components.studio.canvas.panel.label')} data-testid="studio-org-panel-side">
            <OrgUnitPanel
              key={selectedUnit ? `unit-${selectedUnit.name}` : selectedPeer ? `peer-${selectedPeer.id}` : `org-${organization}`}
              flow={flow}
              unit={selectedUnit}
              peer={selectedPeer}
              choices={choices}
              blocked={blocked}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onDisconnect={disconnect}
              onStartPeer={startPeer}
              onRemoveUnit={(name) => setRemoving(name)}
              onAddChild={addChild}
            />
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
