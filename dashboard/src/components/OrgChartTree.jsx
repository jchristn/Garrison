import { useState } from 'react';
import { tip } from './Tooltip';
import { ReportHealthBadge } from './ReportBadges';
import { SpendBar } from './OrganizationBadges';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from './Icons';
import { agentText, appText, childrenByParent, mandateText, spendOf } from '../utils/organizations';

/**
 * One unit of the chart: its name, the lead with title and mandate, the members, peer lines, health from the latest
 * report filed in the unit, spend bars for its budgets, and (when editable) Edit, Add unit below, and Remove. Peer
 * lines are named; pointing at one highlights the peer's card.
 */
function UnitCard({ unit, ctx, childCount, expanded, onToggle }) {
  const { t, lng, names, spend, health, editable, onEdit, onAdd, onRemove, onCancelAll, cancelAllDenied, highlight, setHighlight, unitNames } = ctx;
  const report = health?.[unit.id];
  const rows = spendOf(spend, unit.id);
  const lead = agentText(unit.leadAgentId, unit.leadAgentName, names);
  const leadMandate = mandateText(unit.leadMandateId, unit.leadMandateName, names);
  const lit = highlight === unit.id;
  return (
    <article className={`org-unit-card ${lit ? 'org-unit-card-lit' : ''}`} data-testid="org-unit" data-unit={unit.name} aria-label={unit.name}>
      <header className="org-unit-head">
        {childCount > 0 ? (
          <button
            type="button"
            className="icon-button org-unit-toggle"
            aria-expanded={expanded}
            aria-label={t(expanded ? 'organizations.chart.collapse' : 'organizations.chart.expand', { name: unit.name })}
            onClick={onToggle}
            data-testid="org-unit-toggle"
            {...tip(t('tips.organizations.chart.toggle'))}
          >
            {expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
          </button>
        ) : null}
        <h3 className="org-unit-name">{unit.name}</h3>
        {report ? <ReportHealthBadge health={report.health} t={t} /> : null}
      </header>
      {unit.description ? <p className="org-unit-description">{unit.description}</p> : null}
      <dl className="org-unit-facts">
        <div className="org-unit-fact">
          <dt {...tip(t('tips.organizations.chart.lead'))}>{t('organizations.chart.lead')}</dt>
          <dd data-testid="org-unit-lead">
            {lead ? (
              <>
                <strong>{lead}</strong>
                {unit.leadTitle ? <span className="text-muted">{` ${unit.leadTitle}`}</span> : null}
                {leadMandate ? <span className="org-unit-mandate" {...tip(unit.leadMandateSummary || t('tips.organizations.chart.mandate'))}>{leadMandate}</span> : null}
              </>
            ) : (
              <span className="text-muted">{t('organizations.chart.noLead')}</span>
            )}
          </dd>
        </div>
        {(unit.members || []).length > 0 && (
          <div className="org-unit-fact">
            <dt {...tip(t('tips.organizations.chart.members'))}>{t('organizations.chart.members', { count: unit.members.length })}</dt>
            <dd>
              <ul className="org-unit-members" data-testid="org-unit-members">
                {unit.members.map((m) => (
                  <li key={m.agentId}>
                    <span>{agentText(m.agentId, m.agentName, names)}</span>
                    {m.title ? <span className="text-muted">{` ${m.title}`}</span> : null}
                    {m.mandateId ? <span className="org-unit-mandate" {...tip(m.mandateSummary || t('tips.organizations.chart.mandate'))}>{mandateText(m.mandateId, m.mandateName, names)}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {(unit.peerLines || []).length > 0 && (
          <div className="org-unit-fact">
            <dt {...tip(t('tips.organizations.chart.peers'))}>{t('organizations.chart.peers')}</dt>
            <dd className="org-unit-peers" data-testid="org-unit-peers">
              {unit.peerLines.map((p) => (
                <button
                  key={p.peerUnitId}
                  type="button"
                  className="org-peer-chip"
                  onMouseEnter={() => setHighlight(p.peerUnitId)}
                  onMouseLeave={() => setHighlight(null)}
                  onFocus={() => setHighlight(p.peerUnitId)}
                  onBlur={() => setHighlight(null)}
                  {...tip(t('tips.organizations.chart.peer'))}
                >
                  <span aria-hidden="true">{'↔ '}</span>
                  {p.peerUnitName || unitNames[p.peerUnitId] || p.peerUnitId}
                </button>
              ))}
            </dd>
          </div>
        )}
        {unit.appId ? (
          <div className="org-unit-fact">
            <dt {...tip(t('tips.organizations.chart.app'))}>{t('organizations.chart.app')}</dt>
            <dd>{appText(unit.appId, names)}</dd>
          </div>
        ) : null}
      </dl>
      {rows.length > 0 && (
        <div className="org-unit-spend">
          {rows.map((r) => (
            <SpendBar key={r.period} row={r} t={t} lng={lng} testId="org-unit-spend" />
          ))}
        </div>
      )}
      {(editable || onCancelAll) && (
        <div className="org-unit-actions">
          {editable && (
            <>
              <button type="button" className="button-ghost button-sm" onClick={() => onEdit(unit)} data-testid="org-unit-edit" {...tip(t('tips.organizations.chart.edit'))}>
                {t('common.actions.edit')}
              </button>
              <button type="button" className="button-ghost button-sm" onClick={() => onAdd(unit)} data-testid="org-unit-add-child" {...tip(t('tips.organizations.chart.addChild'))}>
                <PlusIcon size={14} /> {t('organizations.chart.addChild')}
              </button>
              <button type="button" className="button-ghost button-sm" onClick={() => onRemove(unit)} data-testid="org-unit-remove" {...tip(t('tips.organizations.chart.remove'))}>
                <TrashIcon size={14} /> {t('common.actions.remove')}
              </button>
            </>
          )}
          {onCancelAll && (
            <button
              type="button"
              className="button-ghost button-sm org-unit-cancel-all"
              aria-disabled={cancelAllDenied ? 'true' : undefined}
              onClick={() => !cancelAllDenied && onCancelAll(unit)}
              data-testid="org-unit-cancel-all"
              {...tip(cancelAllDenied || t('tips.cascadeCancel.action'))}
            >
              {t('cascadeCancel.action')}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function Branch({ units, map, ctx, collapsed, toggle }) {
  return (
    <ul className="org-tree-level">
      {units.map((u) => {
        const kids = map.get(u.id) || [];
        const expanded = !collapsed.has(u.id);
        return (
          <li key={u.id} className="org-tree-node">
            <UnitCard unit={u} ctx={ctx} childCount={kids.length} expanded={expanded} onToggle={() => toggle(u.id)} />
            {kids.length > 0 && expanded && <Branch units={kids} map={map} ctx={ctx} collapsed={collapsed} toggle={toggle} />}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The organization chart (AA7.14): the tree of units, root first, each unit's children nested below it with a line to
 * its parent. Branches collapse and expand. Drawn as nested lists so it reflows to one column on a phone.
 * units: the working-tree shape (see chartToUnits for the live chart). names: { agents, mandates, apps } lookups.
 * spend: rows from GET /spend. health: { [unitId]: latest report }. onCancelAll(unit), when given, adds "Cancel everything
 * in this unit" to every card (AA11.4); cancelAllDenied is the tooltip that disables it when the caller may not.
 */
export default function OrgChartTree({ units, t, lng, names = {}, spend = [], health = {}, editable = false, onEdit, onAdd, onRemove, onCancelAll, cancelAllDenied = '' }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [highlight, setHighlight] = useState(null);
  const list = Array.isArray(units) ? units : [];
  const map = childrenByParent(list);
  const unitNames = Object.fromEntries(list.map((u) => [u.id, u.name]));
  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ctx = { t, lng, names, spend, health, editable, onEdit, onAdd, onRemove, onCancelAll, cancelAllDenied, highlight, setHighlight, unitNames };
  return (
    <div className="org-tree" data-testid="org-chart">
      <Branch units={map.get(null) || []} map={map} ctx={ctx} collapsed={collapsed} toggle={toggle} />
    </div>
  );
}
