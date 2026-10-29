# Example agentic apps

Two bundles you can apply as they are and copy as templates. Both run on the fake harness, so they work with no model and no credentials.

| Bundle | What it shows |
|---|---|
| [doc-converter](doc-converter/doc-converter.yaml) | A reference converter agent: Markdown to Word or PDF, and Word to PDF, with a reference document for styling. Typed input and output, a document template asset, a skill, and host tool requirements |
| [research-overview](research-overview/research-overview.yaml) | An app whose orchestrator fans out to two researchers, has a writer put `report.md` in the conversation file space, and has the doc-converter turn it into `report.pdf` |

## Run them

```bash
TOKEN=...   # a management token
B=http://127.0.0.1:8700/v1.0/api/tenants/default
curl -s -X POST "$B/manifests/apply" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" --data-binary @doc-converter/doc-converter.yaml
curl -s -X POST "$B/manifests/apply" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/yaml" --data-binary @research-overview/research-overview.yaml
```

The doc-converter needs pandoc and LibreOffice on a worker: build the worker image with `--build-arg INCLUDE_DOC_TOOLS=true`. Until a worker reports both tools, its runs wait with `blockedReason` `NoToolWorker`.

Then open the app at `http://127.0.0.1:8080/apps/research-overview/` (the dashboard serves the app UI on Compose) and ask for an overview. The answer names `report.pdf`, and the file panel offers it for download.

`scripts/run-research-example.sh` runs the whole walkthrough as a test, with stand-ins for pandoc and LibreOffice; add `--real-tools <image>` to also convert a report with the real tools inside a worker image built with them.

## Make them your own

- **doc-converter.** The converter is a fixed script (`convert.sh`, embedded in the `pandoc-converter` profile). The input fields are passed to it as arguments and never as shell text. Edit `reference.docx` to restyle every report. If you change `convert.sh`, copy it into the profile too.
- **research-overview.** The orchestrator's Garrison tool calls are scripted in its deployment's `step1` to `step4` parameters so the walkthrough is repeatable. To run it for real, switch the deployments to a real harness profile such as `builtin/claude-code`, delete the parameters, and give each agent a system prompt. The studio's agent architect can do that with you.

[docs/CAPABILITIES.md](../../docs/CAPABILITIES.md#choosing-a-source) compares the three ways to give an agent a capability like conversion: another agent, an MCP server's tool, or a tool on the worker host.
