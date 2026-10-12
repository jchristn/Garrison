{{#if approval.byUser}}
A person reviewing this run in Garrison denied this {{approval.toolName}} call ({{approval.id}}).{{#if approval.reason}} Reason: {{approval.reason}}{{/if}} Do not retry the same call; continue without it, or explain in your answer what you need and why.
{{/if}}
{{#if approval.byRule}}
Garrison's approval rule {{approval.rulePattern}} denies this {{approval.toolName}} call ({{approval.id}}). Do not retry it; continue without it, or explain in your answer what you need.
{{/if}}
{{#if approval.byDefault}}
This deployment denies {{approval.toolName}} calls that no approval rule allows ({{approval.id}}). Do not retry it; continue without it, or explain in your answer what you need.
{{/if}}
{{#if approval.byTimeout}}
Nobody decided on this {{approval.toolName}} call within {{approval.timeoutSeconds}} seconds, so Garrison denied it ({{approval.id}}). Continue without it, or explain in your answer what you need approved.
{{/if}}
{{#if approval.byCancel}}
This {{approval.toolName}} call was not approved because the run is stopping ({{approval.id}}). Do not start new work.
{{/if}}
