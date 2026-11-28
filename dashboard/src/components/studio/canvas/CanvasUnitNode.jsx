import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position } from '@xyflow/react';
import { AGENT_DRAG_TYPE, draggedAgent } from '../../../utils/orgCanvasSource';

/**
 * One org unit on the studio canvas (AA7.10): a box with the unit's name, a Root or In draft tag, its lead, and its
 * members, holding its child units below. The handles take and start peer lines (drag from the right handle to another
 * unit). Every marker is text, so nothing depends on color alone.
 *
 * The organization designer (LP3.3 to LP3.9) adds, through `data`: a drop target for agents dragged from the people
 * palette (the box adds a member, the lead row makes the lead; `onDropAgent(unit, agent, as)`), a keeper badge with
 * the next wake on each person (`keepers`: { agent: text }), the number of problems the live checks found, and the
 * read-only overlays of the Chart tab (`overlay`: { health, healthTone, lines[] }).
 */
function CanvasUnitNode({ data, selected }) {
  const { t } = useTranslation();
  const [over, setOver] = useState('');
  const u = data.unit;
  const drop = data.onDropAgent;
  const keepers = data.keepers || {};
  const cls = ['studio-canvas-unit', !u.parent && 'is-root', selected && 'is-selected', data.connecting && 'is-connecting', data.target && 'is-target', over && 'is-drop-target'].filter(Boolean).join(' ');
  // Drag events from the palette carry the agent under AGENT_DRAG_TYPE; anything else is ignored.
  const dropProps = (as) =>
    drop
      ? {
          onDragOver: (e) => {
            if (!(e.dataTransfer?.types || []).includes(AGENT_DRAG_TYPE)) return;
            e.preventDefault();
            e.stopPropagation();
            setOver(as);
          },
          onDragLeave: () => setOver(''),
          onDrop: (e) => {
            const agent = draggedAgent(e.dataTransfer);
            setOver('');
            if (!agent) return;
            e.preventDefault();
            e.stopPropagation();
            drop(u.name, agent, as);
          }
        }
      : {};
  const badge = (name) =>
    keepers[name] ? (
      <span className="studio-canvas-tag is-keeper" data-keeper-badge={name}>
        {keepers[name]}
      </span>
    ) : null;
  return (
    <div className={cls} style={{ '--unit-header': `${data.header}px` }} {...dropProps('member')}>
      <Handle type="target" position={Position.Left} />
      <div className="studio-canvas-unit-head">
        <div className="studio-canvas-node-name" title={u.name}>
          {u.name}
        </div>
        <div className="studio-canvas-node-tags">
          {!u.parent && <span className="studio-canvas-tag is-entry">{t('components.studio.canvas.org.node.root')}</span>}
          {u.inDraft && <span className="studio-canvas-tag">{t('components.studio.graph.inDraft')}</span>}
          {data.connecting && <span className="studio-canvas-tag is-connecting">{t('components.studio.canvas.node.connecting')}</span>}
          {data.problems > 0 && (
            <span className="studio-canvas-tag is-problem" data-unit-problems={data.problems}>
              {t('components.orgDesigner.node.problems', { count: data.problems })}
            </span>
          )}
          {data.overlay?.health && <span className={`studio-canvas-tag is-health is-${data.overlay.healthTone || 'neutral'}`}>{data.overlay.health}</span>}
        </div>
        <ul className="studio-canvas-unit-people" data-unit-people={u.name}>
          <li className={`is-lead${over === 'lead' ? ' is-drop-target' : ''}`} title={u.lead || ''} data-lead-slot={u.name} {...(data.canLead ? dropProps('lead') : {})}>
            {u.lead ? t('components.studio.canvas.org.node.lead', { name: u.lead }) : t('components.studio.canvas.org.node.noLead')}
            {u.lead ? badge(u.lead) : null}
          </li>
          {u.members.map((m) => (
            <li key={m} title={m}>
              {m}
              {badge(m)}
            </li>
          ))}
        </ul>
        {(data.overlay?.lines || []).length > 0 && (
          <ul className="studio-canvas-unit-overlay" data-unit-overlay={u.name}>
            {data.overlay.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(CanvasUnitNode);
