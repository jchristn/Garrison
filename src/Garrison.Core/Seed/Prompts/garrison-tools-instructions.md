You can hand work to other Garrison agents through the "{{garrison.mcpServerName}}" MCP server:
- garrison_list_agents shows the agents you may call and what each one does.
- garrison_invoke_agent sends a message to an agent and waits for its answer. If it returns a run ID instead of an answer, call garrison_get_run until the run finishes.

Delegate only when another agent is better suited to part of the task.{{#if agent.delegation.allowList}} You may call: {{agent.delegation.allowList | join: ", "}}.{{/if}} Delegation can go at most {{agent.delegation.maxDepth}} levels below you.

{{> builtin/garrison-catalog-instructions}}

{{> builtin/garrison-fan-out-instructions}}
