import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position } from '@xyflow/react';

/**
 * One agent on the studio canvas: its name, an Entry marker, Drafted or Deleted, and the capabilities its draft
 * names. The left handle takes calls, the right handle starts one (drag it to another agent). Every marker is text,
 * so nothing depends on color alone.
 */
function CanvasAgentNode({ data, selected }) {
  const { t } = useTranslation();
  const n = data.node;
  const cls = ['studio-canvas-node', n.entry && 'is-entry', n.inDraft && 'is-drafted', n.deleted && 'is-deleted', n.unreachable && 'is-unreachable', selected && 'is-selected', data.connecting && 'is-connecting', data.target && 'is-target'].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <Handle type="target" position={Position.Left} />
      <div className="studio-canvas-node-name">{n.name}</div>
      <div className="studio-canvas-node-tags">
        {n.entry && <span className="studio-canvas-tag is-entry">{t('components.studio.canvas.node.entry')}</span>}
        {n.deleted ? <span className="studio-canvas-tag is-deleted">{t('components.studio.graph.deleted')}</span> : n.inDraft && <span className="studio-canvas-tag">{t('components.studio.graph.inDraft')}</span>}
        {n.unreachable && <span className="studio-canvas-tag is-unreachable">{t('components.studio.canvas.node.unreachable')}</span>}
        {data.connecting && <span className="studio-canvas-tag is-connecting">{t('components.studio.canvas.node.connecting')}</span>}
      </div>
      {n.capabilities.length > 0 && <div className="studio-canvas-node-note" data-node-note={n.name}>{n.capabilities.join(', ')}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(CanvasAgentNode);
