import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { layoutAppGraph } from '../utils/apps';

const NODE_W = 160;
const NODE_H = 46;
const GAP_X = 72;
const GAP_Y = 18;
const PAD = 12;

const short = (text, max = 20) => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

/**
 * Read-only graph of an agentic app (AD6): members in layers from the entry agent (left) along the longest call path,
 * edges as arrows (dashed when fan-out is not allowed), and members the entry agent cannot reach in a final column
 * outlined in red. `nameOf(agentId)` names a member. The full graph canvas comes with the studio (AD8).
 */
export default function AgenticAppGraph({ app, nameOf = (id) => id }) {
  const { t } = useTranslation();
  const markerId = `app-graph-arrow-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const layout = layoutAppGraph(app);
  if (!layout.nodes.length) {
    return (
      <div className="text-muted app-graph-empty" data-testid="app-graph">
        {t('components.apps.graph.empty')}
      </div>
    );
  }
  const pos = new Map(layout.nodes.map((n) => [n.id, { x: PAD + n.layer * (NODE_W + GAP_X), y: PAD + n.row * (NODE_H + GAP_Y) }]));
  const width = PAD * 2 + layout.layers * NODE_W + Math.max(0, layout.layers - 1) * GAP_X;
  const height = PAD * 2 + layout.rows * NODE_H + Math.max(0, layout.rows - 1) * GAP_Y;
  const name = (id) => nameOf(id) || id;
  const summary = t('components.apps.graph.summary', { members: layout.nodes.length, edges: layout.edges.length });

  const path = (edge) => {
    const a = pos.get(edge.from);
    const b = pos.get(edge.to);
    if (!a || !b) return '';
    if (b.x > a.x) {
      const x1 = a.x + NODE_W;
      const y1 = a.y + NODE_H / 2;
      const x2 = b.x - 2;
      const y2 = b.y + NODE_H / 2;
      const mid = (x1 + x2) / 2;
      return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
    }
    // A call back to an earlier or the same column (only in a graph the server would refuse): loop below the nodes.
    const x1 = a.x + NODE_W / 2;
    const y1 = a.y + NODE_H;
    const x2 = b.x + NODE_W / 2;
    const y2 = b.y + NODE_H + 2;
    const low = Math.max(y1, y2) + GAP_Y;
    return `M ${x1} ${y1} C ${x1} ${low}, ${x2} ${low}, ${x2} ${y2}`;
  };

  return (
    <div className="app-graph" data-testid="app-graph" {...tip(t('tips.apps.graph'))}>
      <svg role="img" aria-label={summary} viewBox={`0 0 ${width} ${height + GAP_Y}`} width={width} style={{ maxWidth: '100%', height: 'auto' }}>
        <title>{summary}</title>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="app-graph-arrow" />
          </marker>
        </defs>
        {layout.edges.map((edge, i) => (
          <path
            key={`${edge.from}-${edge.to}-${i}`}
            d={path(edge)}
            className={`app-graph-edge${edge.fanOutAllowed ? '' : ' is-single'}`}
            markerEnd={`url(#${markerId})`}
            data-edge={`${edge.from}>${edge.to}`}
          >
            <title>{t(edge.fanOutAllowed ? 'components.apps.graph.edgeFanOut' : 'components.apps.graph.edgeSingle', { caller: name(edge.from), callee: name(edge.to) })}</title>
          </path>
        ))}
        {layout.nodes.map((n) => {
          const p = pos.get(n.id);
          const label = name(n.id);
          return (
            <g key={n.id} transform={`translate(${p.x} ${p.y})`} className={`app-graph-node${n.entry ? ' is-entry' : ''}${n.unreachable ? ' is-unreachable' : ''}`} data-node={n.id}>
              <title>{n.entry ? t('components.apps.graph.entryNode', { name: label }) : n.unreachable ? t('components.apps.graph.unreachableNode', { name: label }) : label}</title>
              <rect width={NODE_W} height={NODE_H} rx="8" />
              <text x={NODE_W / 2} y={n.entry || n.unreachable ? 19 : NODE_H / 2 + 4} textAnchor="middle" className="app-graph-name">
                {short(label)}
              </text>
              {(n.entry || n.unreachable) && (
                <text x={NODE_W / 2} y="35" textAnchor="middle" className="app-graph-tag">
                  {n.entry ? t('components.apps.graph.entry') : t('components.apps.graph.unreachable')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="app-graph-legend text-muted">
        <span className="app-graph-key is-fanout" aria-hidden="true" /> {t('components.apps.graph.legendFanOut')}
        <span className="app-graph-key is-single" aria-hidden="true" /> {t('components.apps.graph.legendSingle')}
      </div>
    </div>
  );
}
