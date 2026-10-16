# Installed CLI session compatibility

Run `scripts/check-session-compatibility.sh IMAGE` against a candidate worker image.
Set `GARRISON_SESSION_GEMINI=true` when the candidate was built with
`--build-arg INCLUDE_GEMINI=true`. The CI matrix checks both image variants; the
Gemini variant additionally runs the pinned Gemini CLI recorded reader.

The gate restores committed first-turn recordings into an empty isolated HOME and
runs the actual installed Claude, Codex (exec and app-server), Mux, and provider-api (and optional Gemini) resume commands. A local protocol
server requires both the original marker and the new marker in the resumed provider
request. The container has no external network and receives no real credentials.
The gate fails when a candidate CLI cannot read the saved history or when the
seeded profile, recording metadata, and explicit format contract disagree. It never updates
recordings automatically.

The fixtures were written by the pinned worker image's actual CLI commands, using
only dummy credentials and a local provider response. Generated vendor system
prompts, environment attachments, and developer instructions were removed from
Claude/Codex recordings. The sanitized recordings were then resumed successfully
by those same installed CLIs. The remaining envelopes and conversation records are
recorded output, rather than an invented approximation of their schemas.

For an intentional reviewed format migration, record into a separate writable
fixture directory with `driver.mjs --harness=NAME --capture=true`, inspect the diff,
and run the ordinary read-only gate afterward. Updating a CLI version must first
prove it reads the old recordings; replacing recordings alone does not establish
backward compatibility.

This checks persisted history compatibility, independently of the credentialed
Compose checkpoint/worker replacement/tool effect gate in
`scripts/check-continuation-compose.py`. It does not prove provider reliability or permission semantics. The default image gate exercises five reader paths; the
Gemini-enabled image exercises six.

Pinned contracts: Claude `claude-project-jsonl-v1`; Codex exec/app-server
`codex-rollout-jsonl-v1`; Mux `mux-session-json-v1` (schemaVersion 1);
Gemini `gemini-chat-jsonl-v1` (metadata/message/update JSONL); provider-api
`garrison-provider-history-json-v1` (provider/endpoint/model plus message list).
The generic snapshot manifest validates format and session identity for all
harnesses. Only Claude requires project-directory relocation in that hook.
Other recordings use the same logical workspace path on another node; path
relocation beyond those validated contracts requires separate compatibility proof.
