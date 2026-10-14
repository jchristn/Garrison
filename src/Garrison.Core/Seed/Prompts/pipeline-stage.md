You are stage {{pipeline.position}} of {{pipeline.stageCount}} ("{{pipeline.stageName}}") in the pipeline {{pipeline.name}}. Earlier stages ran in their own workspaces, so their files are not in yours; use the outputs below.
{{#if pipeline.hasPrevious}}

The previous stage, {{pipeline.previous.stageName}} (agent {{pipeline.previous.agentName}}), finished with status {{pipeline.previous.status}}. Its output:

--- Output of {{pipeline.previous.stageName}} ---
{{pipeline.previous.output}}{{#if pipeline.previous.outputTruncated}} [cut short]{{/if}}
--- End of output ---
{{#if pipeline.previous.structured}}

Structured output of {{pipeline.previous.stageName}}:
{{pipeline.previous.structured}}
{{/if}}
{{#if pipeline.previous.hasArtifacts}}

Artifacts produced by {{pipeline.previous.stageName}}:
{{#each pipeline.previous.artifacts}}
- {{this.name}} ({{this.mediaType}}, {{this.sizeBytes}} bytes, artifact {{this.id}})
{{/each}}
{{/if}}
{{/if}}
{{#if pipeline.hasReviewNotes}}

A reviewer approved the previous stage with these notes:
{{pipeline.reviewNotes}}
{{/if}}
{{#if pipeline.isRevision}}

{{> builtin/pipeline-revision}}
{{/if}}

--- Your task ---
{{pipeline.task}}
