// Translations for text the server, worker, and harness parsers generate in English (M1-24).
//
// Run events and some error messages carry no machine code, only English text built from a fixed template. Each
// pattern below matches one of those templates and maps it to a translation key with its captured values as
// placeholders. Text that matches no pattern is returned unchanged, so new server messages still show (in English).

/** [regular expression, translation key under common.serverText, capture names]. Order matters: first match wins. */
export const SERVER_TEXT_PATTERNS = [
  [/^Workspace prepared at (.+)\.$/, 'workspacePrepared', ['path']],
  // Field warnings (I-08): a value outside its range that the server clamped.
  [/^(\S+) (\S+) is outside the allowed range (\S+) to (\S+); (\S+) was stored\.$/, 'valueClamped', ['field', 'given', 'minimum', 'maximum', 'stored']],
  // Run guards (P3.15): RunGuardTriggered warnings and the run's errorMessage. Numbers arrive formatted as 1,000.
  [/^Repetition guard: the last ([\d,]+) characters of assistant text are the ([\d,]+)-character unit "(.*)" repeated ([\d,]+) times\.$/s, 'guardRepetitionUnit', ['window', 'size', 'unit', 'count']],
  [/^Repetition guard: the last ([\d,]+) characters of assistant text contain no letters or digits \(only whitespace, punctuation, or symbols\), ending with "(.*)"\.$/s, 'guardDegenerate', ['window', 'tail']],
  [/^The run made no progress for ([\d,]+) seconds \(no assistant text, thinking, tool call, or tool result, and no tool call open\); its noProgressSeconds limit is ([\d,]+)\.$/, 'guardNoProgress', ['seconds', 'limit']],
  [/^Assistant text passed the run's maxAssistantChars limit of ([\d,]+) characters\.$/, 'guardOutputLimit', ['limit']],
  [/^Structured output repair attempt (\d+): resuming the harness session in (.+)\.$/, 'repairAttempt', ['attempt', 'path']],
  [/^MCP pre-flight passed for (\d+) server\(s\)\.$/, 'mcpPreflight', ['count']],
  [/^Harness exited with code (-?\d+): (\w+) \((\w+)\)\.$/, 'harnessExitedCode', ['code', 'status', 'outcome']],
  [/^Harness exited: (\w+) \((\w+)\)\.$/, 'harnessExited', ['status', 'outcome']],
  [/^Harness exited with code (\S+) without a final result\.$/, 'exitedNoResult', ['code']],
  [/^Harness reported failure\.$/, 'harnessFailed', []],
  [/^Session initialized \((.+)\)\.$/, 'sessionInitializedModel', ['model']],
  [/^Session initialized\.$/, 'sessionInitialized', []],
  [/^Run started \((.+)\)\.$/, 'runStartedModel', ['model']],
  [/^Run started\.$/, 'runStarted', []],
  [/^Thread started\.$/, 'threadStarted', []],
  [/^Tool call denied: (.+)$/, 'toolCallDenied', ['id']],
  // Permission approvals (P12.3): ApprovalRequested run events. Decided events keep the server text under their label.
  [/^Waiting for a person to approve (.+); approval (\S+) expires at (.+)\.$/s, 'approvalWaitingExpires', ['subject', 'id', 'expires']],
  [/^Waiting for a person to approve (.+); approval (\S+)\.$/s, 'approvalWaiting', ['subject', 'id']],
  [/^Agent (\S+) has no active deployment with a weight above zero\.$/, 'noActiveDeployment', ['agent']],
  [/^(.+) is used by deployment\(s\) (.+)\.$/, 'inUse', ['what', 'deployments']],
  [/^Would be created\.$/i, 'wouldBeCreated', []],
  [/^Would be updated\.$/i, 'wouldBeUpdated', []],
  [/^Would be unchanged\.$/i, 'wouldBeUnchanged', []],
  [/^Not applied because another document failed validation\.$/, 'notApplied', []]
];

/** Enum groups for captured values that are enum names, so they show translated too. */
const ENUM_CAPTURES = { status: 'runStatus', outcome: 'runOutcome' };

/**
 * Translate one server-generated message. Returns the translation when a known pattern matches and the
 * translation exists, otherwise the original text.
 * @param {Function} t i18next translate function.
 * @param {string} text Server text.
 * @returns {string}
 */
export function translateServerText(t, text) {
  if (typeof text !== 'string' || !text) return text;
  const trimmed = text.trim();
  for (const [re, key, names] of SERVER_TEXT_PATTERNS) {
    const m = trimmed.match(re);
    if (!m) continue;
    const values = {};
    names.forEach((name, i) => {
      const raw = m[i + 1];
      values[name] = ENUM_CAPTURES[name] ? t(`enums.${ENUM_CAPTURES[name]}.${raw}`, { defaultValue: raw }) : raw;
    });
    const translated = t(`common.serverText.${key}`, { ...values, defaultValue: '', interpolation: { escapeValue: false } });
    return translated || text;
  }
  return text;
}

/** Drop a leading "Code: " prefix that some server messages repeat (M1-30), for example "RunFinished: Run ... finished". */
export function stripCodePrefix(message, code) {
  if (typeof message !== 'string') return message;
  if (code && message.startsWith(`${code}: `)) return message.slice(code.length + 2);
  return message;
}
