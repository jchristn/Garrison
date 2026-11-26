// Field errors of the evaluation, shadow trial, and canary routes (AA9.15): each server field code is explained in
// plain words under evals.fieldCodes.<code>; a code without a translation falls back to the server's message.

/** Field codes the evaluation, shadow trial, and canary routes attach to 400 ValidationFailed. */
export const EVAL_FIELD_CODES = [
  'InputRequired', 'UnknownScorer', 'ArgumentRequired', 'InvalidJsonSchema', 'TooManyCases', 'EvaluatorIsForAgents', 'SetRequired', 'TargetRequired',
  'RecentInputsNeedDeployment', 'NoRecentInputs', 'EvalSetEmpty', 'JudgeAgentRequired', 'DeploymentNotFound', 'SameDeployment', 'DifferentAgent',
  'DeploymentInactive', 'AgentMismatch', 'EndsInPast', 'EvalSetNotFound', 'AgentNotFound', 'EvalGateIncomplete', 'NotIncreasing', 'LastStepNotFull'
];

/**
 * Per-field messages from a validation error of these routes, keyed as the server keys them (checks[0].argument,
 * steps[2].weightPercent), or null when the error carries no fields.
 */
export function evalFieldErrors(t, err) {
  const fields = err?.fields;
  if (!fields || typeof fields !== 'object') return null;
  const out = {};
  for (const [key, message] of Object.entries(fields)) {
    const code = err.fieldCodes?.[key];
    const text = code && EVAL_FIELD_CODES.includes(code) ? t(`evals.fieldCodes.${code}`, { defaultValue: '' }) : '';
    out[key] = text || message;
  }
  return out;
}
