// How to get the value of each secret kind (shown in the Create secret form, the Set value dialog, and the setup
// wizard). Step text lives in the catalogs under components.secretGuide.<Kind>.<step>; commands and links are not
// translated. Plain data (no JSX) so tests can import it.

/** Kinds whose value is a whole file with line breaks, entered in a multi-line box. */
export const MULTILINE_SECRET_KINDS = ['CodexAuthJson', 'GenericFile'];

/**
 * Steps per kind: { key, code?, link? }. `code` is a command or snippet to copy; `link` opens the provider's page.
 * `note` marks kinds with a caution under the steps.
 */
export const SECRET_GUIDES = {
  AnthropicApiKey: { steps: [{ key: 's1', link: 'https://console.anthropic.com/settings/keys' }, { key: 's2' }, { key: 's3' }] },
  ClaudeCodeOAuthToken: {
    steps: [{ key: 's1', code: 'npm install -g @anthropic-ai/claude-code' }, { key: 's2', code: 'claude setup-token' }, { key: 's3' }, { key: 's4' }],
    note: true
  },
  OpenAiApiKey: { steps: [{ key: 's1', link: 'https://platform.openai.com/api-keys' }, { key: 's2' }, { key: 's3' }] },
  CodexAuthJson: {
    steps: [
      { key: 's1', code: 'npm install -g @openai/codex' },
      { key: 's2', code: 'export CODEX_HOME="$(mktemp -d)"\ncodex login' },
      { key: 's3', code: 'cat "$CODEX_HOME/auth.json"' },
      { key: 's4', code: 'rm -rf "$CODEX_HOME"' }
    ],
    note: true
  },
  GeminiApiKey: { steps: [{ key: 's1', link: 'https://aistudio.google.com/apikey' }, { key: 's2' }, { key: 's3' }] },
  GenericEnv: { steps: [{ key: 's1' }, { key: 's2', code: 'OPENROUTER_API_KEY = {{secret.openrouter}}' }, { key: 's3' }] },
  GenericFile: { steps: [{ key: 's1' }, { key: 's2', code: '{{secret.gcp-service-account}}' }] },
  BearerToken: { steps: [{ key: 's1' }, { key: 's2' }] },
  BasicAuth: { steps: [{ key: 's1', code: 'username:password' }, { key: 's2' }] },
  GitCredential: { steps: [{ key: 's1', link: 'https://github.com/settings/personal-access-tokens/new' }, { key: 's2' }, { key: 's3' }] }
};

/** The guide for a kind, or null when there is none. */
export function secretGuide(kind) {
  return SECRET_GUIDES[kind] || null;
}
