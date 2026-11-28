import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { isRtl } from '../../utils/direction';
import { graphLayers, stateTone } from '../../utils/trailLayout';
import { ToneIcon, edgeLabel, stepAriaLabel, stepDetail, stepTitle } from './trailParts';

/** Graph geometry: the width of a layer column, the height of a slot, and the size of a node card. */
export const TRAIL_GRAPH_GEOMETRY = { layerWidth: 220, slotHeight: 84, nodeWidth: 168 };

/** Above this many steps the graph shows a minimap (LP2.4). */
export const TRAIL_MINIMAP_THRESHOLD = 25;

const TrailGraphNode = memo(function TrailGraphNode({ data, selected }) {
  const { node, title, detail, who, rtl } = data;
  const tone = stateTone(node.state);
  const redacted = node.kind === 'Redacted';
  const cls = ['trail-card', `tone-${tone}`, node.isFocus && 'is-focus', selected && 'is-selected', redacted && 'is-redacted'].filter(Boolean).join(' ');
  return (
    <div className={cls} data-testid="trail-graph-node" data-step-id={node.id}>
      <Handle type="target" position={rtl ? Position.Right : Position.Left} isConnectable={false} />
      <div className="trail-card-title" title={title}>
        {title}
      </div>
      {!redacted && who && (
        <div className="trail-card-who" title={who}>
          {who}
        </div>
      )}
      {!redacted && detail && (
        <div className="trail-card-detail">
          <ToneIcon tone={tone} /> <span>{detail}</span>
        </div>
      )}
      <Handle type="source" position={rtl ? Position.Left : Position.Right} isConnectable={false} />
    </div>
  );
});

const NODE_TYPES = { step: TrailGraphNode };

/** React Flow nodes and edges for a trail: time-layered columns from the origin, mirrored in right-to-left layouts. */
export function trailToFlow(t, trail, { rtl = false, selectedId = null, lng = 'en' } = {}) {
  const g = TRAIL_GRAPH_GEOMETRY;
  const layers = graphLayers(trail);
  const maxLayer = Math.max(0, ...layers.map((l) => l.layer));
  const at = new Map(layers.map((l) => [l.id, l]));
  const nodes = (trail?.nodes || []).map((node) => {
    const l = at.get(node.id) || { layer: 0, slot: 0 };
    const column = rtl ? maxLayer - l.layer : l.layer;
    return {
      id: node.id,
      type: 'step',
      position: { x: column * g.layerWidth, y: l.slot * g.slotHeight },
      selected: node.id === selectedId,
      draggable: false,
      connectable: false,
      ariaLabel: stepAriaLabel(t, node, lng),
      data: { node, title: stepTitle(t, node), detail: stepDetail(t, node, lng), who: node.agentName || node.callerName || '', rtl }
    };
  });
  const ids = new Set(nodes.map((n) => n.id));
  const edges = (trail?.edges || [])
    .filter((e) => ids.has(e.fromId) && ids.has(e.toId))
    .map((e, i) => ({
      id: `${e.fromId}>${e.toId}>${e.kind}>${i}`,
      source: e.fromId,
      target: e.toId,
      label: edgeLabel(t, e.kind),
      className: `trail-graph-edge kind-${e.kind}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      focusable: false
    }));
  return { nodes, edges };
}

function TrailGraphCanvas({ trail, selectedId, onSelect, onOpen }) {
  const { t, i18n } = useTranslation();
  const rtl = isRtl();
  const flow = useMemo(() => trailToFlow(t, trail, { rtl, selectedId, lng: i18n.language }), [t, trail, rtl, selectedId, i18n.language]);
  const big = flow.nodes.length > TRAIL_MINIMAP_THRESHOLD;
  return (
    <div
      className="trail-graph"
      data-testid="trail-graph"
      role="group"
      aria-label={t('trail.graphLabel', { steps: flow.nodes.length })}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        const id = e.target?.closest?.('.react-flow__node')?.getAttribute('data-id');
        if (!id) return;
        e.preventDefault();
        onSelect?.(id);
        onOpen?.(id);
      }}
    >
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={NODE_TYPES}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_e, node) => {
          onSelect?.(node.id);
          onOpen?.(node.id);
        }}
        onNodesChange={() => {}}
      >
        <Background gap={24} />
        <Controls showInteractive={false} />
        {big && <MiniMap pannable zoomable data-testid="trail-graph-minimap" />}
      </ReactFlow>
    </div>
  );
}

/**
 * The graph view of an activity trail (LP2.4) on React Flow: each step one layer after what caused it, edges labeled
 * with their kind, cards styled like the sequence view's steps (state as an icon and a label). A minimap appears above
 * 25 steps. React Flow's own keyboard support moves between nodes; Enter on a focused node opens the drawer.
 */
export default function TrailGraph(props) {
  return (
    <ReactFlowProvider>
      <TrailGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}
