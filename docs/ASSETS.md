# Agent assets

An agent often needs files that are not code and not a prompt: a skill that teaches it how to do one kind of task, a glossary or style guide, a Word template to format reports with. Agent assets hold those files. Each asset is versioned, stored in an artifact store or the Garrison database, pinned by agent revisions, and placed into each run's workspace where the harness expects it.

## Kinds

| Kind | What it holds | Files |
|---|---|---|
| `Skill` | Instructions for one kind of task, such as a Claude Code `SKILL.md` with supporting files | One or more |
| `ReferenceFile` | Material the agent reads: a glossary, a style guide, sample data | One or more |
| `DocumentTemplate` | A style reference for documents the agent produces, such as a `.docx` or `.dotx` | One or more |
| `SystemPrompt` | A system prompt. It names a prompt template and has no files of its own | None |

A `SystemPrompt` asset points at a prompt template (`promptTemplateId`), so its text is versioned by the prompt template system. Creating one without a template answers 400 `AssetTemplateRequired`. When an agent revision pins a `SystemPrompt` asset, that template becomes the run's System prompt instead of the deployment's System binding.

## Versions and storage

Each upload creates a version: a set of files, each with a path, a media type, a size, and a SHA-256. Paths are relative with forward slashes (`SKILL.md`, `examples/sample.md`); absolute paths, backslashes, and `..` segments are refused with field code `InvalidAssetPath`. Uploading exactly the files of the current version returns that version (200) instead of making a new one.

```bash
B=http://127.0.0.1:8700/v1.0/api/tenants/default
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

curl -s -X POST $B/agent-assets "${H[@]}" -d '{"name": "citation-style", "kind": "Skill", "description": "How to cite sources"}'
curl -s -X POST $B/agent-assets/citation-style/versions "${H[@]}" \
  -d '{"changeNote": "First cut", "files": [{"path": "SKILL.md", "contentBase64": "'$(printf '# Citations\nUse author-date.' | base64)'"}]}'

# One file as raw bytes
curl -s -X POST "$B/agent-assets/report-template/versions?path=report.dotx" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/octet-stream" --data-binary @report.dotx
```

Content lives under the reserved `.garrison-assets/` key prefix of the asset's artifact store (`artifactStoreId`), or in the Garrison database when the asset names no store. The store cannot change once the asset has versions. Asset files are not artifacts: they never appear in `GET .../artifacts`, and run retention does not remove them. Content is content-addressed by SHA-256, so the same bytes are stored once per asset.

Every read checks the content against its recorded hash. Changed content is never served, and a run that would receive it fails before launch (see below).

### Limits

| Setting | Default | Range | Meaning |
|---|---|---|---|
| `Assets.MaxFileBytes` | 16777216 (16 MiB) | 1024 to 268435456 | Largest single file. Files in an external store are also bounded by `Artifacts.MaxFileBytes` when read |
| `Assets.MaxVersionBytes` | 67108864 (64 MiB) | 1024 to 1073741824 | Largest total of one version |
| `Assets.MaxFilesPerVersion` | 200 | 1 to 1000 | Most files in one version |
| `Assets.AllowMacroFormats` | false | | Allow `.dotm`, `.docm`, `.xlsm`, `.pptm`, `.xltm`, `.potm` uploads |

An upload over a limit answers 413 with code `AssetFileTooLarge`, `AssetVersionTooLarge`, or `AssetTooManyFiles` and names the setting. The environment variables are `GARRISON_ASSETS_MAX_FILE_BYTES`, `GARRISON_ASSETS_MAX_VERSION_BYTES`, `GARRISON_ASSETS_MAX_FILES_PER_VERSION`, and `GARRISON_ASSETS_ALLOW_MACRO_FORMATS`.

Office templates can carry macros. Garrison treats templates as style references and never runs them, and it refuses macro-enabled formats unless `Assets.AllowMacroFormats` is set (field code `MacroFormatRefused`). Save templates as `.dotx` or `.docx`.

## Pinning assets to an agent

A revision lists the assets it uses in `assetPins`, each with an optional `version` (default: the asset's current version when the run compiles). An asset can be pinned by identifier or by name; the server stores the identifier.

```bash
curl -s -X POST $B/agents/report-writer/revisions "${H[@]}" \
  -d '{"description": "Writes reports", "assetPins": [{"assetId": "citation-style"}, {"assetId": "report-template", "version": 2}]}'
curl -s -X POST $B/agents/report-writer/revisions/2/publish "${H[@]}"
```

A revision can pin at most one `SystemPrompt` asset. An asset that any revision pins cannot be deleted (409 `AssetInUse`). Editing an agent directly keeps its asset pins (see [REVISIONS.md](REVISIONS.md)).

## Placement

Each harness profile says where it expects assets of each kind, in `assetPlacements`: a workspace-relative directory template with `{{asset.name}}`, and whether assets placed there are also listed in the system prompt. The built-in profiles use:

| Profile | Skill | ReferenceFile | DocumentTemplate |
|---|---|---|---|
| `builtin/claude-code` | `.claude/skills/{{asset.name}}` | `assets/{{asset.name}}` | `assets/{{asset.name}}` |
| `builtin/codex`, `builtin/codex-app-server` | `assets/{{asset.name}}` | `assets/{{asset.name}}` | `assets/{{asset.name}}` |
| `builtin/gemini-cli` | `assets/{{asset.name}}` | `assets/{{asset.name}}` | `assets/{{asset.name}}` |
| `builtin/mux` | `assets/{{asset.name}}` | `assets/{{asset.name}}` | `assets/{{asset.name}}` |
| `builtin/fake`, `builtin/generic-jsonl`, `builtin/provider-api` | `assets/{{asset.name}}` | `assets/{{asset.name}}` | `assets/{{asset.name}}` |

Every built-in placement is listed in the system prompt. The default system prompt includes the protected fragment `builtin/agent-assets-instructions` when anything is listed, so the harness knows which files it has and what each one is for. A tenant profile can change the paths; a kind with no placement falls back to `assets/{{asset.name}}`, listed. A placement that would leave the workspace fails the compile with `InvalidAssetPlacement`.

Placements are data, so when a harness moves its skill directory you can change the profile without a release.

## How files reach a run

When a run is leased, the compiled spec lists each asset file with its target path and SHA-256. The control plane gives every file a short-lived, download-only URL. Before the executor starts, the worker downloads each file, checks the hash, and writes it into the workspace. If any file is missing or does not match, the run fails before the harness starts, with outcome `AssetIntegrityFailed`.

The KubernetesJob executor works the same way: the worker fetches and checks the files, then passes their bytes to the run pod in its envelope. The pod never sees a download URL or a credential.

Asset files are excluded from artifact collection even when a deployment's globs match them.

## Manifests

The `AgentAsset` kind carries the asset and the files of its current version. Text files can be inline; binary files can be inline as base64, or given by reference:

```yaml
apiVersion: garrison/v1
kind: AgentAsset
metadata: { name: citation-style }
spec:
  kind: Skill
  description: How to cite sources
  files:
    - path: SKILL.md
      content: |
        # Citations
        Use author-date.
---
apiVersion: garrison/v1
kind: Agent
metadata: { name: report-writer }
spec:
  description: Writes reports
  assets: [ { asset: citation-style } ]
```

Export writes text files (up to 256 KiB) inline and binary files by reference, with `sha256`, `sizeBytes`, and a `note`. Applying a file given by reference needs the asset in the target tenant to hold that content already; otherwise the document fails with `AssetContentMissing`. Upload the binary there first, then apply. See [MANIFESTS.md](MANIFESTS.md).

## Permissions

| Action | Permission |
|---|---|
| List and read assets, versions, and files | Read on `AgentAsset` |
| Create an asset, upload a version | Create on `AgentAsset` |
| Update an asset | Update on `AgentAsset` |
| Delete an asset | Delete on `AgentAsset` |

`AgentDeveloper`, `Editor`, and tenant administrators can write assets; `Viewer`, `Auditor`, and `AgentOperator` can read them. Hosted run tokens cannot write assets.
