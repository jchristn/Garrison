# The site-reliability organization

A small organization of keepers that look after a public site. The reliability lead is the CEO and an executive: it reads its keepers' reports, briefs the board, and proposes changes to the units below it. Three keepers each watch one thing, and a curator keeps the lead unit's shared memory tidy. Peer lines let a keeper hand a problem to the one whose job it is, change rules say which proposals apply without a person, and an approved eval set guards hiring.

This is walkthrough 11.2 of `AUTONOMOUS_AGENTS_PLAN.md`. The guides behind it are [organizations](../../../docs/ORGANIZATIONS.md), [executives](../../../docs/EXECUTIVES.md), [messaging](../../../docs/MESSAGING.md), [reports](../../../docs/REPORTS.md), [escalations](../../../docs/ESCALATIONS.md), [evals](../../../docs/EVALS.md), and [agent memory](../../../docs/AGENT_MEMORY.md).

## The chart

| Unit | Lead | Mandate | Daily budget | Peer lines |
|---|---|---|---|---|
| `reliability` (root) | `reliability-lead`, the CEO, with `managementAccess: OrgSubtree` | `reliability-lead-brief`, a brief every 24 hours | 10 US dollars | |
| `uptime` | `uptime-keeper` | `uptime-watch` | 2 | `latency` |
| `latency` | `latency-keeper` | `latency-watch` | 2 | `uptime`, `dependencies` |
| `dependencies` | `dependency-keeper` | `dependency-watch` | 3 | `latency` |

`memory-curator` is a member of `reliability` with the mandate `memory-curation`. It runs once a day on `builtin/memory-curator-system` and merges duplicates in the unit's shared memory. Every mandate also has a per-tick and a per-day budget, and the organization freezes a unit whose subtree spends 10 percent past its budget.

## Files

| File | What it holds |
|---|---|
| [org.yaml](org.yaml) | Two system prompts, the five agents, their mandates, and the `site-reliability-org` organization |
| [fake-harness.yaml](fake-harness.yaml) | The `autonomy-script` profile and the five deployments on it, each scripting one tick of the walkthrough |
| [claude-code.yaml](claude-code.yaml) | The same five deployments on Claude Code |
| [eval-set.json](eval-set.json) | The eval set `driver-upgrade-checks`, three cases a driver-upgrade worker must pass |
| [change-rules.json](change-rules.json) | Two change rules: hires in `dependencies` gated on that eval set, and keeper wake tuning between 2 minutes and a day |
| [proposal/driver-upgrade.yaml](proposal/driver-upgrade.yaml) | The new agent and deployment the lead proposes |

Manifests have no kind for change rules or eval sets yet, so those two files are created over REST after the apply. Rules and sets name the organization and unit by name, so the files carry no identifiers.

## Apply it

On the fake harness (no credentials):

```bash
B=http://127.0.0.1:8700/v1.0/api/tenants/default
H="Authorization: Bearer $TOKEN"
awk 'FNR == 1 && NR > 1 { print "---" } { print }' org.yaml fake-harness.yaml \
  | curl -s -X POST "$B/manifests/apply" -H "$H" -H "Content-Type: application/yaml" --data-binary @-

# The eval set, approved by a person, then the change rules that gate on it.
SET=$(curl -s -X POST "$B/eval-sets" -H "$H" -H "Content-Type: application/json" --data-binary @eval-set.json | jq -r .id)
curl -s -X POST "$B/eval-sets/$SET/approve" -H "$H"
jq -c '.[]' change-rules.json | while read -r rule; do
  curl -s -X POST "$B/change-rules" -H "$H" -H "Content-Type: application/json" -d "$rule"
done
```

For Claude Code, apply `org.yaml` with `claude-code.yaml` instead, after creating a secret named `claude-credential`. Give each keeper's mandate signals that describe the real checks for your site.

The approval matters: a change rule with `gateEvalSet` is refused (`EvalSetNotApproved`) until a person approved a version of the set, and an executive cannot approve one.

## What happens

Every mandate is new, so all five keepers tick within a few seconds of the apply. On the fake harness the round looks like this:

1. **Message.** The latency keeper sees checkout p95 at 520 ms, mostly database time. The database is not its job, so it sends an `Urgent` message to `dependency-keeper` along the `latency`/`dependencies` peer line, reports the latency as `Degraded`, and completes `Attention`.
2. **Report.** The urgent message wakes the dependency keeper (wake source `Message`), and the tick input carries it through `builtin/inbox-delivery`. It finds pgdriver 4.2.1 behind 4.3.0, files an `Incident` report with health `Degraded`, stamped with the `dependencies` unit, and completes `Acted`. If its first tick was already running when the message arrived, the message rides along on the next one, so you may see the report twice.
3. **Brief.** The reliability lead's tick input carries both reports through `builtin/report-digest` and asks for the board brief through `builtin/board-brief`. It files a `Brief` with audience `Board`, which shows on the Board view with the spend against the budget.
4. **Escalation.** The uptime keeper sees two failures in 10 minutes and asks the on-call role (`AgentOperator`) whether to fail over, then completes `Escalated`. Answer it in Autonomy > Escalations; the answer wakes the keeper.
5. **Curation.** The curator lists the `reliability` unit's shared memory and completes `Quiet`.

Organizations > Organizations shows the chart, the reports, and the open escalation. Autonomy > Messages shows the urgent message as `Delivered`.

## The proposal

The walkthrough ends with the lead hiring a driver-upgrade worker. An executive does that as a studio draft:

1. `garrison_studio_create_draft`, then `garrison_studio_put_item` for the Agent and Deployment in [proposal/driver-upgrade.yaml](proposal/driver-upgrade.yaml), and for the live Organization document with `driver-upgrade` added to the `dependencies` members.
2. `garrison_studio_validate` says the draft is valid and that the hire is held by the eval gate (`EvalGatePending`). Asking to apply now leaves a pending approval for a person.
3. `garrison_run_eval` with `set: driver-upgrade-checks`, the draft, and `agent: driver-upgrade` runs the three cases on an eval copy of the new worker. Live configuration does not change.
4. Once the eval run scores 1, validation shows the "Dependency unit hires" rule covering the hire, and `garrison_studio_request_apply` applies it at once with decision source `Rule`. The pending approval is superseded.
5. The apply is a new organization revision with the draft and an undo draft attached, so the rollback button on the Board view undoes it.

The fake harness cannot carry the draft identifier from one call to the next, so on the fake variant this part runs over MCP with the lead's run token. The examples Touchstone suite (`examples-sqlite`, `examples-postgresql`, case `site-reliability-org`) does exactly that after playing the round of ticks. A lead on Claude Code makes the same calls itself, guided by `reliability-lead-system`. The walkthrough's shadow trial is optional: add one with `garrison_start_shadow_trial` before asking to apply if you want the evidence on the proposal.

## Make it your own

- Each keeper's `signals`, `healthyDefinition`, and `autonomy` are where the real checks go. Keep `autonomy` narrow; anything outside it becomes an escalation.
- Change rules are the board's standing yes. Add a `PromptRetune` or `ModelChange` rule on a unit to let the lead retune it without asking. Budget increases, authority changes, and changes to the lead's own unit always need a person, whatever the rules say.
- The eval set is the bar a new worker must clear. Add cases from real runs (`sourceRunId`) and approve the new version; a gate always uses the latest approved version.
