{
  "$schema": "https://opencode.ai/config.json",
  "autoupdate": false,
{{#if prompts.system}}
  "instructions": ["$GARRISON_CONFIG_DIR/system-prompt.md"],
{{/if}}
  "mcp": {
{{#each resources.mcpServers}}
    {{this.name | json}}: {{#if this.isHttp}}{ "type": "remote", "url": {{this.endpoint | json}}, "enabled": true, "oauth": false, "timeout": {{this.toolTimeoutMs}}, "headers": { {{#each this.headers}}{{this.name | json}}: {{this.value | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{else}}{ "type": "local", "command": [{{this.command | json}}{{#each this.args}}, {{this | json}}{{/each}}], "enabled": true, "timeout": {{this.toolTimeoutMs}}, "environment": { {{#each this.env}}{{this.name | json}}: {{this.value | json}}{{#unless @last}}, {{/unless}}{{/each}} } }{{/if}}{{#unless @last}},{{/unless}}
{{/each}}
  }
}
