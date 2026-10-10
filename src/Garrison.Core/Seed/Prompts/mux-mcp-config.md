{
  "servers": [
{{#each resources.mcpServers}}
    {{#if this.isHttp}}{ "name": {{this.name | json}}, "transport": "http", "url": {{this.url | json}}, "mcpPath": {{this.path | json}}, "auth": {{#if this.bearerEnvRef}}{ "type": "bearer", "bearerToken": {{this.bearerEnvRef | json}} }{{else}}{ "type": "none" }{{/if}} }{{else}}{ "name": {{this.name | json}}, "transport": "stdio", "command": {{this.command | json}}, "args": {{this.args | json}}, "env": { {{#each this.env}}{{this.name | json}}: {{this.envRef | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{/if}}{{#unless @last}},{{/unless}}
{{/each}}
  ]
}
