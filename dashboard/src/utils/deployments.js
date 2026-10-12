// Deployment helpers shared by the agent detail page and its tests.

/**
 * Traffic share per deployment id: weight divided by the summed weight of the agent's active deployments.
 * Inactive deployments and deployments with weight 0 get 0. When every active weight is 0 the shares are all 0,
 * matching the server, which then has no deployment to pick.
 */
export function trafficShares(deployments) {
  const active = (deployments || []).filter((d) => d && d.active !== false);
  const total = active.reduce((sum, d) => sum + Math.max(0, Number(d.weight) || 0), 0);
  const out = {};
  for (const d of deployments || []) {
    if (!d) continue;
    out[d.id] = d.active !== false && total > 0 ? Math.max(0, Number(d.weight) || 0) / total : 0;
  }
  return out;
}

/** Prompt roles the invocation compiler reads (System, Task, DelegatedTask, Repair, ConversationFallback). */
export const PROMPT_ROLES = ['System', 'Task', 'DelegatedTask', 'Repair', 'ConversationFallback'];

/** Built-in template each prompt role defaults to (M1-03), matching the server's DefaultPromptBindings. */
export const ROLE_DEFAULT_TEMPLATES = {
  System: 'builtin/default-system',
  Task: 'builtin/default-task',
  DelegatedTask: 'builtin/delegated-task',
  Repair: 'builtin/structured-output-repair',
  // P12.1: wraps a conversation turn that starts a fresh session with the transcript of the earlier turns.
  ConversationFallback: 'builtin/conversation-fallback'
};

/** Template kind that fits a prompt role, or null for a custom role (any kind). */
export function templateKindForRole(role) {
  if (role === 'System') return 'System';
  if (role === 'Task' || role === 'DelegatedTask' || role === 'Repair' || role === 'ConversationFallback') return 'Task';
  return null;
}

/**
 * The template ID a new binding for `role` should start with: the built-in of the matching kind, else the first
 * template of that kind. Never "the newest template". Returns '' when nothing fits.
 */
export function defaultTemplateFor(role, templates) {
  const list = templates || [];
  const name = ROLE_DEFAULT_TEMPLATES[role];
  const key = name ? name.replace(/^builtin\//, '') : null;
  const builtIn = name && list.find((x) => x.name === name || (x.isBuiltIn && x.builtInKey === key));
  if (builtIn) return builtIn.id;
  const kind = templateKindForRole(role);
  const sameKind = kind ? list.filter((x) => x.kind === kind) : [];
  const preferred = sameKind.find((x) => x.isBuiltIn) || sameKind[0];
  return preferred ? preferred.id : '';
}

/** Templates offered for a binding: those of the role's kind (built-ins first), plus the current one if it differs. */
export function templatesForRole(role, templates, currentId) {
  const list = templates || [];
  const kind = templateKindForRole(role);
  const fit = kind ? list.filter((x) => x.kind === kind) : [...list];
  fit.sort((a, b) => Number(!!b.isBuiltIn) - Number(!!a.isBuiltIn) || String(a.name).localeCompare(String(b.name)));
  if (currentId && !fit.some((x) => x.id === currentId)) {
    const current = list.find((x) => x.id === currentId);
    fit.push(current || { id: currentId, name: currentId });
  }
  return fit;
}

/**
 * Secrets a harness profile reads (M1-04): aliases from {{secret.ALIAS}} and kinds from {{secret.kind.KIND}} in its
 * arguments, environment, and files (values, paths, contents, and conditions).
 */
export function profileSecretNeeds(profile) {
  const aliases = new Set();
  const kinds = new Set();
  if (!profile) return { aliases: [], kinds: [] };
  const texts = [];
  for (const a of profile.arguments || []) texts.push(a.template, a.condition, a.repeatOver);
  for (const e of profile.environment || []) texts.push(e.valueTemplate, e.condition);
  for (const f of profile.files || []) texts.push(f.pathTemplate, f.contentTemplate, f.condition);
  const re = /\{\{[#/]?\s*(?:if\s+|unless\s+)?secret\.([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9_]+))?/g;
  for (const text of texts) {
    if (!text) continue;
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(String(text)))) {
      if (m[1] === 'kind' && m[2]) kinds.add(m[2]);
      else if (m[1] !== 'kind') aliases.add(m[1]);
    }
  }
  return { aliases: [...aliases].sort(), kinds: [...kinds].sort() };
}
