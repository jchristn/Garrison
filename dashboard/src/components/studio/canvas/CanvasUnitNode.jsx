import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position } from '@xyflow/react';

/**
 * One org unit on the studio canvas (AA7.10): a box with the unit's name, a Root or In draft tag, its lead, and its
 * members, holding its child units below. The handles take and start peer lines (drag from the right handle to another
 * unit). Every marker is text, so nothing depends on color alone.
 */
function CanvasUnitNode({ data, selected }) {
  const { t } = useTranslation();
  const u = data.unit;
  const cls = ['studio-canvas-unit', !u.parent && 'is-root', selected && 'is-selected', data.connecting && 'is-connecting', data.target && 'is-target'].filter(Boolean).join(' ');
  return (
    <div className={cls} style={{ '--unit-header': `${data.header}px` }}>
      <Handle type="target" position={Position.Left} />
      <div className="studio-canvas-unit-head">
        <div className="studio-canvas-node-name" title={u.name}>
          {u.name}
        </div>
        <div className="studio-canvas-node-tags">
          {!u.parent && <span className="studio-canvas-tag is-entry">{t('components.studio.canvas.org.node.root')}</span>}
          {u.inDraft && <span className="studio-canvas-tag">{t('components.studio.graph.inDraft')}</span>}
          {data.connecting && <span className="studio-canvas-tag is-connecting">{t('components.studio.canvas.node.connecting')}</span>}
        </div>
        <ul className="studio-canvas-unit-people" data-unit-people={u.name}>
          <li className="is-lead" title={u.lead || ''}>
            {u.lead ? t('components.studio.canvas.org.node.lead', { name: u.lead }) : t('components.studio.canvas.org.node.noLead')}
          </li>
          {u.members.map((m) => (
            <li key={m} title={m}>
              {m}
            </li>
          ))}
        </ul>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(CanvasUnitNode);
