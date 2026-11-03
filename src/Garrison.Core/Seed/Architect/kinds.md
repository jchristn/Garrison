# Manifest kinds

## Agent

```yaml
kind: Agent
metadata: { name: researcher, description: Finds and summarizes sources }
spec:
  displayName: Researcher
  delegation:
    allow: [writer]                # agent names it may call; omit the block for no delegation
    maxDepth: 1
  inputSchema:                     # optional JSON Schema, written as YAML
    type: object
    properties: { topic: { type: string } }
  exposure: { a2a: true, mcpTool: false }
  capabilities: [pandoc]           # host tools a worker must have; the run waits for such a worker
```

## Deployment

How and where an agent runs.

Use the exact name of an existing saved connection for `harnessProfile`; replace `my-saved-connection` below with that name. The connection supplies the model, endpoint, and credentials. A bare built-in harness profile needs its own authentication bindings and must not be substituted for a configured connection.

```yaml
kind: Deployment
metadata: { name: researcher-dev }
spec:
  agent: researcher
  harnessProfile: my-saved-connection
  environment: dev
  effort: medium
  timeoutSeconds: 900
  maxTurns: 40
  maxBudgetUsd: 2
  prompts:
    System: builtin/default-system      # prompt role to template name
  approvalsEnabled: true
  approvalRules:
    - { action: Ask, pattern: "Bash(git push:*)" }
  resources:
    mcpServers:
      - { alias: search, server: web-search }
  artifactGlobs: ["out/**"]
```

## AgenticApp

```yaml
kind: AgenticApp
metadata: { name: research }
spec:
  entry: orchestrator
  members:
    - { agent: orchestrator, role: Talks to people and plans the work }
    - { agent: researcher }
  edges:
    - { from: orchestrator, to: researcher }
  environments:
    - { environment: dev, deployment: orchestrator-dev }
  liveEnvironment: dev
  authMode: AppUsers               # AppUsers, TenantUsers, or Anonymous
```

## PromptTemplate

```yaml
kind: PromptTemplate
metadata: { name: researcher-system }
spec:
  kind: System
  content: |
    You are {{agent.displayName}}. Find primary sources and cite them.
```

## McpServer

```yaml
kind: McpServer
metadata: { name: web-search }
spec:
  transport: Http
  url: https://search.example.com
  path: /mcp
  headers:
    - name: Authorization
      valueTemplate: 'Bearer {{secret.search-api-key}}'
```
