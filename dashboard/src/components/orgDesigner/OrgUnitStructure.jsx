import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../Tooltip';
import { deniedProps } from '../../utils/permissions';

/** Names of the units below `name` in the flow (not the unit itself). */
export function unitsBelow(flow, name) {
  const byName = new Map((flow?.units || []).map((u) => [u.name, u]));
  const out = new Set();
  const walk = (n) => {
    for (const c of byName.get(n)?.children || []) {
      if (out.has(c)) continue;
      out.add(c);
      walk(c);
    }
  };
  walk(name);
  return out;
}

/**
 * Lead and reporting line of a unit in the designer (LP3.2): change the lead (agent and title) and move the unit under
 * another parent. Only for sources that support them (the working tree); a draft changes them in the Organization item.
 * A unit cannot move under itself or one of its own children, so those are left out.
 */
export default function OrgUnitStructure({ flow, unit, choices = [], canLead = false, canMove = false, blocked = '', onSetLead, onMove }) {
  const { t } = useTranslation();
  const [lead, setLead] = useState(unit.lead || '');
  const [title, setTitle] = useState(unit.leadTitle || '');
  const below = unitsBelow(flow, unit.name);
  const parents = (flow?.units || []).map((u) => u.name).filter((n) => n !== unit.name && !below.has(n));
  const [parent, setParent] = useState(unit.parent || '');
  const listId = `org-structure-agents-${unit.name}`;
  if (!canLead && !canMove) return null;
  return (
    <div className="org-structure" data-testid="org-structure">
      {canLead && (
        <div className="studio-canvas-row">
          <label htmlFor="org-structure-lead" {...tip(t('tips.orgDesigner.structure.lead'))}>
            {t('components.orgDesigner.structure.lead')}
          </label>
          <input
            id="org-structure-lead"
            list={listId}
            value={lead}
            readOnly={!!blocked}
            autoComplete="off"
            placeholder={t('components.studio.canvas.org.toolbar.leadPlaceholder')}
            onChange={(e) => setLead(e.target.value)}
            data-testid="org-structure-lead"
            {...tip(blocked || t('tips.orgDesigner.structure.lead'))}
          />
          <datalist id={listId}>
            {choices.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <label htmlFor="org-structure-title" className="sr-only" {...tip(t('tips.orgDesigner.structure.title'))}>
            {t('components.orgDesigner.structure.title')}
          </label>
          <input id="org-structure-title" value={title} readOnly={!!blocked} placeholder={t('components.orgDesigner.structure.title')} onChange={(e) => setTitle(e.target.value)} data-testid="org-structure-title" {...tip(blocked || t('tips.orgDesigner.structure.title'))} />
          <button type="button" className="button-secondary button-sm" onClick={() => !blocked && onSetLead(lead.trim(), title.trim())} data-testid="org-structure-set-lead" {...deniedProps(blocked)} {...tip(blocked || t('tips.orgDesigner.structure.setLead'))}>
            {t('components.orgDesigner.structure.setLead')}
          </button>
        </div>
      )}
      {canMove && (
        <div className="studio-canvas-row">
          <label htmlFor="org-structure-parent" {...tip(t('tips.orgDesigner.structure.parent'))}>
            {t('components.orgDesigner.structure.parent')}
          </label>
          <select id="org-structure-parent" value={parent} disabled={!!blocked} onChange={(e) => setParent(e.target.value)} data-testid="org-structure-parent" {...tip(t('tips.orgDesigner.structure.parent'))}>
            <option value="">{t('components.studio.canvas.org.toolbar.noParent')}</option>
            {parents.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button type="button" className="button-secondary button-sm" onClick={() => !blocked && parent !== (unit.parent || '') && onMove(parent)} data-testid="org-structure-move" {...deniedProps(blocked || (parent === (unit.parent || '') ? t('tips.orgDesigner.structure.sameParent') : ''))} {...tip(blocked || (parent === (unit.parent || '') ? t('tips.orgDesigner.structure.sameParent') : t('tips.orgDesigner.structure.move')))}>
            {t('components.orgDesigner.structure.move')}
          </button>
        </div>
      )}
    </div>
  );
}
