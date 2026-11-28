// The board of an organization (AA10): helpers for BoardView that need no React, so tests can call them directly.

/** Limits of the board forms, matching the server (AUTONOMOUS_AGENTS_PLAN.md AA10 contract). */
export const BOARD_LIMITS = {
  /** Direction text: 1 to 4000 characters. */
  directionMax: 4000,
  /** Direction change note: at most 2000 characters. */
  changeNoteMax: 1024,
  /** A message to the CEO: 1 to 32000 characters. */
  messageMax: 32000
};

/** Error codes the board routes answer with a readable translation (errorCodes.<code>). */
export const BOARD_ERROR_CODES = ['BoardCeoMissing', 'BoardCeoUnavailable'];

/** True when a proposal waits for a person (the board lists only these, but the decide result may differ). */
export function proposalPending(p) {
  return !!p && (p.status === 'PendingApproval' || p.approvalStatus === 'Pending');
}

/**
 * Health for OrgChartTree from the board's unitHealth: { [unitId]: { health, attention } }. Health is null when it is
 * Unknown (no report yet); a unit with neither a known health nor anything waiting for a person is left out, so its
 * card shows no badge. attention is unitAttention(h), which the card shows as Needs a person.
 */
export function healthMap(board) {
  const out = {};
  for (const h of board?.unitHealth || []) {
    if (!h?.unitId) continue;
    const attention = unitAttention(h);
    const known = h.health && h.health !== 'Unknown';
    if (known || attention.needs) out[h.unitId] = { id: h.lastReportId || null, health: known ? h.health : null, createdUtc: h.lastReportUtc || null, attention };
  }
  return out;
}

/** Units that hit a budget cap (overBudget), in chart order, each with its exhausted spend rows. */
export function capHits(board) {
  const spend = board?.spend || [];
  return (board?.unitHealth || [])
    .filter((h) => h.overBudget)
    .map((h) => ({ ...h, rows: spend.filter((r) => r.unitId === h.unitId && r.amountUsd != null && r.spentUsd >= r.amountUsd) }));
}

/** How many things wait for the board's attention: open escalations, unhealthy reports, and cap hits. */
export function attentionCount(board) {
  return (board?.escalations || []).length + (board?.unhealthyReports || []).length + capHits(board).length;
}

/** Spend rows grouped by unit in the order they arrive: [{ unitId, unitName, rows }]. */
export function spendByUnit(spend) {
  const groups = [];
  const index = new Map();
  for (const row of spend || []) {
    if (!index.has(row.unitId)) {
      index.set(row.unitId, groups.length);
      groups.push({ unitId: row.unitId, unitName: row.unitName || row.unitId, rows: [] });
    }
    groups[index.get(row.unitId)].rows.push(row);
  }
  return groups;
}

/** The active freeze on the whole organization, or null. */
export function organizationFreeze(board) {
  return (board?.freezes || []).find((f) => f.active !== false && f.targetKind === 'Organization' && f.targetId === board.organizationId) || null;
}

/** Field errors of the direction form, keyed like the server's (direction, changeNote). */
export function directionErrors(form, t) {
  const errors = {};
  const direction = (form?.direction || '').trim();
  if (!direction) errors.direction = t('board.direction.errors.required');
  else if (direction.length > BOARD_LIMITS.directionMax) errors.direction = t('board.direction.errors.tooLong', { max: BOARD_LIMITS.directionMax });
  if ((form?.changeNote || '').length > BOARD_LIMITS.changeNoteMax) errors.changeNote = t('board.direction.errors.tooLong', { max: BOARD_LIMITS.changeNoteMax });
  return errors;
}

/** The direction request body: trimmed text, and the note or null. */
export function directionBody(form) {
  const note = (form?.changeNote || '').trim();
  return { direction: (form?.direction || '').trim(), changeNote: note || null };
}

/** The message body for the CEO: the trimmed input, and the conversation to continue when there is one. */
export function messageBody(input, conversationId) {
  const body = { input: (input || '').trim() };
  if (conversationId) body.conversationId = conversationId;
  return body;
}

/** Why the CEO cannot be reached ('' when it can): no lead on the root unit, or a keeper without a deployment. */
export function ceoUnavailable(t, ceo) {
  if (!ceo) return t('board.ceo.missing');
  if (!ceo.mandateId) return t('board.ceo.noMandate');
  if (!ceo.deploymentId) return t('board.ceo.noDeployment');
  return '';
}

/**
 * What a unit's row on the board says needs a person (UXP1-S013): open escalations and a budget cap, which the report
 * health alone leaves out (a unit that files no report shows Unknown however many questions it raised). Answers
 * { escalations, capped, needs } where needs is true when either is present.
 */
export function unitAttention(h) {
  const escalations = Number(h?.openEscalations || 0);
  const capped = !!h?.overBudget;
  return { escalations, capped, needs: escalations > 0 || capped };
}

/**
 * Open escalations grouped by who raised them and what they asked (UXP1-S013): a keeper that raises the same question
 * on every tick shows once, with how many times it asked. Each group is { key, latest, items, count }, latest being the
 * newest escalation of the group; groups keep the order of their newest escalation.
 */
export function groupEscalations(list) {
  const groups = [];
  const index = new Map();
  for (const e of list || []) {
    if (!e) continue;
    const key = `${e.agentId || e.agentName || ''}\u0000${String(e.question || '').trim()}`;
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push({ key, latest: e, items: [] });
    }
    const g = groups[index.get(key)];
    g.items.push(e);
    if (String(e.createdUtc || '') > String(g.latest.createdUtc || '')) g.latest = e;
  }
  return groups.map((g) => ({ ...g, count: g.items.length }));
}
