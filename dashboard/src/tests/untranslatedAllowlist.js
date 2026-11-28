// Values a translated catalog may leave identical to English.
//
// isProductTerm() accepts strings made only of product names, protocol names, acronyms, units, numbers,
// placeholders, and punctuation: those stay in English in every language (docs/I18N.md, Glossary).
// UNTRANSLATED_ALLOWLIST lists whole values that are legitimately spelled the same as English in one language
// (German "Name", Italian "Home", French "Audit"). Keep both lists short; anything else is a missed translation.

const PRODUCT_WORDS = new Set([
  'Garrison', 'Claude', 'Code', 'Codex', 'Mux', 'Gemini', 'CLI', 'Anthropic', 'OpenAI', 'GitHub', 'Discord', 'Git',
  'opencode', 'pi', 'Kubernetes', 'ConfigMap', 'StatefulSet', 'Job', 'Prometheus', 'Grafana', 'OpenTelemetry', 'OpenAPI', 'WebSocket', 'OAuth',
  'MCP', 'A2A', 'REST', 'API', 'APIs', 'SSE', 'JSON', 'YAML', 'URL', 'URLs', 'HTTP', 'HTTPS', 'SDK', 'ID', 'IDs', 'UTC',
  'CSV', 'PNG', 'SVG', 'HMAC', 'TTFT', 'USD', 'PID', 'HOME', 'stdio', 'Stdout', 'Stderr', 'stdout', 'stderr', 'auth',
  'JSONL', 'TOML', 'S3', 'Harness', 'Harnesses', 'harness', 'harnesses', 'Tempo', 'Loki', 'json', 'sonnet', 'opus', 'haiku', 'p50', 'p90', 'p95', 'p99', 'ms', 's', 'min', 'h', 'tok', 'KB', 'MB', 'GB', 'TB', 'B'
]);

/** True when every word in the value is a product, protocol, or unit term that stays in English. */
export function isProductTerm(value) {
  const words = String(value)
    .replace(/\{\{[^}]+\}\}/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => /[A-Za-z]/.test(w));
  return words.every((w) => PRODUCT_WORDS.has(w));
}

export const UNTRANSLATED_ALLOWLIST = {
  '*': [
    'Alias', 'Audit', 'Editor', 'Streaming', 'Prompts',
    // The product name stays in English in every language (AD12.12).
    'Garrison Agent Studio', 'Agent Studio',
    // A wake source of keepers (AA1.16); the technical term is used untranslated in these languages.
    'Webhook',
    // The lowest escalation severity (AA2.13), spelled the same in German, French, and Italian.
    'Info',
    // Evaluations (AA9.15): version notation, a name and time pair, the JSON Schema scorer's argument, and its example.
    'v{{version}}', '{{name}} v{{version}}', '{{name}}, {{when}}', 'JSON Schema', '{"type": "object", "required": ["answer"]}',
    // The name of the gerbil example organization template (LP3.8).
    'Gerbil'
  ],
  de: [
    'Agent', 'Cluster', 'Delegation', 'Detail', 'Fragment', 'Labels', 'Live', 'Median (p50)', 'Name', 'Navigation',
    'Manifest', 'Offline', 'Operation', 'Parser', 'Reasoning', 'Repository', 'Server', 'Status', 'System', 'Transport',
    'Version', 'Version {{version}}', 'Leader', 'Executor', 'Executors', 'Pipeline', 'Pipelines', 'Quorum', 'App', 'Apps', 'Graph',
    'Logo', 'Revision', 'Asset', 'Details', 'Revision {{number}} ({{state}})', 'Studio', 'Signal', 'Revision {{number}}',
    // A message urgency (AA6.12), spelled the same in German.
    'Normal',
    // The organization designer (LP3.5, LP3.3): words German spells the same.
    'Budget', 'Budget (USD)', 'in {{unit}}'
  ],
  ja: [],
  es: [
    'Endpoint', 'Endpoints', 'Error', 'General', 'Manual', 'No', 'Roles', 'Tokens', 'Tokens/s', 'Total', 'Asset',
    // A message urgency (AA6.12), spelled the same in Spanish.
    'Normal'
  ],
  fr: [
    // The Attention tick outcome (UXP1-S020) is the same word in French.
    'Attention',
    // Evaluations (AA9.15): words French spells the same.
    'Versions', 'Verdict', 'Budget (USD)', 'Budget {{budget}}',
    'Actions', 'Active', 'Administration', 'Agent', 'Agents', 'Arguments', 'Assistant', 'Cluster', 'Condition',
    'Configuration', 'Description', 'Effort', 'Fragment', 'Invocation', 'Message', 'Mode', 'Navigation', 'Note',
    'Principal', 'Secret', 'Secrets', 'Tags', 'Total', 'Transport', 'Type', 'Validation', 'Version',
    'Version {{version}}', 'Versions ({{count}})', 'Leader', 'Conversation', 'Conversations', 'Quorum', 'Logo', 'Asset',
    'Documentation', 'Signal', 'Source', 'Question', 'Options',
    // A report kind (AA5.10), spelled the same in French.
    'Incident',
    // Messages between agents (AA6.12), spelled the same in French.
    'Messages', '{{count}} message', '{{count}} messages',
    // An organization's mission (AA7.14), spelled the same in French.
    'Mission',
    // The organization designer's Budget tab (LP3.5).
    'Budget'
  ],
  it: [
    'Cluster', 'Database', 'Email', 'Endpoint', 'File system', 'Home', 'Input', 'Manifest', 'Logging', 'No', 'Offline', 'Output', 'Parser',
    'Password', 'Polling', 'Principal', 'Repository', 'Server', 'Tenant', 'record', '{{count}} file', 'Leader', 'Quorum', 'Logo', 'Asset',
    'Studio', 'Escalation',
    // The organization designer (LP3.5, LP3.3): words Italian spells the same.
    'Budget', 'Budget (USD)', 'in {{unit}}'
  ],
  'zh-Hans': [],
  'zh-Hant': [],
  'yue-Hant': []
};
