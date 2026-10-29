// Agent architect form helpers (AD7.10, AD9.5, AD9.9), shared by the studio's New architect dialog and the setup
// wizard's Agent Studio step. Plain functions (no JSX), outside the studio chunk so the wizard loads without it.

/** A blank architect form: the name, harness profile, model, and architect prompt (filled in as the lists load). */
export function blankArchitectForm() {
  return { name: 'architect', harnessProfileId: '', model: '', promptId: '' };
}

/**
 * Body for POST /studio/architects (AD9.5, AD9.9): the name, the chosen harness profile, the model when given, and the
 * chosen architect prompt as architectPromptTemplateId. The server makes it a deployment of agent-architect with
 * managementAccess Drafts.
 */
export function architectBody(form) {
  const body = { name: String(form.name || '').trim(), harnessProfileId: form.harnessProfileId };
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
