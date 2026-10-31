# Repository Guidelines

## Project Structure & Module Organization

Garrison is a multi-tenant control plane for headless agent harnesses. `src/Garrison.Core` contains models, persistence, security, and compilation; `src/Garrison.Harnesses` contains parsers and execution utilities. `src/Garrison.Server` hosts REST, MCP, and A2A; `src/Garrison.Worker` executes leases without accessing the database.

Shared tests live in `src/Test.Shared`, with fixtures in `Fixtures/` and compiler snapshots in `Golden/`. `dashboard/` contains the React/Vite console and its tests. `sdk/` holds C#, Python, JavaScript, and Go clients. Deployment files live in `docker/` and `k8s/`; documentation, examples, and API collections live in `docs/`, `examples/`, and `assets/`.

## Build, Test, and Development Commands

Use the .NET 10 SDK and Node.js 22. Run from the repository root unless noted:

- `dotnet build src/Garrison.sln`: build the solution; leave zero errors and warnings.
- `GARRISON_ALLOW_INSECURE_DEFAULTS=true dotnet run --project src/Garrison.Server -f net10.0`: start the server in development mode, REST on `127.0.0.1:8700` and MCP on `8701`. Without that variable the server refuses to start on the public default keys and passwords.
- `dotnet run --project src/Garrison.Worker -f net10.0`: start a worker in another terminal.
- `dotnet run --project src/Test.Automated -f net10.0`: run shared Touchstone suites.
- `dotnet test src/Test.Xunit -f net10.0` and `dotnet test src/Test.Nunit -f net10.0`: run adapter tests.
- In `dashboard/`, run `npm install`, then `npm run dev`; validate with `npm run lint`, `npm run build`, and `npm test`.
- `scripts/check-em-dash.sh`: enforce the repository-wide punctuation rule.
- `scripts/check-version.sh`: check that every version mirror listed in `scripts/version-mirrors.txt` matches `src/Directory.Build.props`.

## Coding Style & Naming Conventions

Follow `CLAUDE.md`: four-space C# indentation, block namespaces with internal `using` directives, explicit types instead of `var`, one class or enum per file, `_PascalCase` private fields, and public XML documentation. Async methods accept cancellation tokens and use `ConfigureAwait(false)` where appropriate. Dashboard code uses two-space indentation and ESLint. Do not use em-dashes or change versions without an explicit request.

## Testing Guidelines

Add regression cases to the relevant `*Suite.cs`; use descriptive kebab-case case IDs. Dashboard tests use Vitest and Playwright (`npm run test:e2e`). CI tests .NET 8 and 10 against SQLite and PostgreSQL. Set `GARRISON_TEST_PROVIDERS=sqlite,postgresql` for both providers. Review snapshot changes generated with `GARRISON_UPDATE_GOLDEN=true`. No numeric coverage threshold is specified.

## Commit & Pull Request Guidelines

History uses descriptive, topic-led subjects such as `Plan: ...` and references like `(P12.1)`. Reference applicable plan IDs, describe behavior changes and validation in PRs, and include screenshots for UI changes. Update affected API documentation and SDKs. The build plans are archived in `archive/` (`GARRISON_PLAN.md`, `AGENT_DESIGN_DEPLOY_PLAN.md`): read them for the reasoning behind a design, but record new work in `CHANGELOG.md` instead of annotating them. Commit or push only when requested.
