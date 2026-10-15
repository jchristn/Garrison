{{#if trigger.isCron}}
The scheduled trigger {{trigger.name}} fired for {{trigger.scheduledUtc}} (cron "{{trigger.cron}}", time zone {{trigger.timeZone}}).{{#if trigger.description}} Its purpose: {{trigger.description}}{{/if}} Do the work this schedule exists for.
{{/if}}
{{#if trigger.isWebhook}}
The webhook trigger {{trigger.name}} received a delivery{{#if webhook.deliveryId}} ({{webhook.deliveryId}}){{/if}} at {{trigger.firedUtc}}.{{#if trigger.description}} Its purpose: {{trigger.description}}{{/if}} Act on this payload ({{webhook.contentType | default: "no content type"}}):

{{webhook.body}}
{{/if}}
{{#if trigger.isManual}}
The trigger {{trigger.name}} was fired by hand at {{trigger.firedUtc}}.{{#if trigger.description}} Its purpose: {{trigger.description}}{{/if}}{{#if webhook.body}} Use this payload:

{{webhook.body}}{{else}} Do the work this trigger exists for.{{/if}}
{{/if}}
