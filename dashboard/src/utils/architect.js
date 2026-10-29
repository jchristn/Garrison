// Agent architect form helpers (AD7.10, AD9.5, AD9.9), shared by the studio's New architect dialog and the setup
// wizard's Agent Studio step. Plain functions (no JSX), outside the studio chunk so the wizard loads without it.

/** A blank architect form: the name, harness profile, model, and architect prompt (filled in as the lists load). */
export function blankArchitectForm() {
  return { name: 'architect', harnessProfileId: '', model: '', promptId: '' };
}

/**
 * Body for POST /deployments that creates an architect (AD9.5, AD9.9): a deployment of the agent-architect agent on the
 * chosen harness profile, with the model when given and the chosen architect prompt as architectPromptTemplateId. The
 * server gives every deployment of that agent managementAccess Drafts; the body says so too, for older servers.
 */
export function architectDeploymentBody(form, agentId) {
  const body = { name: String(form.name || '').trim(), agentId, harnessProfileId: form.harnessProfileId, managementAccess: 'Drafts' };
  const model = String(form.model || '').trim();
  if (model) body.model = model;
  if (form.promptId) body.architectPromptTemplateId = form.promptId;
  return body;
}

/** Client-side checks for the architect form. Returns { field: message } (empty when valid). */
export function architectFormErrors(form, t) {
  const errors = {};
  if (!String(form.name || '').trim()) errors.name = t('common.errors.required');
  if (!form.harnessProfileId) errors.harnessProfileId = t('common.errors.required');
  return errors;
}
