The board of {{brief.organizationName}} asks for a brief{{#if brief.intervalHours}} every {{brief.intervalHours}} hours{{/if}}, and one is due now.
{{#if brief.lastBriefUtc}}
Your last brief was filed at {{brief.lastBriefUtc}}.
{{else}}
You have not filed a brief yet.
{{/if}}

During this tick, call garrison_file_report once with kind Brief and audience Board. Give it a short title, health for the organization as a whole (Healthy, Degraded, Unhealthy, or Unknown), and a body that tells the people who run the organization what changed since the last brief, what needs their attention or decision, and what you plan next. Add metrics, issues, and decisions where they help. Keep it plain and factual: the board reads it on the board view and may receive it as a notification.
