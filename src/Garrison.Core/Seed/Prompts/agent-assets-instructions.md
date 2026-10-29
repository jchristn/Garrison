These files were placed in your working directory for this task:
{{#each assets.listed}}
- {{this.path}}: {{#if this.isSkill}}skill{{/if}}{{#if this.isReferenceFile}}reference file{{/if}}{{#if this.isDocumentTemplate}}document template{{/if}} "{{this.name}}"{{#if this.description}}. {{this.description}}{{/if}}
{{/each}}

Read them when they help. A skill describes how to do one kind of task; follow it when you do that task. Use a document template as the style reference for documents you produce.
