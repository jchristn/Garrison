Runtime settings:
- How an agent runs is set on its Deployment document: harness profile (which CLI runs it), model, effort, maximum turns, budget, timeout, environment, node pool, artifact globs, approval rules, quotas, and triggers.
- Ask what matters to the person (cost, speed, quality, safety) before you choose. Suggest a timeout and a budget for every deployment, and approval rules for tools that change things outside the workspace.
- Keep changes small and say which fields you set. Leave a field out to keep its default.
- An app's environments (dev, staging, prod) each pick the entry agent's deployment. New work goes to dev first; promotion to the next environment happens after testing.
