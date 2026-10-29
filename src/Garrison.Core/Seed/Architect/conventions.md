# Garrison conventions

- One job per agent. An orchestrator plans and delegates; specialists do one kind of work well.
- The entry agent of an app is the only member that talks to people. Other members are called along edges.
- Edges form a tree or a directed acyclic graph. Every member must be reachable from the entry agent.
- Delegation settings follow the app graph: each member may call exactly the members it has edges to, and its maximum depth is the longest chain of calls below it. Garrison can derive these for you.
- Prefer an existing capability over a new one: an agent that already does the job, a tool of a connected MCP server, or a tool installed on the worker host (such as pandoc).
- Set a timeout and a budget on every deployment. Ask for approval before tools that change things outside the workspace.
- New work starts in the dev environment and is promoted to staging and prod after testing.
- Files that should outlast a turn or pass between agents belong in the conversation file space.
