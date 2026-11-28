import { useState } from 'react';
import { tip } from './Tooltip';
import ActionMenu from './ActionMenu';
import { ReportHealthBadge } from './ReportBadges';
import { SpendBar } from './OrganizationBadges';
import { Badge } from './StatusBadge';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from './Icons';

/** More units than this open with every unit below the first level collapsed (UXP1-V002). */
export const TREE_COLLAPSE_ABOVE_UNITS = 12;
/** Units listed at one level before "Show more" (UXP1-V002). */
export const TREE_PAGE_SIZE = 25;

/** The units collapsed when the chart opens: those from depth 1 down with units below them, in a large chart. */
export function defaultTreeCollapsed(units) {
  const list = Array.isArray(units) ? units : [];
  if (list.length <= TREE_COLLAPSE_ABOVE_UNITS) return new Set();
  const map = childrenByParent(list);
  const out = new Set();
  const walk = (parent, depth) => {
    for (const u of map.get(parent) || []) {
      if (depth >= 1 && (map.get(u.id) || []).length) out.add(u.id);
      if (depth < 64) walk(u.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
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
        {report?.health ? <ReportHealthBadge health={report.health} t={t} /> : null}
        {report?.attention?.needs ? (
          <span data-testid="org-unit-needs-person">
            <Badge tone="warning" tip={t('tips.board.chart.needsPerson')}>
              {t('board.chart.needsPerson')}
            </Badge>
          </span>
        ) : null}
        {!expanded && childCount > 0 ? <span className="text-muted org-unit-below">{t('organizations.chart.below', { count: childCount })}</span> : null}
        {onCancelAll ? (
          <span className="org-unit-menu">
            <ActionMenu
              label={unit.name}
              testId="org-unit-menu"
              items={[{ label: t('cascadeCancel.action'), tip: cancelAllDenied || t('tips.cascadeCancel.action'), disabled: !!cancelAllDenied, danger: true, testId: 'org-unit-cancel-all', onClick: () => onCancelAll(unit) }]}
            />
          </span>
        ) : null}
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
                {leadMandate ? <span className="org-unit-mandate" data-tour="org-card-keeper" {...tip(unit.leadMandateSummary || t('tips.organizations.chart.mandate'))}>{leadMandate}</span> : null}
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
                    {m.mandateId ? <span className="org-unit-mandate" data-tour="org-card-keeper" {...tip(m.mandateSummary || t('tips.organizations.chart.mandate'))}>{mandateText(m.mandateId, m.mandateName, names)}</span> : null}
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
        <div className="org-unit-spend" data-tour="org-card-budget">
          {rows.map((r) => (
            <SpendBar key={r.period} row={r} t={t} lng={lng} testId="org-unit-spend" />
          ))}
        </div>
      )}
      {editable && (
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
        </div>
      )}
    </article>
  );
}

function Branch({ units, map, ctx, collapsed, toggle, depth, parentId }) {
  const { t, shown, showMore } = ctx;
  const limit = shown[parentId ?? ''] || TREE_PAGE_SIZE;
  const visible = units.slice(0, limit);
  const rest = units.length - visible.length;
  return (
    <ul className={`org-tree-level${depth >= 3 ? ' is-deep' : ''}`}>
      {visible.map((u) => {
        const kids = map.get(u.id) || [];
        const expanded = !collapsed.has(u.id);
        return (
          <li key={u.id} className="org-tree-node">
            <UnitCard unit={u} ctx={ctx} childCount={kids.length} expanded={expanded} onToggle={() => toggle(u.id)} />
            {kids.length > 0 && expanded && <Branch units={kids} map={map} ctx={ctx} collapsed={collapsed} toggle={toggle} depth={depth + 1} parentId={u.id} />}
          </li>
        );
      })}
      {rest > 0 && (
        <li className="org-tree-more">
          <button type="button" className="button-secondary button-sm" onClick={() => showMore(parentId ?? '', limit + TREE_PAGE_SIZE)} data-testid="org-tree-more" {...tip(t('tips.organizations.chart.showMore'))}>
            {t('organizations.chart.showMore', { count: Math.min(rest, TREE_PAGE_SIZE), total: rest })}
          </button>
        </li>
      )}
    </ul>
  );
}

/**
 * The organization chart (AA7.14): the tree of units, root first, each unit's children nested below it with a line to
 * its parent. Branches collapse and expand. Drawn as nested lists so it reflows to one column on a phone.
 * units: the working-tree shape (see chartToUnits for the live chart). names: { agents, mandates, apps } lookups.
 * spend: rows from GET /spend. health: { [unitId]: latest report }, where a board entry may carry `attention`
 * (utils/board unitAttention) to add Needs a person. onCancelAll(unit), when given, adds "Cancel everything in this unit"
 * to every card's menu (AA11.4); cancelAllDenied is the tooltip that disables it when the caller may not.
 *
 * UXP1-V002: a chart of more than TREE_COLLAPSE_ABOVE_UNITS units opens collapsed below the first level, each level
 * lists TREE_PAGE_SIZE units before Show more, Expand all and Collapse sit above the tree, and the indent stops growing
 * after three levels.
 */
export default function OrgChartTree({ units, t, lng, names = {}, spend = [], health = {}, editable = false, onEdit, onAdd, onRemove, onCancelAll, cancelAllDenied = '' }) {
  const [collapsed, setCollapsed] = useState(() => defaultTreeCollapsed(units));
  const [shown, setShown] = useState({});
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
  const showMore = (parent, count) => setShown((prev) => ({ ...prev, [parent]: count }));
  const ctx = { t, lng, names, spend, health, editable, onEdit, onAdd, onRemove, onCancelAll, cancelAllDenied, highlight, setHighlight, unitNames, shown, showMore };
  const nested = list.some((u) => (map.get(u.id) || []).length > 0);
  return (
    <div className="org-tree" data-testid="org-chart">
      {nested && (
        <div className="org-tree-tools" role="group" aria-label={t('organizations.chart.toolsLabel')}>
          <button type="button" className="button-secondary button-sm" onClick={() => setCollapsed(new Set())} aria-disabled={collapsed.size ? undefined : 'true'} data-testid="org-tree-expand-all" {...tip(t('tips.organizations.chart.expandAll'))}>
            {t('organizations.chart.expandAll')}
          </button>
          <button
            type="button"
            className="button-secondary button-sm"
            onClick={() => setCollapsed(new Set(list.filter((u) => u.parentUnitId && (map.get(u.id) || []).length).map((u) => u.id)))}
            data-testid="org-tree-collapse-all"
            {...tip(t('tips.organizations.chart.collapseAll'))}
          >
            {t('organizations.chart.collapseAll')}
          </button>
        </div>
      )}
      <Branch units={map.get(null) || []} map={map} ctx={ctx} collapsed={collapsed} toggle={toggle} depth={0} parentId={null} />
    </div>
  );
}
