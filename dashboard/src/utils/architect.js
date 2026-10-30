// Agent architect form helpers (AD7.10, AD9.5, AD9.9), shared by the studio's New architect dialog and the setup
// wizard's Agent Studio step. Plain functions (no JSX), outside the studio chunk so the wizard loads without it.

/** A blank architect form: the name, harness profile, model, credential, and architect prompt (filled in as the lists load). */
export function blankArchitectForm() {
  return { name: 'architect', harnessProfileId: '', model: '', credentialSecretId: '', promptId: '' };
}

/** Secret kinds each harness type can sign in with, best first. A harness type not listed takes none. */
export const CREDENTIAL_KINDS = {
  ClaudeCode: ['AnthropicApiKey', 'ClaudeCodeOAuthToken'],
  Codex: ['OpenAiApiKey', 'CodexAuthJson'],
  GeminiCli: ['GeminiApiKey'],
  Mux: ['AnthropicApiKey', 'OpenAiApiKey', 'GeminiApiKey'],
  OpenCode: ['AnthropicApiKey', 'OpenAiApiKey', 'GeminiApiKey'],
  Pi: ['AnthropicApiKey', 'OpenAiApiKey', 'GeminiApiKey'],
  ProviderApi: ['AnthropicApiKey', 'OpenAiApiKey', 'GeminiApiKey']
};

/** Whether a harness type needs a credential secret to sign in (the fake and generic harnesses do not). */
export function needsCredential(harnessType) {
  return !!CREDENTIAL_KINDS[harnessType];
}

/**
 * The active secret an architect on this harness type should sign in with: the first secret of the best kind, or
 * null when the tenant has none that fits. A login that needs reauthentication is never suggested.
 */
export function suggestedCredential(secrets, harnessType) {
  const kinds = CREDENTIAL_KINDS[harnessType] || [];
  const usable = (secrets || []).filter((s) => s && s.active !== false && s.status !== 'NeedsReauthentication');
  for (const kind of kinds) {
    const found = usable.find((s) => s.kind === kind);
    if (found) return found;
  }
  return null;
}

/**
 * Body for POST /studio/architects (AD9.5, AD9.9): the name, the chosen harness profile, the model and the credential
 * secret when given, and the chosen architect prompt as architectPromptTemplateId. The server makes it a deployment of
 * agent-architect with managementAccess Drafts and binds the credential to it.
 */
export function architectBody(form) {
  const body = { name: String(form.name || '').trim(), harnessProfileId: form.harnessProfileId };
  const model = String(form.model || '').trim();
  if (model) body.model = model;
  if (form.credentialSecretId) body.credentialSecretId = form.credentialSecretId;
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
