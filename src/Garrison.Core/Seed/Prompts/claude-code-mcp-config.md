{
  "mcpServers": {
{{#each resources.mcpServers}}
    {{this.name | json}}: {{#if this.isHttp}}{ "type": "http", "url": {{this.endpoint | json}}, "headers": { {{#each this.headers}}{{this.name | json}}: {{this.value | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{else}}{ "type": "stdio", "command": {{this.command | json}}, "args": {{this.args | json}}, "env": { {{#each this.env}}{{this.name | json}}: {{this.value | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{/if}}{{#unless @last}},{{/unless}}
{{/each}}
  }
}
