{
  "mcpServers": {
{{#each resources.mcpServers}}
    {{this.name | json}}: {{#if this.isHttp}}{ "type": "http", "url": {{this.endpoint | json}}, "timeout": {{this.toolTimeoutSeconds}}, "exposure": {{deployment.parameters.mcpExposure | default: "direct" | json}}, "headers": { {{#each this.headers}}{{this.name | json}}: {{this.envRef | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{else}}{ "type": "stdio", "command": {{this.command | json}}, "args": {{this.args | json}}, "timeout": {{this.toolTimeoutSeconds}}, "exposure": {{deployment.parameters.mcpExposure | default: "direct" | json}}, "env": { {{#each this.env}}{{this.name | json}}: {{this.envRef | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{/if}}{{#unless @last}},{{/unless}}
{{/each}}
  }
}
