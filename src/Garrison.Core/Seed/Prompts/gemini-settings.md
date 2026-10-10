{
  "mcpServers": {
{{#each resources.httpMcpServers}}
    {{this.name | json}}: { "httpUrl": {{this.endpoint | json}}, "timeout": {{this.toolTimeoutMs}}, "trust": true, "headers": { {{#each this.headers}}{{this.name | json}}: {{this.value | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{#unless @last}},{{/unless}}
{{/each}}
  },
  "privacy": { "usageStatisticsEnabled": false },
  "skills": { "enabled": false }
}
