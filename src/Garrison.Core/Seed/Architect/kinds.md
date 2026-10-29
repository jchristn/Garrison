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

```yaml
kind: Deployment
metadata: { name: researcher-dev }
spec:
  agent: researcher
  harnessProfile: builtin/claude-code   # or another profile name, such as builtin/codex-app-server or builtin/fake
  environment: dev
  model: claude-sonnet-5-5
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
    secrets:
      - { alias: anthropic, secret: claude-credential }
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
