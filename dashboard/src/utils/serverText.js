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
  // Agent assets (AD2): a delete refused while revisions pin the asset, and uploads past a size or count limit.
  [/^Asset (\S+) is pinned by revisions of (.+)\. Remove it from those revisions first\.$/, 'assetInUse', ['asset', 'agents']],
  [/^File (.+) is (\d+) bytes; the limit is (\d+) bytes \(Assets\.MaxFileBytes\)\.$/, 'assetFileTooLarge', ['path', 'size', 'limit']],
  [/^This version is more than (\d+) bytes \(Assets\.MaxVersionBytes\)\.$/, 'assetVersionTooLarge', ['limit']],
  [/^A version holds at most (\d+) files \(Assets\.MaxFilesPerVersion\); this upload has (\d+)\.$/, 'assetTooManyFiles', ['limit', 'count']],
  [/^SystemPrompt assets have no files; edit their prompt template instead\.$/, 'assetHasNoFiles', []],
  // Conversation file spaces (AD3): writes past a size or count limit, and a path that is not in the space.
  [/^File (.+) is (\d+) bytes; the limit is (\d+) bytes \(FileSpaces\.MaxFileBytes\)\.$/, 'fileSpaceFileTooLarge', ['path', 'size', 'limit']],
  [/^The file space would hold more than (\d+) bytes \(FileSpaces\.MaxTotalBytes\)\.$/, 'fileSpaceFull', ['limit']],
  [/^The file space already holds (\d+) files \(FileSpaces\.MaxFiles\)\.$/, 'fileSpaceTooManyFiles', ['count']],
  [/^File (.+) not found\.$/, 'fileNotFound', ['path']],
  // Capability catalog (AD4): refusals for derived entries and taken names, refresh errors, and refresh warnings.
  [/^Capability (.+) is derived from its source and follows it; change the source instead\.$/, 'capabilityDerivedEdit', ['name']],
  [/^Capability (.+) is derived from its source and disappears with it; it cannot be deleted directly\.$/, 'capabilityDerivedDelete', ['name']],
  [/^Capability (.+) is shared by every tenant and derived from a built-in harness profile; it cannot be changed\.$/, 'capabilityShared', ['name']],
  [/^A manual capability named (.+) already exists\.$/, 'capabilityNameConflict', ['name']],
  [/^You may not use the secrets MCP server (.+) sends, so its tools were not listed\.$/, 'capabilitySecretsDenied', ['server']],
  [/^No Ready worker has stdio MCP diagnostics turned on \(GARRISON_WORKER_MCP_TESTS_ENABLED\), so the stdio server's tools could not be listed\.$/, 'capabilityNoStdioWorker', []],
  [/^Refresh failed (\S+ \S+): (.+)$/s, 'capabilityRefreshFailed', ['when', 'error']],
  [/^Required tools are missing: (.+)\.$/, 'capabilityMissingTools', ['tools']],
  [/^Workers probe (\S+) as (.+), defined by another harness profile first; this profile's definition is not probed\.$/, 'capabilityProbeShadowed', ['name', 'probe']],
  // Fan-out groups (AD5): why a group ended (statusReason).
  [/^The parent run finished or was cancelled\.$/, 'fanOutParentEnded', []],
  [/^The members spent (\S+) USD, over the budget of (\S+) USD\.$/, 'fanOutCostExceeded', ['cost', 'budget']],
  [/^The members used (\d+) tokens, over the budget of (\d+)\.$/, 'fanOutTokensExceeded', ['tokens', 'budget']],
  [/^The group's timeout of (\d+) seconds passed with (\d+) members still running\.$/, 'fanOutTimedOut', ['seconds', 'running']],
  [/^A member succeeded\.$/, 'fanOutAnySucceeded', []],
  [/^Every member finished and none succeeded\.$/, 'fanOutNoneSucceeded', []],
  [/^(\d+) members succeeded, meeting the quorum of (\d+)\.$/, 'fanOutQuorumMet', ['succeeded', 'quorum']],
  [/^Too many members failed for the quorum of (\d+) to be met\.$/, 'fanOutQuorumUnreachable', ['quorum']],
  [/^Every member finished\.$/, 'fanOutAllFinished', []],
  [/^Cancelled with garrison_cancel_fan_out\.$/, 'fanOutCancelledByTool', []],
  [/^Cancelled by (.+)\.$/, 'fanOutCancelledBy', ['who']],
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
