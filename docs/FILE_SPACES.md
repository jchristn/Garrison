# Conversation file spaces

A conversation file space is a shared folder for one conversation. Every turn of the conversation reads and writes it, and so does every agent the conversation delegates to. A file an agent writes in turn one is still there in turn five, a child agent's notes are visible to its parent, and the person using the app can download the result.

## Which space a run uses

Each run gets a space when it is created, recorded in its `fileSpaceId`:

| The run belongs to | Space |
|---|---|
| A conversation | The conversation's space. Every turn shares it |
| A pipeline run | The pipeline run's space. Every stage shares it |
| Neither | Its root run's space. Every run it delegates to, at any depth, shares it |

Delegated children resolve through their root run, so a whole delegation tree under a conversation uses the conversation's space. A space is created on first use and takes its storage from the owner's deployment: under the reserved `.garrison-files/` prefix of the deployment's artifact store, or in the Garrison database when the deployment has none.

## Sync points

The worker syncs the space into the run's workspace at two moments:

1. **Run start.** Every current file is downloaded into the deployment's `fileSpaceMountPath` (default `files`), so `notes/a.md` lands at `files/notes/a.md`. Each file is checked against its SHA-256 first.
2. **Run end.** After the harness exits and before the workspace is cleaned up, every new or changed regular file under the mount path is written back, with the version the run started from as its base. Links are skipped, and files over `FileSpaces.MaxFileBytes` are reported as warnings.

In the middle of a run, the `garrison_files_*` MCP tools read and write the space directly, so an agent can pick up a file another agent just wrote without waiting for it to finish.

The KubernetesJob executor works the same way. The worker downloads the files and hands their bytes to the run pod; at the end the pod sends changed files back over its log line protocol, and the worker writes them with its own credentials. The pod never holds a credential. A pod relays files up to 6 MiB each (`RunOneCommand.MaxRelayedFileBytes`), which keeps one file per protocol line under the worker's line limit.

Every write-back is fenced by the run's lease: a worker that no longer holds the lease at the run's epoch gets 409 `StaleFileUpload`, and nothing is written.

## Conflicts

Writes are optimistic per path. Each write carries the version its writer read (0 for a new file). If the file changed since, the write is kept next to it under a conflict name and nothing is overwritten:

```
notes/source-3.md                 version 2, written by the run that got there first
notes/source-3.run_mvt0abcd.md    the other run's version, kept under a conflict name
```

The tag before the extension names the writer: the run identifier for runs, `user-...` for uploads. A run whose write-back conflicts gets a `FileConflict` warning event naming both paths, and an MCP write that conflicts says so in its result (`conflict: true` and the path it used). The fan-out instructions ask parallel children to write into their own subfolders, which avoids most conflicts in the first place.

A write without a base version (a REST upload without `baseVersion`, or an MCP write without it) replaces the file unconditionally.

## Versions and deletes

Every write creates a version with its size, SHA-256, media type, and writer (`runId` and lease epoch for runs, the principal's name for uploads). Deleting a file marks it deleted; its versions stay until the space is removed.

## Limits and retention

| Setting | Default | Range | Environment |
|---|---|---|---|
| `FileSpaces.MaxFileBytes` | 33554432 (32 MiB) | 1024 to 268435456 | `GARRISON_FILESPACES_MAX_FILE_BYTES` |
| `FileSpaces.MaxTotalBytes` | 268435456 (256 MiB) | 1048576 to 10737418240 | `GARRISON_FILESPACES_MAX_TOTAL_BYTES` |
| `FileSpaces.MaxFiles` | 1000 | 1 to 100000 | `GARRISON_FILESPACES_MAX_FILES` |

A write over a limit answers 413 with code `FileTooLarge`, `FileSpaceFull`, or `TooManyFiles` and names the setting. Deleted files do not count.

A space lives as long as its owner. When retention removes the conversation, pipeline run, or root run, the next retention pass removes the space and its content.

## Using it

### From the harness

The default system prompt tells the harness where the files are (through the protected fragment `builtin/garrison-files-instructions`). The tools:

| Tool | Arguments |
|---|---|
| `garrison_files_list` | optional `includeDeleted` |
| `garrison_files_read` | `path`, optional `version` |
| `garrison_files_write` | `path`, `content` or `contentBase64`, optional `mediaType`, `baseVersion` |
| `garrison_files_delete` | `path` |

A run token always uses its own tree's space; a path in another tree answers `NotFound`. Users and credentials pass `conversationId` or `runId`, and need Read (or Update, to write) on that conversation or run.

### Over REST

```bash
B=http://127.0.0.1:8700/v1.0/api/tenants/default/conversations/cnv_.../files
H=(-H "Authorization: Bearer $TOKEN")

curl -s "${H[@]}" $B                                                  # list
curl -s "${H[@]}" -X POST $B -H "Content-Type: application/json" \
  -d '{"path": "sources.md", "content": "- https://example.com", "baseVersion": 0}'
curl -s "${H[@]}" "$B/content?path=sources.md" -o sources.md          # read
curl -s "${H[@]}" "$B/versions?path=sources.md"                       # history
curl -s "${H[@]}" -X POST "$B/download-url?path=sources.md"           # link that needs no credentials
curl -s "${H[@]}" -X DELETE "$B?path=sources.md"
```

The same routes exist under `/runs/{id}/files` for trees without a conversation. See [REST_API.md](../REST_API.md).

### Live updates

Subscribe to `conversation-files:{conversationId}` on the WebSocket (`/v1.0/ws`) to receive `files.changed` with the changed paths and versions whenever a turn, a child, or a user changes the space. See [WEBSOCKETS_API.md](../WEBSOCKETS_API.md).

## File spaces, artifacts, and continuation

Artifacts and file spaces both hold files a run produced, but they answer different questions:

| | Artifacts | File space |
|---|---|---|
| Selected by | The deployment's `artifactGlobs` | Everything under the mount path |
| Belongs to | One run | A conversation, pipeline run, or delegation tree |
| Seen by later runs | No | Yes, synced in at every run start |
| Versions | One per run | Per path, across runs |
| Conflicts | Not applicable | Kept under conflict names |

A continuation checkpoint leaves the mount path out of its archive, because the space already holds those files and a resumed run syncs them in again, including anything its children wrote while it was suspended. See [CONTINUATION.md](CONTINUATION.md) and [ARTIFACTS.md](ARTIFACTS.md).

## A worked example on the fake harness

The fake harness writes its answer to a file with `--output-last-message`, and answers with a file's content with `--scenario`. The harness runs in the run's workspace, so relative paths land under the mount path. Two pipeline stages show a file moving between separate workspaces:

```yaml
apiVersion: garrison/v1
kind: Agent
metadata: { name: fs-writer }
spec: { description: Writes its answer to files/handoff.txt }
---
apiVersion: garrison/v1
kind: Deployment
metadata: { name: fs-writer }
spec:
  agent: fs-writer
  harnessProfile: builtin/fake
  argumentOverrides:
    - { position: 0, operation: Append, template: "--output-last-message" }
    - { position: 1, operation: Append, template: "files/handoff.txt" }
---
apiVersion: garrison/v1
kind: Agent
metadata: { name: fs-reader }
spec: { description: Answers with files/handoff.txt }
---
apiVersion: garrison/v1
kind: Deployment
metadata: { name: fs-reader }
spec: { agent: fs-reader, harnessProfile: builtin/fake, parameters: { scenario: files/handoff.txt } }
---
apiVersion: garrison/v1
kind: Pipeline
metadata: { name: fs-handoff }
spec: { stages: [ { name: write, agent: fs-writer }, { name: read, agent: fs-reader } ] }
```

Start the pipeline with any input; the second stage's answer is the first stage's answer, read from the shared space.
