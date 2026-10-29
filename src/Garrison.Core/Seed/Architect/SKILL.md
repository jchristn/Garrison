---
name: garrison-manifests
description: How to write Garrison manifest documents (agents, deployments, apps, prompt templates, assets) for studio drafts, with the conventions Garrison expects.
---

# Writing Garrison manifests

Every studio draft item is one manifest document:

```yaml
apiVersion: garrison/v1
kind: Agent
metadata:
  name: report-writer
  description: Writes a report from research notes
spec:
  displayName: Report writer
```

- `metadata.name` is 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit. It is how other documents refer to this one.
- `kind` is one of PromptTemplate, HarnessProfile, McpServer, WorkspaceTemplate, AgentAsset, Agent, Deployment, Pipeline, AgenticApp, Trigger, NotificationEndpoint.
- Leave a field out to keep its default. Never write secret values; refer to a secret by name.

See `kinds.md` in this skill for the fields of each kind, and `conventions.md` for how Garrison expects agents and apps to be shaped.
