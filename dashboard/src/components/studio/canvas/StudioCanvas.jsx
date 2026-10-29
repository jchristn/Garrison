import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Background, MarkerType, ReactFlow, ReactFlowProvider, applyNodeChanges, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import ConfirmModal from '../../ConfirmModal';
import Tabs from '../../Tabs';
import { tip } from '../../Tooltip';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { draftChanges, readStored, writeStored } from '../../../utils/studio';
import { MOVE_DEBOUNCE_MS, agentChoices, canvasApps, defaultCanvasApp, edgeId, edgeSentence, graphToFlow, nodeKey, nodeLabel, operationBody, parseEdgeId } from '../../../utils/studioCanvas';
import CanvasAgentNode from './CanvasAgentNode';
import CanvasToolbar from './CanvasToolbar';
import CanvasOutline from './CanvasOutline';
import CanvasConflictNotice from './CanvasConflictNotice';
import CanvasOperationError from './CanvasOperationError';
import AgentPanel from './AgentPanel';
import EdgePanel from './EdgePanel';
import AppPanel from './AppPanel';
import RuntimePanel from './RuntimePanel';

const NODE_TYPES = { agent: CanvasAgentNode };

/** localStorage key of the app the canvas last showed for one draft. */
function appStorageKey(draftId) {
  return `garrison.studio.canvasApp.${draftId}`;
}

/**
 * The studio canvas (AD8.2 to AD8.6): the draft's app as an interactive graph drawn with React Flow. Agents are nodes
 * and calls are edges labelled with their delegation depth (dashed when the call allows one at a time instead of
 * fan-out). Every change is a graph operation (POST .../graph-operations) or a draft item save, sent with the version
 * read and one at a time, so they never overtake each other:
 *
 * - drag from an agent's right handle to another agent to connect them; drag an agent to move it (saved with MoveNode
 *   after a short pause, and read back from the draft's layout on reload);
 * - the toolbar adds an agent (from the tenant or the draft), starts a connection, sets the entry agent, removes a
 *   member, disconnects a call, and fits the view;
 * - every action has a keyboard path: agents are focusable in reading order, C starts or completes a connection, E
 *   sets the entry agent, Delete removes, arrow keys move a selected agent, and the outline below the canvas lists
 *   each call as a button (Delete disconnects it, F toggles fan-out);
 * - the side panel edits the selected agent (its Agent item), the selected call, or the app (its AgenticApp item),
 *   and the agent's deployments per environment.
 *
 * A save or operation refused with 409 DraftVersionConflict reads the draft again, names what changed, and keeps the
 * person's edit (panels keep their fields; an operation can be retried). A move refused that way is retried once on
 * the new version without a notice, because it changes only the layout.
 */
export default function StudioCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function CanvasInner({ draft, graph, diff, blocked = '', deployments = [], onGraph, onDraft }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { fitView } = useReactFlow();
  const [agents, setAgents] = useState([]);
  const [chosenApp, setChosenApp] = useState(() => readStored(appStorageKey(draft.id)));
  const [selection, setSelection] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);
  const [opError, setOpError] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [retryOp, setRetryOp] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [panelTab, setPanelTab] = useState('properties');
  const [busy, setBusy] = useState(0);
  const [rfNodes, setRfNodes] = useState([]);
  const versionRef = useRef(0);
  const draftRef = useRef(draft);
  const queue = useRef(Promise.resolve());
  const moveTimers = useRef(new Map());
  const pendingMoves = useRef(new Map());
  const focusNext = useRef(null);
  const addInputRef = useRef(null);
  const wrapperRef = useRef(null);

  const app = defaultCanvasApp(graph, draft, chosenApp);
  const apps = canvasApps(graph, draft);
  const flow = useMemo(() => graphToFlow(graph, app), [graph, app]);
  const choices = useMemo(() => agentChoices(agents, graph, draft, app), [agents, graph, draft, app]);
  const members = flow.nodes.map((n) => n.id);

  useEffect(() => {
    draftRef.current = draft;
    versionRef.current = Math.max(versionRef.current, draft?.version ?? 0, graph?.version ?? 0);
  }, [draft, graph]);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setAgents(r.items || []))
      .catch(() => setAgents([]));
  }, [apiClient, tenantId]);

  // A selection that no longer exists (removed by someone else, or another app chosen) falls back to the app.
  useEffect(() => {
    if (selection?.type === 'node' && !flow.nodes.some((n) => n.id === selection.id)) setSelection(null);
    if (selection?.type === 'edge' && !flow.edges.some((e) => e.id === selection.id)) setSelection(null);
    if (connectFrom && !flow.nodes.some((n) => n.id === connectFrom)) setConnectFrom(null);
  }, [flow, selection, connectFrom]);

  const chooseApp = (name) => {
    setChosenApp(name);
    writeStored(appStorageKey(draft.id), name || null);
    setSelection(null);
    setConnectFrom(null);
  };

  const bumpVersion = (version) => {
    if (Number.isFinite(version)) versionRef.current = Math.max(versionRef.current, version);
  };

  // One request at a time, in the order the person made them, each with the newest version known.
  const enqueue = useCallback((task) => {
    const next = queue.current.then(task, task);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  const readFresh = useCallback(async () => {
    const fresh = await apiClient.getStudioDraft(tenantId, draftRef.current.id);
    bumpVersion(fresh?.version);
    return fresh;
  }, [apiClient, tenantId]);

  const runOperation = useCallback(
    (operation, fields = {}, { quiet = false } = {}) =>
      enqueue(async () => {
        const send = (version) => apiClient.studioGraphOperation(tenantId, draftRef.current.id, operationBody(version, operation, operation === 'MoveNode' ? fields : { app, ...fields }));
        setBusy((n) => n + 1);
        try {
          let next;
          try {
            next = await send(versionRef.current);
          } catch (e) {
            if (e?.code !== 'DraftVersionConflict') throw e;
            const before = draftRef.current;
            const fresh = await readFresh();
            if (!quiet) {
              setConflict({ ...draftChanges(before, fresh), editingKey: null, operation });
              setRetryOp({ operation, fields });
              onDraft(fresh);
              return null;
            }
            next = await send(fresh.version);
          }
          bumpVersion(next?.version);
          setOpError(null);
          if (!quiet) {
            setConflict(null);
            setRetryOp(null);
          }
          onGraph(next);
          return next;
        } catch (e) {
          setOpError({ error: e, operation });
          return null;
        } finally {
          setBusy((n) => n - 1);
        }
      }),
    [apiClient, tenantId, app, enqueue, readFresh, onGraph, onDraft]
  );

  /**
   * Save one draft item's document (a property panel's edit). Answers { ok }, { conflict } after a 409 (the draft was
   * read again and the notice names what changed; the panel keeps its fields), or { error } with the server's error.
   */
  const saveItem = useCallback(
    (kind, name, document) =>
      enqueue(async () => {
        setBusy((n) => n + 1);
        try {
          const next = await apiClient.putStudioDraftItem(tenantId, draftRef.current.id, kind, name, { version: versionRef.current, operation: 'Upsert', document });
          bumpVersion(next?.version);
          setConflict(null);
          setRetryOp(null);
          onDraft(next);
          return { ok: true };
        } catch (e) {
          if (e?.code === 'DraftVersionConflict') {
            try {
              const before = draftRef.current;
              const fresh = await readFresh();
              setConflict({ ...draftChanges(before, fresh), editingKey: `${kind}/${name}` });
              setRetryOp(null);
              onDraft(fresh);
            } catch (reload) {
              return { error: reload };
            }
            return { conflict: true };
          }
          return { error: e };
        } finally {
          setBusy((n) => n - 1);
        }
      }),
    [apiClient, tenantId, enqueue, readFresh, onDraft]
  );

  // ----------------------------------------------------------------------------------- moves

  const flushMove = useCallback(
    (id) => {
      clearTimeout(moveTimers.current.get(id));
      moveTimers.current.delete(id);
      const position = pendingMoves.current.get(id);
      if (!position) return;
      runOperation('MoveNode', { nodeKey: nodeKey('Agent', id), x: position.x, y: position.y }, { quiet: true }).finally(() => {
        if (pendingMoves.current.get(id) === position) pendingMoves.current.delete(id);
      });
    },
    [runOperation]
  );
  const flushRef = useRef(flushMove);
  useEffect(() => {
    flushRef.current = flushMove;
  }, [flushMove]);

  const scheduleMove = useCallback((id, position) => {
    pendingMoves.current.set(id, { x: position.x, y: position.y });
    clearTimeout(moveTimers.current.get(id));
    moveTimers.current.set(
      id,
      setTimeout(() => flushRef.current(id), MOVE_DEBOUNCE_MS)
    );
  }, []);

  // Leaving the canvas saves moves still waiting for their pause.
  useEffect(() => {
    const timers = moveTimers.current;
    return () => {
      for (const id of [...timers.keys()]) flushRef.current(id);
    };
  }, []);

  // ----------------------------------------------------------------------------------- nodes and edges

  useEffect(() => {
    setRfNodes((prev) => {
      const old = new Map(prev.map((n) => [n.id, n]));
      return flow.nodes.map((n) => {
        const was = old.get(n.id);
        const pending = pendingMoves.current.get(n.id);
        return {
          id: n.id,
          type: 'agent',
          position: pending || n.position,
          data: { node: n, connecting: connectFrom === n.id, target: !!connectFrom && connectFrom !== n.id },
          measured: was?.measured,
          selected: selection?.type === 'node' && selection.id === n.id,
          draggable: !blocked,
          connectable: !blocked,
          deletable: false,
          ariaLabel: nodeLabel(t, n),
          domAttributes: { 'data-canvas-node': n.id, ...tip(blocked ? t('tips.studio.canvas.nodeReadOnly') : t('tips.studio.canvas.node')) }
        };
      });
    });
  }, [flow, selection, connectFrom, blocked, t]);

  // Focus an agent the person just added, so the keyboard flow continues from it.
  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    const el = wrapperRef.current?.querySelector(`.react-flow__node[data-id="${CSS.escape(id)}"]`);
    if (el) {
      focusNext.current = null;
      el.focus();
    }
  }, [rfNodes]);

  const rfEdges = useMemo(
    () =>
      flow.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        label: t('components.studio.graph.depth', { depth: e.depth }),
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        className: `studio-canvas-edge${e.fanOut ? '' : ' is-single'}`,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        selected: selection?.type === 'edge' && selection.id === e.id,
        deletable: false,
        focusable: false,
        ariaLabel: edgeSentence(t, e),
        domAttributes: { 'data-edge': e.id, 'data-fan-out': e.fanOut ? 'true' : 'false' }
      })),
    [flow, selection, t]
  );

  const onNodesChange = useCallback(
    (changes) => {
      setRfNodes((nodes) => applyNodeChanges(changes, nodes));
      for (const c of changes) {
        if (c.type === 'position' && c.position && !c.dragging) scheduleMove(c.id, c.position);
        else if (c.type === 'position' && c.position && c.dragging) pendingMoves.current.set(c.id, { x: c.position.x, y: c.position.y });
        if (c.type === 'select' && c.selected) setSelection({ type: 'node', id: c.id });
      }
    },
    [scheduleMove]
  );

  // ----------------------------------------------------------------------------------- actions

  const say = (text) => setAnnouncement(text);

  const addAgent = async (name, role) => {
    const agent = String(name || '').trim();
    if (!agent || blocked) return false;
    const next = await runOperation('AddMember', { agent, role: String(role || '').trim() || undefined });
    if (!next) return false;
    focusNext.current = agent;
    setSelection({ type: 'node', id: agent });
    say(t('components.studio.canvas.announce.added', { name: agent, app }));
    return true;
  };

  const startConnect = (id) => {
    if (blocked) return;
    setConnectFrom(id);
    say(t('components.studio.canvas.announce.connectStart', { name: id }));
  };

  const cancelConnect = () => {
    if (!connectFrom) return;
    setConnectFrom(null);
    say(t('components.studio.canvas.announce.connectCancelled'));
  };

  const connect = async (from, to, fanOut = true) => {
    setConnectFrom(null);
    if (blocked || !from || !to) return;
    if (from === to) {
      say(t('components.studio.canvas.announce.selfEdge'));
      return;
    }
    const next = await runOperation('Connect', { from, to, fanOut });
    if (next) {
      setSelection({ type: 'edge', id: edgeId(from, to) });
      say(t('components.studio.canvas.announce.connected', { from, to }));
    }
  };

  const disconnect = async (id) => {
    if (blocked) return;
    const { from, to } = parseEdgeId(id);
    const next = await runOperation('Disconnect', { from, to });
    if (next) {
      setSelection(null);
      say(t('components.studio.canvas.announce.disconnected', { from, to }));
    }
  };

  const setFanOut = async (id, fanOut) => {
    if (blocked) return;
    const { from, to } = parseEdgeId(id);
    const next = await runOperation('Connect', { from, to, fanOut });
    if (next) say(t(fanOut ? 'components.studio.canvas.announce.fanOutOn' : 'components.studio.canvas.announce.fanOutOff', { from, to }));
  };

  const setEntry = async (id) => {
    if (blocked || flow.entry === id) return;
    const next = await runOperation('SetEntry', { agent: id });
    if (next) say(t('components.studio.canvas.announce.entry', { name: id, app }));
  };

  const askRemove = (id) => {
    if (!blocked) setRemoving(id);
  };

  const remove = async () => {
    const id = removing;
    setRemoving(null);
    const next = await runOperation('RemoveMember', { agent: id });
    if (next) {
      setSelection(null);
      say(t('components.studio.canvas.announce.removed', { name: id, app }));
    }
  };

  const retry = () => {
    if (!retryOp) return;
    runOperation(retryOp.operation, retryOp.fields);
  };

  const onKeyDown = (event) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest('input, textarea, select, button, a')) return;
    const nodeEl = target.closest('.react-flow__node');
    const id = nodeEl?.getAttribute('data-id') || null;
    const key = event.key;
    if ((key === 'n' || key === 'N') && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      addInputRef.current?.focus();
      return;
    }
    if (!id || blocked) return;
    if ((key === 'Enter' || key === ' ') && connectFrom && connectFrom !== id) {
      event.preventDefault();
      connect(connectFrom, id);
    } else if ((key === 'c' || key === 'C') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (connectFrom && connectFrom !== id) connect(connectFrom, id);
      else startConnect(id);
    } else if ((key === 'e' || key === 'E') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      setEntry(id);
    } else if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      askRemove(id);
    }
  };

  const selectedNode = selection?.type === 'node' ? flow.nodes.find((n) => n.id === selection.id) || null : null;
  const selectedEdge = selection?.type === 'edge' ? flow.edges.find((e) => e.id === selection.id) || null : null;
  const panelTabs = [
    { id: 'properties', label: t('components.studio.canvas.panel.properties'), tip: t('tips.studio.canvas.panel.properties') },
    { id: 'runtime', label: t('components.studio.canvas.panel.runtime'), tip: t('tips.studio.canvas.panel.runtime') }
  ];
  const summaryId = `studio-canvas-summary-${draft.id}`;

  return (
    <section
      className="panel studio-graph studio-canvas"
      aria-label={t('components.studio.canvas.title')}
      data-testid="studio-graph"
      aria-busy={busy > 0 ? 'true' : undefined}
      onKeyDown={(event) => {
        // Escape cancels a call in progress from anywhere on the canvas: an agent, the toolbar, or the connect bar.
        if (event.key === 'Escape' && connectFrom) cancelConnect();
      }}
    >
      <div className="studio-row-between">
        <h3 className="section-title" {...tip(t('tips.studio.canvas.title'))}>
          {t('components.studio.canvas.title')}
        </h3>
        {apps.length > 1 && (
          <div className="flex gap-sm items-center">
            <label htmlFor="studio-canvas-app" {...tip(t('tips.studio.canvas.appPicker'))}>
              {t('components.studio.canvas.appPicker')}
            </label>
            <select id="studio-canvas-app" value={app} onChange={(e) => chooseApp(e.target.value)} data-testid="studio-canvas-app" {...tip(t('tips.studio.canvas.appPicker'))}>
              {apps.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="sr-only" role="status" aria-live="polite" data-testid="studio-canvas-announce">
        {announcement}
      </div>
      <CanvasConflictNotice conflict={conflict} onRetry={retryOp ? retry : null} onDismiss={() => setConflict(null)} />
      <CanvasOperationError failure={opError} onDismiss={() => setOpError(null)} />
      {!graph ? (
        <div className="text-muted">{t('common.generic.loading')}</div>
      ) : !app ? (
        <div className="text-muted" data-testid="studio-graph-empty">
          {t('components.studio.canvas.noApp')}
        </div>
      ) : (
        <>
          <CanvasToolbar
            app={app}
            choices={choices}
            members={members}
            entry={flow.entry}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            connectFrom={connectFrom}
            blocked={blocked}
            addInputRef={addInputRef}
            onAdd={addAgent}
            onStartConnect={startConnect}
            onConnect={connect}
            onCancelConnect={cancelConnect}
            onSetEntry={setEntry}
            onRemove={askRemove}
            onDisconnect={disconnect}
            onFitView={() => fitView({ padding: 0.2, duration: 200 })}
          />
          <div className="studio-canvas-layout">
            <div className="studio-canvas-main">
              {/* Key presses on agents bubble up here: C connects, E sets the entry, Delete removes, N adds, Escape cancels. */}
              <div className="studio-canvas-flow" ref={wrapperRef} onKeyDown={onKeyDown} data-testid={`studio-canvas-${app}`}>
                <ReactFlow
                  aria-label={t('components.studio.canvas.flowLabel', { app })}
                  aria-describedby={summaryId}
                  nodes={rfNodes}
                  edges={rfEdges}
                  nodeTypes={NODE_TYPES}
                  onNodesChange={onNodesChange}
                  onConnect={(c) => connect(c.source, c.target)}
                  isValidConnection={(c) => c.source !== c.target && !flow.edges.some((e) => e.from === c.source && e.to === c.target)}
                  onNodeClick={(_, node) => {
                    if (connectFrom && connectFrom !== node.id) connect(connectFrom, node.id);
                    else setSelection({ type: 'node', id: node.id });
                  }}
                  onEdgeClick={(_, edge) => setSelection({ type: 'edge', id: edge.id })}
                  onPaneClick={() => {
                    setSelection(null);
                    cancelConnect();
                  }}
                  nodesDraggable={!blocked}
                  nodesConnectable={!blocked}
                  nodesFocusable
                  edgesFocusable={false}
                  deleteKeyCode={null}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={0.3}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
                  ariaLabelConfig={{
                    'node.a11yDescription.default': t('components.studio.canvas.a11y.node'),
                    'node.a11yDescription.keyboardDisabled': t('components.studio.canvas.a11y.node'),
                    'node.a11yDescription.ariaLiveMessage': ({ direction, x, y }) => t('components.studio.canvas.a11y.moved', { direction: t(`components.studio.canvas.a11y.directions.${direction}`), x, y }),
                    'edge.a11yDescription.default': t('components.studio.canvas.a11y.edge'),
                    'handle.ariaLabel': t('components.studio.canvas.a11y.handle')
                  }}
                >
                  <Background gap={16} size={1} />
                </ReactFlow>
              </div>
              <CanvasOutline
                summaryId={summaryId}
                flow={flow}
                selection={selection}
                blocked={blocked}
                onSelectEdge={(id) => setSelection({ type: 'edge', id })}
                onDisconnect={disconnect}
                onToggleFanOut={(edge) => setFanOut(edge.id, !edge.fanOut)}
                onAddLoose={(name) => addAgent(name)}
              />
            </div>
            <aside className="studio-canvas-side" aria-label={t('components.studio.canvas.panel.label')} data-testid="studio-canvas-panel">
              {selectedNode ? (
                <>
                  <Tabs label={t('components.studio.canvas.panel.tabsLabel', { name: selectedNode.id })} active={panelTab} onChange={setPanelTab} tabs={panelTabs} />
                  {panelTab === 'properties' ? (
                    <AgentPanel key={`agent-${selectedNode.id}`} name={selectedNode.id} node={selectedNode} draft={draft} diff={diff} blocked={blocked} onSave={saveItem} onShowRuntime={() => setPanelTab('runtime')} />
                  ) : (
                    <RuntimePanel key={`runtime-${selectedNode.id}`} agent={selectedNode.id} draft={draft} diff={diff} agents={agents} deployments={deployments} blocked={blocked} onSave={saveItem} />
                  )}
                </>
              ) : selectedEdge ? (
                <EdgePanel key={`edge-${selectedEdge.id}`} edge={selectedEdge} blocked={blocked} onFanOut={setFanOut} onDisconnect={disconnect} />
              ) : (
                <AppPanel key={`app-${app}`} app={app} flow={flow} draft={draft} diff={diff} blocked={blocked} onSave={saveItem} onSetEntry={setEntry} />
              )}
            </aside>
          </div>
        </>
      )}
      <ConfirmModal
        open={!!removing}
        danger
        title={t('components.studio.canvas.removeTitle')}
        message={t('components.studio.canvas.removeMessage', { name: removing || '', app })}
        confirmLabel={t('components.studio.canvas.remove')}
        confirmTip={t('tips.studio.canvas.remove')}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}
