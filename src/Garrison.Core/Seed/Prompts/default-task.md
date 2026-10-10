{{input.message}}
{{#if input.parameterList}}

Parameters:
{{#each input.parameterList}}
- {{this.name}}: {{this.value}}
{{/each}}
{{/if}}
