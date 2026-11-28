import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../Tooltip';
import { EmptyNote } from '../States';
import { PlusIcon } from '../Icons';
import { deniedProps } from '../../utils/permissions';
import { AGENT_DRAG_TYPE } from '../../utils/orgCanvasSource';

/**
 * The people palette of the organization designer (LP3.3): a searchable list of the tenant's agents, each showing the
 * unit it already sits in. Drag an agent onto a unit box to add it as a member, or onto the box's lead row to make it
 * the lead. The keyboard does the same: pick an agent (Enter or Space), then pick a unit and a position in the bar that
 * opens, or focus a unit on the canvas and press Enter (member) or L (lead). New agent opens the agent form; the new
 * agent joins the selected unit (or the one picked in the bar).
 *
 * choices: agent names. placed: { agent: unit }. picked: the picked agent or ''. canLead: whether the source can set a
 * lead. blocked: the reason editing is off, or ''. onPlace({ agent, unit, as }) answers a promise.
 */
export default function OrgPeoplePalette({ choices = [], placed = {}, units = [], defaultUnit = '', picked = '', canLead = false, blocked = '', onPick, onPlace, onNewAgent, idPrefix = 'org-palette' }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState('');
  const [as, setAs] = useState('member');
  const needle = search.trim().toLowerCase();
  const shown = choices.filter((c) => !needle || c.toLowerCase().includes(needle));
  const target = units.includes(unit) ? unit : units.includes(defaultUnit) ? defaultUnit : units[0] || '';
  const position = canLead ? as : 'member';

  const place = async () => {
    if (blocked || !picked || !target) return;
    const done = await onPlace({ agent: picked, unit: target, as: position });
    if (done) onPick('');
  };

  return (
    <section className="org-palette" aria-labelledby={`${idPrefix}-title`} data-testid="org-palette" data-tour="org-palette">
      <div className="org-palette-head">
        <h4 id={`${idPrefix}-title`} className="section-title" {...tip(t('tips.orgDesigner.palette.title'))}>
          {t('components.orgDesigner.palette.title')}
        </h4>
        {onNewAgent && (
          <button
            type="button"
            className="button-ghost button-sm"
            onClick={() => !blocked && onNewAgent(target)}
            data-testid="org-palette-new-agent"
            {...deniedProps(blocked)}
            {...tip(blocked || t('tips.orgDesigner.palette.newAgent'))}
          >
            <PlusIcon size={14} /> {t('components.orgDesigner.palette.newAgent')}
          </button>
        )}
      </div>
      <label htmlFor={`${idPrefix}-search`} className="sr-only" {...tip(t('tips.orgDesigner.palette.search'))}>
        {t('components.orgDesigner.palette.search')}
      </label>
      <input
        id={`${idPrefix}-search`}
        type="search"
        value={search}
        placeholder={t('components.orgDesigner.palette.search')}
        autoComplete="off"
        onChange={(e) => setSearch(e.target.value)}
        data-testid="org-palette-search"
        {...tip(t('tips.orgDesigner.palette.search'))}
      />
      <p className="field-hint">{t('components.orgDesigner.palette.hint')}</p>
      {shown.length === 0 ? (
        <EmptyNote data-testid="org-palette-empty">{choices.length ? t('components.orgDesigner.palette.noMatch') : t('components.orgDesigner.palette.none')}</EmptyNote>
      ) : (
        <ul className="org-palette-list" aria-label={t('components.orgDesigner.palette.title')}>
          {shown.map((name) => {
            const on = picked === name;
            return (
              <li key={name}>
                <button
                  type="button"
                  className={`org-palette-agent${on ? ' is-picked' : ''}`}
                  aria-pressed={on}
                  draggable={!blocked}
                  onDragStart={(e) => {
                    if (blocked) return;
                    e.dataTransfer.setData(AGENT_DRAG_TYPE, name);
                    e.dataTransfer.setData('text/plain', name);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => !blocked && onPick(on ? '' : name)}
                  data-palette-agent={name}
                  {...deniedProps(blocked)}
                  {...tip(blocked || t('tips.orgDesigner.palette.agent'))}
                >
                  <span className="org-palette-name">{name}</span>
                  {placed[name] ? <span className="text-muted org-palette-where">{t('components.orgDesigner.palette.inUnit', { unit: placed[name] })}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {picked && (
        <div className="info-banner org-palette-place" data-testid="org-palette-place">
          <span role="status">{t('components.orgDesigner.palette.placing', { name: picked })}</span>
          <label htmlFor={`${idPrefix}-unit`} {...tip(t('tips.orgDesigner.palette.unit'))}>
            {t('components.orgDesigner.palette.unit')}
          </label>
          <select id={`${idPrefix}-unit`} value={target} onChange={(e) => setUnit(e.target.value)} data-testid="org-palette-unit" {...tip(t('tips.orgDesigner.palette.unit'))}>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <label htmlFor={`${idPrefix}-as`} {...tip(t('tips.orgDesigner.palette.as'))}>
            {t('components.orgDesigner.palette.as')}
          </label>
          <select id={`${idPrefix}-as`} value={position} onChange={(e) => setAs(e.target.value)} data-testid="org-palette-as" {...tip(canLead ? t('tips.orgDesigner.palette.as') : t('tips.orgDesigner.palette.leadOff'))}>
            <option value="member">{t('components.orgDesigner.palette.asMember')}</option>
            {canLead && <option value="lead">{t('components.orgDesigner.palette.asLead')}</option>}
          </select>
          <button type="button" className="button-primary button-sm" onClick={place} data-testid="org-palette-confirm" {...deniedProps(target ? '' : 'none')} {...tip(t('tips.orgDesigner.palette.place'))}>
            {t('components.orgDesigner.palette.place')}
          </button>
          <button type="button" className="button-ghost button-sm" onClick={() => onPick('')} data-testid="org-palette-cancel" {...tip(t('tips.orgDesigner.palette.cancel'))}>
            {t('common.actions.cancel')}
          </button>
        </div>
      )}
    </section>
  );
}
