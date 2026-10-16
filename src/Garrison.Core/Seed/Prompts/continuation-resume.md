Continue the saved session from its checkpoint. Do not repeat completed actions.
{{continuation.reason}}
{{#each continuation.decisions}}
Permission decision for {{this.tool}} ({{this.approvalId}}): {{this.decision}}.
{{this.reason}}
{{/each}}
Honor these decisions when continuing. For an allowed pending tool request, reuse its exact original tool name and complete input object from the saved history, including paths, arguments, and metadata. A denied action must not be retried or bypassed.

{{#each continuation.children}}
Delegated run {{this.runId}} ({{this.agent}}) finished {{this.status}}.
Result: {{this.result}}
Error: {{this.error}}
{{/each}}
