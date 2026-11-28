// Organizations (AA7.14): helpers shared by the Organizations page, the organization page, its chart, the unit editor,
// and the revision diff. Names, titles, and missions are data people and agents wrote; nothing here turns them into
// markup.

import { ENUMS, ORGANIZATION_LIMITS } from './constants';
import { enumLabel } from './enums';
import { holds } from './apps';
import { errorMessage } from './errors';
import { stripCodePrefix } from './serverText';

/** 409 codes the organization routes answer with, each explained under organizations.errors.<code>. */
export const ORG_ERROR_CODES = [
  'OneRoot',
  'ParentNotFound',
  'Cycle',
  'UnitNameTaken',
  'LeadsTwoUnits',
  'PositionTaken',
  'PeerNotFound',
  'BudgetPeriodTaken',
  'BudgetInvalid',
  'BudgetExceedsParent',
  'TooManyUnits',
  'TooManyMembers',
  'TooManyPeerLines',
  'UnitHasChildren',
  'OrganizationRetired',
  'AgentInactive',
  'MandateMismatch',
  'RevisionMismatch',
  'RevisionPublished',
  'RevisionNeverPublished',
  'AlreadyLive',
  'NothingToRollBack',
  'StatusNotSettable',
  'NameConflict'
];

/** The fields the revision diff compares, in display order. */
export const ORG_DIFF_FIELDS = ['name', 'description', 'parent', 'lead', 'leadTitle', 'leadMandate', 'app', 'members', 'peers', 'budgets'];

/**
 * A readable message for an organization error: the explanation of a known 409 code followed by the server's own
 * detail (which names the unit or agent), else the shared error text.
 */
export function orgErrorMessage(t, err) {
  const code = err?.code;
  if (code && ORG_ERROR_CODES.includes(code)) {
    const known = t(`organizations.errors.${code}`);
    const body = err.body && typeof err.body === 'object' ? err.body.message : null;
    const detail = typeof body === 'string' ? stripCodePrefix(body, code).trim() : '';
    return detail && detail !== known ? `${known} ${detail}` : known;
  }
  return errorMessage(t, err);
}

/** The reason an action is denied without `operation` on Organization, or '' when the caller holds it. */
export function orgDenied(t, permissions, operation) {
  if (holds(permissions, 'Organization', operation)) return '';
  return t('tips.organizations.denied', { operation: enumLabel(t, 'operationType', operation) });
}

/** Units in chart order: each root, then its subtree depth first, siblings in the order given. */
export function treeOrder(units) {
  const list = Array.isArray(units) ? units : [];
  const ids = new Set(list.map((u) => u.id));
  const children = new Map();
  for (const u of list) {
    const parent = u.parentUnitId && ids.has(u.parentUnitId) ? u.parentUnitId : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(u);
  }
  const out = [];
  const seen = new Set();
  const walk = (parent, depth) => {
    for (const u of children.get(parent) || []) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      out.push({ unit: u, depth });
      walk(u.id, depth + 1);
    }
  };
  walk(null, 0);
  // Units on a cycle (never accepted by the server) still show, at the top level.
  for (const u of list) if (!seen.has(u.id)) out.push({ unit: u, depth: 0 });
  return out;
}

/** Child units of each unit ID (null holds the roots), in the order given. */
export function childrenByParent(units) {
  const list = Array.isArray(units) ? units : [];
  const ids = new Set(list.map((u) => u.id));
  const map = new Map();
  for (const u of list) {
    const parent = u.parentUnitId && ids.has(u.parentUnitId) ? u.parentUnitId : null;
    if (!map.has(parent)) map.set(parent, []);
    map.get(parent).push(u);
  }
  return map;
}

/** The unit IDs below a unit (not the unit itself). */
export function descendantIds(units, unitId) {
  const map = childrenByParent(units);
  const out = new Set();
  const walk = (id) => {
    for (const c of map.get(id) || []) {
      if (out.has(c.id)) continue;
      out.add(c.id);
      walk(c.id);
    }
  };
  walk(unitId);
  return out;
}

/** A unit's budget amount for a period, or null when it has none. */
export function budgetOf(unit, period) {
  const b = (unit?.budgets || []).find((x) => x.period === period);
  return b && b.amountUsd != null ? Number(b.amountUsd) : null;
}

/**
 * The working-tree shape (the one GET /organizations/{id} returns) of a chart from GET /chart, so the same chart
 * component draws either.
 */
export function chartToUnits(chart) {
  const units = chart?.units || [];
  const names = Object.fromEntries(units.map((u) => [u.id, u.name]));
  return units.map((u) => ({
    id: u.id,
    name: u.name,
    description: u.description || null,
    parentUnitId: u.parentUnitId || null,
    appId: u.appId || null,
    leadAgentId: u.lead?.agentId || null,
    leadAgentName: u.lead?.agentName || null,
    leadTitle: u.lead?.title || null,
    leadMandateId: u.lead?.mandateId || null,
    leadMandateName: u.lead?.mandateName || null,
    leadMandateSummary: u.lead?.mandateSummary || null,
    members: (u.members || []).map((m) => ({ agentId: m.agentId, agentName: m.agentName || null, title: m.title || null, mandateId: m.mandateId || null, mandateName: m.mandateName || null, mandateSummary: m.mandateSummary || null })),
    peerLines: (u.peerUnitIds || []).map((id) => ({ peerUnitId: id, peerUnitName: names[id] || null })),
    budgets: u.budgets || []
  }));
}

/** The name to show for an agent: the name the server attached, else the lookup, else the ID. */
export function agentText(id, name, names = {}) {
  if (!id) return '';
  return name || names.agents?.[id] || id;
}

/** The name to show for a mandate (keeper). */
export function mandateText(id, name, names = {}) {
  if (!id) return '';
  return name || names.mandates?.[id] || id;
}

/** The name to show for an app. */
export function appText(id, names = {}) {
  if (!id) return '';
  return names.apps?.[id] || id;
}

/** A blank unit form, below `parentUnitId` when given. */
export function blankUnit(parentUnitId = null) {
  return { name: '', description: '', parentUnitId: parentUnitId || null, leadAgentId: null, leadTitle: '', leadMandateId: null, appId: null, members: [], peerUnitIds: [], budgetDay: null, budgetMonth: null };
}

/** The editor form of a working-tree unit. */
export function unitToForm(unit) {
  if (!unit) return blankUnit();
  return {
    id: unit.id,
    name: unit.name || '',
    description: unit.description || '',
    parentUnitId: unit.parentUnitId || null,
    leadAgentId: unit.leadAgentId || null,
    leadTitle: unit.leadTitle || '',
    leadMandateId: unit.leadMandateId || null,
    appId: unit.appId || null,
    members: (unit.members || []).map((m) => ({ agentId: m.agentId || '', title: m.title || '', mandateId: m.mandateId || '' })),
    peerUnitIds: (unit.peerLines || []).map((p) => p.peerUnitId).filter(Boolean),
    budgetDay: budgetOf(unit, 'Day'),
    budgetMonth: budgetOf(unit, 'Month')
  };
}

const text = (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
};

/** The request body of a unit form (POST or PUT /units). */
export function unitFormToBody(form) {
  const budgets = [];
  if (form.budgetDay != null && form.budgetDay !== '') budgets.push({ period: 'Day', amountUsd: Number(form.budgetDay) });
  if (form.budgetMonth != null && form.budgetMonth !== '') budgets.push({ period: 'Month', amountUsd: Number(form.budgetMonth) });
  return {
    name: (form.name || '').trim(),
    description: text(form.description),
    parentUnitId: form.parentUnitId || null,
    leadAgentId: form.leadAgentId || null,
    leadTitle: form.leadAgentId ? text(form.leadTitle) : null,
    leadMandateId: form.leadAgentId ? form.leadMandateId || null : null,
    appId: form.appId || null,
    members: (form.members || []).filter((m) => m && m.agentId).map((m) => ({ agentId: m.agentId, title: text(m.title), mandateId: m.mandateId || null })),
    peerLines: (form.peerUnitIds || []).filter(Boolean).map((id) => ({ peerUnitId: id })),
    budgets
  };
}

/**
 * Field errors the dashboard can catch before the server does: a name of 1 to 128 characters, titles of at most 128, an
 * agent for every member row, one position per agent in the unit, and positive budgets. Tree rules (one root, no
 * cycles, an agent leads one unit, child budgets within the parent's) stay with the server, which answers 409.
 */
export function unitFormErrors(form, t) {
  const errors = {};
  const L = ORGANIZATION_LIMITS;
  const name = (form?.name || '').trim();
  if (!name || name.length > L.nameMax) errors.name = t('organizations.unit.errors.name', { max: L.nameMax });
  if ((form?.description || '').length > L.descriptionMax) errors.description = t('organizations.unit.errors.description', { max: L.descriptionMax });
  if ((form?.leadTitle || '').trim().length > L.titleMax) errors.leadTitle = t('organizations.unit.errors.title', { max: L.titleMax });
  const members = form?.members || [];
  if (members.some((m) => !m?.agentId)) errors.members = t('organizations.unit.errors.memberAgent');
  else if (members.some((m) => (m.title || '').trim().length > L.titleMax)) errors.members = t('organizations.unit.errors.title', { max: L.titleMax });
  else {
    const agents = members.map((m) => m.agentId).concat(form?.leadAgentId ? [form.leadAgentId] : []);
    if (new Set(agents).size !== agents.length) errors.members = t('organizations.unit.errors.duplicateAgent');
  }
  for (const [key, value] of [['budgetDay', form?.budgetDay], ['budgetMonth', form?.budgetMonth]]) {
    if (value != null && value !== '' && !(Number(value) > 0)) errors[key] = t('organizations.unit.errors.budget');
  }
  return errors;
}

const sorted = (list) => [...list].sort((a, b) => a.localeCompare(b));

/**
 * The comparable form of a unit for the revision diff: every field as text, with agents, mandates, apps, parents, and
 * peers named. `unitNames` maps unit IDs to names within the same tree.
 */
export function unitFacts(unit, unitNames = {}, names = {}) {
  const usd = (v) => (v == null ? '' : Number(v).toFixed(2));
  const member = (m) => {
    const who = agentText(m.agentId, m.agentName, names);
    const parts = [who];
    if (m.title) parts.push(`(${m.title})`);
    if (m.mandateId) parts.push(`[${mandateText(m.mandateId, m.mandateName, names)}]`);
    return parts.join(' ');
  };
  return {
    name: unit.name || '',
    description: unit.description || '',
    parent: unit.parentUnitId ? unitNames[unit.parentUnitId] || unit.parentUnitId : '',
    lead: agentText(unit.leadAgentId, unit.leadAgentName, names),
    leadTitle: unit.leadTitle || '',
    leadMandate: mandateText(unit.leadMandateId, unit.leadMandateName, names),
    app: appText(unit.appId, names),
    members: sorted((unit.members || []).map(member)).join(', '),
    peers: sorted((unit.peerLines || []).map((p) => p.peerUnitName || unitNames[p.peerUnitId] || p.peerUnitId)).join(', '),
    budgets: ENUMS.budgetPeriod
      .map((period) => {
        const amount = budgetOf(unit, period);
        return amount == null ? null : `${period} ${usd(amount)}`;
      })
      .filter(Boolean)
      .join(', ')
  };
}

/**
 * Compare two sets of units (a revision snapshot against the live one, or the working tree against live). Units match
 * by ID, which snapshots keep, and then by name. Answers { added, addedUnits, removed, changed, unchanged }: added and
 * removed list unit names; addedUnits lists { name, fields: [{ field, after }] } with each added unit's non-empty facts
 * (UXP1-S025); changed lists { id, name, fields: [{ field, before, after }] } with fields in ORG_DIFF_FIELDS order.
 */
export function diffOrgUnits(before, after, names = {}) {
  const a = Array.isArray(before) ? before : [];
  const b = Array.isArray(after) ? after : [];
  const namesOf = (list) => Object.fromEntries(list.map((u) => [u.id, u.name]));
  const beforeNames = namesOf(a);
  const afterNames = namesOf(b);
  const matched = new Set();
  const changed = [];
  const added = [];
  const addedUnits = [];
  let unchanged = 0;
  for (const unit of b) {
    const old = a.find((u) => !matched.has(u) && u.id && u.id === unit.id) || a.find((u) => !matched.has(u) && u.name === unit.name);
    if (!old) {
      added.push(unit.name);
      // UXP1-S025: what an added unit brings with it (lead, members, keepers, budgets), not only its name.
      const facts = unitFacts(unit, afterNames, names);
      addedUnits.push({ name: unit.name, fields: ORG_DIFF_FIELDS.filter((f) => f !== 'name' && facts[f]).map((f) => ({ field: f, after: facts[f] })) });
      continue;
    }
    matched.add(old);
    const x = unitFacts(old, beforeNames, names);
    const y = unitFacts(unit, afterNames, names);
    const fields = ORG_DIFF_FIELDS.filter((f) => x[f] !== y[f]).map((f) => ({ field: f, before: x[f], after: y[f] }));
    if (fields.length) changed.push({ id: unit.id, name: unit.name, fields });
    else unchanged += 1;
  }
  const removed = a.filter((u) => !matched.has(u)).map((u) => u.name);
  return { added, addedUnits, removed, changed, unchanged };
}

/** True when a diff found nothing added, removed, or changed. */
export function diffIsEmpty(diff) {
  return !diff || (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0);
}

/** Spend rows of one unit from GET /spend, Day before Month. */
export function spendOf(spend, unitId) {
  return (Array.isArray(spend) ? spend : []).filter((s) => s.unitId === unitId).sort((x, y) => ENUMS.budgetPeriod.indexOf(x.period) - ENUMS.budgetPeriod.indexOf(y.period));
}

/** The share of a budget spent, 0 to 1 (capped), or null without a budget. */
export function spendFraction(row) {
  if (!row) return null;
  if (row.fraction != null) return Math.max(0, Math.min(1, Number(row.fraction)));
  if (!row.amountUsd) return null;
  return Math.max(0, Math.min(1, Number(row.spentUsd || 0) / Number(row.amountUsd)));
}

/** Tone of a spend bar: danger when exhausted, warning from 80 percent, success below. */
export function spendTone(row) {
  if (row?.exhausted) return 'danger';
  const f = spendFraction(row);
  if (f == null) return 'neutral';
  return f >= 0.8 ? 'warning' : 'success';
}

/** The organization form of the list page and the Edit details dialog. */
export function organizationToForm(org) {
  return { id: org?.id, name: org?.name || '', description: org?.description || '', mission: org?.mission || '', budgetFreezeMarginPercent: org?.budgetFreezeMarginPercent ?? ORGANIZATION_LIMITS.budgetFreezeMargin.default };
}

/** The budget freeze margin (AA11.5) of a form or record as a number, the default 10 when empty. */
export function freezeMargin(value) {
  if (value === null || value === undefined || String(value).trim() === '') return ORGANIZATION_LIMITS.budgetFreezeMargin.default;
  return Number(value);
}

/** The PUT body that keeps an organization's text and changes only its status. */
export function statusBody(org, status) {
  return { name: org.name, description: org.description || null, mission: org.mission || null, budgetFreezeMarginPercent: freezeMargin(org.budgetFreezeMarginPercent), status };
}

/** The request body of an organization form. */
export function organizationFormToBody(form) {
  return { name: (form.name || '').trim(), description: text(form.description), mission: text(form.mission), budgetFreezeMarginPercent: freezeMargin(form.budgetFreezeMarginPercent) };
}

/**
 * Field errors of an organization form: a name of 1 to 128 characters, a description and mission within bounds, and a
 * budget freeze margin that is a whole number from 0 to 100.
 */
export function organizationFormErrors(form, t) {
  const errors = {};
  const L = ORGANIZATION_LIMITS;
  const name = (form?.name || '').trim();
  if (!name || name.length > L.nameMax) errors.name = t('organizations.form.errors.name', { max: L.nameMax });
  if ((form?.description || '').length > L.descriptionMax) errors.description = t('organizations.form.errors.text', { max: L.descriptionMax });
  if ((form?.mission || '').length > L.missionMax) errors.mission = t('organizations.form.errors.text', { max: L.missionMax });
  const margin = freezeMargin(form?.budgetFreezeMarginPercent);
  if (!Number.isInteger(margin) || margin < L.budgetFreezeMargin.min || margin > L.budgetFreezeMargin.max) errors.budgetFreezeMarginPercent = t('organizations.form.errors.margin', L.budgetFreezeMargin);
  return errors;
}
