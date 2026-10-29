Fan-out group {{fanout.groupId}} is {{fanout.status}} (join policy {{fanout.joinPolicy}}{{#if fanout.reason}}: {{fanout.reason}}{{/if}}). {{fanout.finished}} of {{fanout.total}} members finished, {{fanout.succeeded}} succeeded, {{fanout.pending}} still running.
{{#each fanout.members}}

{{this.label}} ({{this.agent}}, run {{this.runId}}): {{this.status}}
{{#if this.result}}Result: {{this.result}}
{{/if}}{{#if this.error}}Error: {{this.error}}
{{/if}}{{#if this.files}}Files written: {{this.files}}
{{/if}}{{/each}}
