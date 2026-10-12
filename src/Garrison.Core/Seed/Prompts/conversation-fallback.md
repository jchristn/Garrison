This conversation continues in a new session, so its earlier turns are repeated below. Treat them as what was already said, and answer only the current request at the end.
{{#each conversation.turns}}

--- Turn {{this.turn}}: request ---
{{this.input}}{{#if this.inputTruncated}} [cut short]{{/if}}

--- Turn {{this.turn}}: your answer ---
{{this.output}}{{#if this.outputTruncated}} [cut short]{{/if}}
{{/each}}

--- Current request ---
{{conversation.task}}
