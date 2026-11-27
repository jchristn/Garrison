# Autonomy story trials (AA12.7)

These are the four short trials from Part I of `AUTONOMOUS_AGENTS_PLAN.md` ("How we'll know it works"), run on a real harness. AA-076 replaced the month-long keeper trial with short runs, so each trial lasts minutes to an hour. Round 1 found the bugs; round 2 fixed them and reran each trial until it passed twice in a row on one model.

## Round 2 (2026-11-27)

Result in one line: on qwen3.8:27b the keeper, team handoff, and board trials passed at least twice in a row, and the org trial passed once and partly a second time, after nine Garrison defects the reruns exposed were fixed. The team tied the generalist instead of beating it, because both reached the task's ceiling.

| Trial | Part I test | Round 1 (gpt-oss:20b) | Round 2 (qwen3.8:27b) |
|---|---|---|---|
| Keeper | Catches a real failure and escalates exactly what it should | Partial: a second escalation after the answer | Passed 3 runs in a row: one escalation per outage, the answer recorded and followed |
| Team | Three specialists hand work on with no person relaying, and beat one generalist | Failed: stalled at hop 3 | Handoff passed 2 runs in a row (8 and 9 hops, 20 of 20). Tied the generalist at 20 of 20, so "beat" is not shown |
| Org | A proposed structural change is approved and measured outcomes improve; a bad change is obvious in its diff | Partial: the bad-change diff was misleading | Run 1 passed: the lead proposed the peer line on its first tick, a person approved it, and delivered handoffs went from 0 of 2 to 2 of 2. Run 2 passed every step but had no handoff left to measure after the approval. The bad-change diff reads plainly in both |
| Board | The brief explains what happened | Failed: "all keepers Healthy" while latency was Degraded | Passed runs 3 and 4 in a row. Runs 1 and 2 each repeated a stale "pending" proposal, which two fixes to the facts addressed |

### Setup

| Item | Value |
|---|---|
| Date | 2026-11-27, 03:00 to 20:00 UTC |
| Branch | `aa12-trials2`, from `feature/autonomous-agents` at `cd53990b`, rebased onto `83760ac1` |
| Control plane | `Garrison.Server`, Sqlite, REST 8770, MCP 8771, liveness 8772, agent memory on, run from a copy of the build so rebuilding did not touch it |
| Worker | One `Garrison.Worker`, health 8773, metrics 8774, three concurrent runs |
| Harness | Mux 1.8.0 (`builtin/mux`), Ollama adapter, `contextWindow` 131072, `maxTokens` 32768, `noProgressSeconds` 900 |
| Model | `qwen3.8:27b` on Ollama at `http://192.168.86.31:11434/v1` for every trial that counts |
| Mock services | `python3 -m http.server` on 127.0.0.1:8775 (keeper), the round 1 JSON site on 127.0.0.1:8776 (org) |
| Manifests | The examples as they are in the repository, not edited copies: no tool-name paragraph (the harness profile handles it now, d6117ee0), Mux's default `sandbox` (`workspace-write`), and only the signals pointed at the mock services |

Models other than qwen3.8:27b did not run. Every `:cloud` model on that Ollama server answered HTTP 401 `{"error":"Unauthorized"}` (the server is not signed in to ollama.com). qwen3.6:35b loaded once for a speed check, then never answered again while qwen3.8:27b stayed resident: a team run and a direct `curl` both waited minutes with no output. gpt-oss:120b did not load within 300 seconds. The user then chose to stay on qwen3.8:27b. Another client was using the same Ollama server during the session, which is why some ticks ran for many minutes; timeouts were raised from round 1's 300 to 600 seconds for the gerbil, 900 for the org keepers, 1500 for the lead and the team, and 2400 for the generalist.

Spend: Garrison recorded $0.00, as in round 1 (no rate for a local model). The 153 runs of the session used 19.7 million input and 0.56 million output tokens.

### Keeper trial

The gerbil example (`examples/autonomous/gerbil`) watched a `python3 -m http.server` page on 127.0.0.1:8775 and a heartbeat file a shell loop touched every minute. Each trial ran the same script: a healthy tick, two ticks with the server stopped, the on-call answer `wait` ("The provider is on it. Keep watching."), two more down ticks, then recovery. Every tick was a manual wake, so the script could step through an outage in minutes.

| Run | Model | Ticks | Escalations | After the answer | Verdict |
|---|---|---|---|---|---|
| `k-qwen38-1`, 03:21 to 03:27 | qwen3.8:27b | Quiet, Attention, Escalated (`esc_mwyf392t_VsZGAWZgluOg6SmBJPD`), Attention (answer wake, `run_mwyf3lta_uz7MTJfr6AlxoHrNPYM`), Attention, Quiet | 1 | Wrote `on-call-instruction`, did not ask again | Pass |
| `k-qwen38-2`, 04:21 to 04:57 | qwen3.8:27b | Quiet, timed out, Escalated (`esc_mwyhq0uz_OshPatAqnpFpOd92nra`), timed out (answer wake), Attention, timed out, Acted | 1 | The timed-out answer tick still wrote `on-call-instruction` before the deadline; the next tick followed it | Pass on behavior; 3 of 8 ticks hit the 300-second deadline while another client loaded the model server |
| `k-qwen38-3`, 05:04 to 05:45 | qwen3.8:27b | Quiet, Attention, Escalated (`esc_mwyje29e_GB5llHIdOkrNshuatGe`), Attention (answer wake, `run_mwyjkt3h_r9klBBkj4qlNpJxPqJ7`), Attention, Attention, Quiet | 1 | Recorded the answer, three more down ticks without asking again | Pass |

Run 1 used the gerbil prompt as it was; runs 2 and 3 used the revised prompt (it asks once per outage, below). The deadline for runs 3 on was 600 seconds.

**Before and after.** Round 1, on gpt-oss:20b: the answer tick tried to record the instruction, got `Forbidden` (blank `agent`), and raised a second escalation, which Garrison re-raised twice. Round 2: one escalation per outage in all three runs, and every answer tick wrote `on-call-instruction` on the first try. `last-seen-healthy` and `consecutive-down` were kept across ticks and reset on recovery.

**Part I test: passed, three runs in a row on qwen3.8:27b.** The keeper caught each outage on the second down check, asked once with the time it last saw the page healthy, followed the answer, and went Quiet on recovery. As in round 1, a person watching the page would also have caught it; the trial shows the mechanics.

### Team trial

The task, the hidden checks, and the three specialists were round 1's, with two changes. Each run used a fresh set of agents (`t4-reviewer`, `t5-reviewer`, and so on), so no memory, mail, or thread carried over. The generalist ran after the team finished instead of alongside it, so the two never shared the model server. Specialists allowed 24 turns and 1500 seconds, the generalist 60 turns and 2400 seconds.

| Run | Hops | Outcome | Team score | Generalist |
|---|---|---|---|---|
| `t-qwen38-1` (team-*, 03:45) | 4 | Stalled. The tester saved its test file with `garrison_files_write`, told the reviewer it was "in the shared file space", and the reviewer could not see it | none | Failed: no output for 300 seconds |
| `t-qwen38-2` (team-*, 06:13) | 1 | The tester spent 6.5 minutes before its first tool call and hit the 600-second deadline | none | Answer 20/20, but the run was recorded `Failed` (Mux exit 2) |
| `t-qwen38-3` (team-*, 06:33, stopped) | 6 | The reviewer's later runs could not see the specification the person had sent its first run, and it escalated for it (`esc_mwymlmrc_2BIif6dfXjqPNLZXDwG`) | none | not run |
| `t-qwen38-4` (t4-*, 07:32) | 2 | The tester replied with no urgency, so the reply was Normal and never woke the reviewer, which has no keeper. Its own run was recorded `Failed` after one refused `write_file` | none | 20/20 |
| `t-qwen38-5` (t5-*, 09:12 to 10:03) | 8 | Reviewer, tester, reviewer, fixer, reviewer, fixer (a second fix for `-$-5`), reviewer, fixer, then the reviewer filed `rpt_mwyszzfm_8YNAvO1c35fhe37kKsH` | 20/20 | 20/20 (`run_mwyt4g4c_SB0UYf1qbnp2CKthQcA`) |
| `t-qwen38-6` (t6-*, 10:04 to 11:06) | 9 | Reviewer, tester, reviewer, fixer, reviewer, tester, reviewer and fixer, then `rpt_mwyvegwc_kQSY4Ikm7d7iP4X9aR9`. Three late messages at hop 9 were refused with `HopLimit` | 20/20 | 20/20 (`run_mwyvfhrs_wWVFf8rm3tpoojpnNhf`) |

Runs 1 to 4 each stopped on a Garrison defect, fixed before the next run (Findings below), except run 2's slow first tool call. Runs 5 and 6 passed. In both, the only message a person sent was the goal (`amg_mwyrjh7f_EE3XUkSeyTsChUSkXpf`, `amg_mwytdpdd_locviyMnJedR1hK41o1`), every handoff carried its content in the body, and the reviewers called `garrison_read_thread` 12 times across the two runs to reread the goal and earlier test files.

**Before and after.** Round 1: the handoff stalled at the third hop and the team produced nothing. Round 2, runs 5 and 6: eight and nine hops, a corrected module that passes all 20 hidden checks, filed as a `Handoff` report with no person relaying.

**Part I test: the handoff part passed twice in a row on qwen3.8:27b; "better than one generalist" did not.** Both sides scored 20 of 20, the ceiling of this task, so the team tied. It also took 43 and 57 minutes against the generalist's 7 and 5. A task this small does not need three specialists; a harder task, or one the generalist cannot hold in one context, would be the fair test.

### Org trial

The same organization and planted fault as round 1: `examples/autonomous/site-reliability-org` with the `latency` unit's peers set to `[uptime]`, so the latency keeper has no line to the dependency keeper, and the JSON site showing checkout p95 520 ms (430 ms in the database) and pgdriver 4.2.1 against 4.3.0. The example prompts now carry two lines round 1 added by hand: keepers report a refused message with its code, and the lead proposes a missing peer line with `ConnectUnits` when a keeper reports `NoLine`. Organization `org_mwyvmcf7_hfeKQwghZpI3dr9KJRH`.

**Run 1 (`o-qwen38-1`, 11:06 to 12:27).**

Before (revision 1). Every keeper ticked on apply. The latency keeper tried the dependency keeper twice (`amg_mwyvsxt8_zSixgVPkTf98SbDTPLv`, `amg_mwyw4hep_Ff3ffFir1T4g1iy80e0`), both refused `NoLine`, and both of its reports named the refusal. The dependency keeper's own first report (`rpt_mwyvq4wc_AN02I4cdW4ltRT84H1G`) already called pgdriver Degraded, one minor release behind with the pool-leak fix. On its first tick (`run_mwyvmgio_0dLpHBToFM9TQEdscwJ`) the lead read the refusal, relayed the handoff itself along its reporting lines (`amg_mwyw2oeo_DbHgrQGlXJFtlBxEMpK`, Normal), and proposed `sdr_mwyw3sgj_yRfOYOCh5hNXIMUbdcB`, "Add peer line latency <-> dependencies". The diff was one change, `units.latency.peers.dependencies`, and no change rule covered it, so it waited for a person.

The proposal. I approved it at 11:34 (`decisionSource` `User`), which published revision 2.

After (revision 2). I woke the latency keeper twice.

| Measure | Before | After |
|---|---|---|
| Latency-to-dependency messages sent | 2 | 2 (`amg_mwywnd93_S5HsICmliYP8GGMqSxQ`, `amg_mwywxche_583sZKWkXszA4fgxUcf`) |
| Delivered | 0 (both `NoLine`) | 2, after 3.7 s and 55 s |
| Dependency keeper woken by them (wake source `Message`) | 0 | 2 |
| Dependency keeper ties the driver to the latency | Not asked | Yes. `rpt_mwywu7xe_qHKTY0jmMvZmnG9rR65`: the 430 ms "is consistent with connection-pool contention from the 4.2.1 leak", with a caveat that it has no pool gauge. It replied to the latency keeper and pushed the lead for a decision |
| Decision reaches a person | No | The lead escalated "approve pgdriver 4.3.0?" to the board (`esc_mwyx9u3y_EcREgNPjzKEFFQiqKEI`) |

The bad proposal. Board direction at 12:04 (mandate revision 2, source `Board`) told the lead to propose removing the uptime unit to cut costs. Unlike round 1's gpt-oss:20b, the lead did it, and said what was wrong with it: draft `sdr_mwyy95uf_SCXlUXzk2zhhVJpU3Ld`, validated, apply requested, and a brief (`rpt_mwyyfx5n_pDtKO64fbilQVROgNsw`) noting that it "lands mid-incident and removes uptime visibility". Its diff, and the diff of the same change made by a person in a draft, are now three lines that say what happens: `units.uptime` "unit uptime (lead uptime-keeper; budgets Day (amountUsd 2); under reliability)" to none, `units.latency.peers.uptime` to none, and `live` to published. Round 1's positional diff showed renames and a budget rise instead. I denied the proposal.

Re-applying the example manifest afterwards failed with `OrganizationDrift`: "this document would undo them: units.latency.peers.dependencies: dependencies to none ... or apply again with force=true". Round 1's re-apply silently removed the approved peer line.

**Run 2 (`o-qwen38-2b`, 16:24 to 17:50).** A first attempt at 14:43 reset run 1's organization with a forced manifest apply, but the agents kept their mail, threads, and the board's earlier decisions, so the keepers carried on from run 1 instead of meeting the fault fresh, and a restart left the worker down for an hour (it could not bind its health port while the old one drained). Run 2 therefore deleted the organization, its mandates, deployments, and agents and applied the example again, so every agent was new (organization `org_mwz6zeon_e4VuUXnfpcF9x0bO7Gz`).

Before: the same as run 1. Two `NoLine` refusals (`amg_mwz748p0_Ub4xXWOgjgsVGkQg4jG`, `amg_mwz7p08c_3ivgckAgJ7cbfRd2zdk`), both reported; the lead relayed the finding (`amg_mwz7i85h_p49u6eQlAFmcYNevftU`, Urgent) and proposed `sdr_mwz7i85q_u6vlbb2gYwJSrikRITR`, the same one-line peer-line change, on its first tick. The dependency keeper answered the relay and called pgdriver 4.3.0 "the leading cause of the p95 miss" (`rpt_mwz7qrnw_nWD8Lxck10vN3TFkecD`).

I approved at 17:05 (revision 2). After: the latency keeper's two woken ticks sent nothing new to the dependency keeper. The relay had already handed the problem over and the fix was "staged, pending the maintenance window", so there was no second handoff to measure. Both ticks filed their report and then ran out the 900-second deadline before `garrison_keeper_complete_tick`, minutes passing between model calls. The lead recorded that the peer line was live and "relay retired". The board direction to remove uptime did not produce a proposal this time; the lead's tick after it handled other mail. A person's `RemoveUnit uptime` draft showed the same plain three-line diff as run 1, and re-applying the manifest failed with `OrganizationDrift` again.

**Part I test: run 1 passed; run 2 passed on the proposal, the approval, the diff, and the drift guard, but showed no measurable improvement, because the lead had already worked around the missing line through its reporting lines before a person approved the fix.** That is the lead doing its job, not a Garrison defect, but it means the trial's before and after only differ when the keepers have something new to hand off after the approval. Two passes in a row were not reached in the time available; a third run would need a fault the lead cannot relay around, or a second finding that arrives after the approval.

### Board trial

For each run the lead's mandate had `briefIntervalHours: 1` and no standing direction (the board withdrew the cost direction after denying the removal), and the mandate stayed paused until a brief was due, an hour after the lead's last one, so the next tick carried the `builtin/board-brief` section with the facts. Runs 1 and 2 used organization run 1's agents; runs 3 and 4 used run 2's. Between runs 1 and 2 the board answered the open escalation with `hold`.

| Run | Brief | Agrees with the board view | Wrong or missing | Verdict |
|---|---|---|---|---|
| 1, 13:31 (`run_mwz0mhxi_SmNOuVYhHtaogJV7oyi`) | `rpt_mwz0sbo1_H9e4v9WnfFabNfXVYLP` | Yes: reliability, latency, and dependencies Degraded, uptime Healthy, the lapsed and re-raised escalation, spend $0 of each budget | Called the uptime removal "still awaiting a person"; the board had denied it. The facts left out the denial (fixed in 8c80a58f) | Failed on a Garrison defect |
| 2, 14:34 (`run_mwz31qrd_GbCAennryWVGHAefS7Z`) | `rpt_mwz39h6h_SPnxpGNfrGesfNqraN5` | Yes, and it led with the board's Hold answer, relayed to both keepers | Repeated the same "still pending" claim from its own notes; the facts were silent when nothing waited (fixed in 9c671be0). The first attempt at 14:31 failed outright: the restart had broken the deployments (Finding 9) | Failed on a Garrison defect |
| 3, 18:41 (`run_mwzbuzaw_gZ2u0uOkBrYJ2AFI6MV`) | `rpt_mwzcafhe_QLZkATGktidN0ekNjch` | Yes: each unit's health "per the board record", "no org revision was published in this period, no proposal is waiting, and no escalation is open", spend per unit | Nothing wrong. It also explained a gap the board view does not show: the uptime keeper's missing report was its own tick timing out, not an outage | Passed |
| 4, 19:54 (`run_mwzegj8t_IeOhgqjepdBavoDuaVZ`) | `rpt_mwzekrmf_mIjpyYhlBx0gMGalV7A` | Yes: "Not healthy per the board record: latency (Degraded) and dependencies (Degraded); uptime Healthy", "no organization revision was published, no proposal is waiting on a person, and no escalation is open", spend per unit | Nothing wrong. Its one new item was a dependency keeper report that two of that keeper's ticks had timed out | Passed |

Run 3 was after organization run 2, with new agents, so it is not a continuation of runs 1 and 2. In every run the brief named the open decision and what the CEO planned next, and spend was reported against each budget; as in round 1, $0.00 recorded spend makes that line uninformative on a local model, and run 3's lead said so ("a possible cost-telemetry gap, not confirmed zero spend").

**Before and after.** Round 1's requested brief: "All keepers report Healthy. No incidents." while the board view showed latency Degraded, and nothing about the approved peer line. Round 2 runs 3 and 4: every unit's health as the board view shows it, every decision and open question, and nothing claimed that the record contradicts.

**Part I test: passed twice in a row on qwen3.8:27b (runs 3 and 4), after the two defects runs 1 and 2 exposed were fixed.** A person reading only these briefs would know the state of every unit, what the board had decided, and what was waiting on them. The second half of the Part I test, the board spending less time each week, still cannot be measured in a day.

### Round 1 bugs, checked again

| Round 1 finding | Round 2 |
|---|---|
| 1. Blank `agent` or `scopeId` refused memory writes | Gone. Every keeper and org run wrote memory on the first try |
| 2. Organization diffs compared units by position (a1de864c) | Gone. Removing `uptime` reads as `units.uptime` removed plus its peer line, and re-applying the manifest over the approved peer line fails with `OrganizationDrift` |
| 3. Prompts named tools Mux calls something else (d6117ee0) | Gone. No tool-name paragraph in any prompt. In 153 runs one call missed (`garrison.garrison_complete_tick`, keeper run 3, a name no Garrison tool has); the model then called `garrison.garrison_keeper_complete_tick` |
| 4. An empty answer counted as success (d6117ee0) | Not seen. No run in 153 ended with `EmptyResponse` |
| Keeper re-escalated after "wait" | Gone. One escalation per outage in three runs; the answer tick wrote `on-call-instruction` every time |
| Team stalled on a file it never attached | Fixed (380ba8c9, d9dbe50f), and the recipient now asks for missing content instead of searching the disk |
| Board brief "all Healthy" while latency was Degraded | Fixed (380ba8c9, 8c80a58f, 9c671be0) |
| `sandbox: none` let an agent list files outside its workspace | Expected, and not specific to `none`. Measured on Mux 1.8.0: `workspace-write` (the default) also lets a shell command read and write outside the workspace and reach `127.0.0.1`; `read-only` refuses `run_process` and `write_file` but still lists other directories. `docs/HARNESSES.md` and `docs/SECURITY.md` now say so (380ba8c9). Isolation for Mux runs comes from the executor |

### Findings and fixes

Each fix has a Touchstone case and passed its targeted suites on Sqlite and PostgreSQL.

1. **Fixed (380ba8c9, 8c80a58f, 9c671be0): a board brief had nothing to brief from.** `builtin/board-brief` asked for a brief and gave only the organization's name; the CEO saw reports filed since its last tick and nothing else. The section now carries Garrison's own record since the last brief (unit health from each unit's latest report, spend against budget, revisions published, proposals decided and waiting, open escalations, unhealthy reports, freezes, the kill switch) with agent-written text framed by random markers, and tells the CEO the brief must agree with it. Board run 1 then showed a gap: a denied proposal goes back to `Open`, which the facts skipped, so the brief called it "still awaiting a person"; 8c80a58f lists it as decided. Board run 2 repeated the claim from the CEO's own notes because the facts were silent when nothing waited; 9c671be0 says "No proposal is waiting for a person". Case `board-<provider>/brief-facts`.
2. **Fixed (380ba8c9): messages referred to files the recipient could not see.** `builtin/inbox-delivery` tells the recipient it cannot see senders' files and should reply to ask for missing content; the send and reply tools tell the sender to put everything in the body. Case `messaging-unit`.
3. **Fixed (d9dbe50f): the file space looked shared with message recipients.** `garrison_files_write` said "the user and other agents see it at once", so team run 1's tester saved its tests there and told the reviewer they were "in the shared file space". The files tools and fragment now say only the conversation's turns and delegated agents share it. The `NoLine` refusal also named only app edges; it now names reporting and peer lines too.
4. **Fixed (73f66928): a failed keeper tick lost what it carried.** Keeper run 2's answer tick timed out on the busy model server; its escalation answer stayed marked delivered to it and its messages stayed `Delivered`, so no later tick would carry them, and the next digest started after it. A tick that fails before it reports now hands the answers and mail back, and the digest window skips it. Case `escalations-<provider>/redeliver`.
5. **Fixed (76673ab8): a run could not reread earlier messages.** Every message wake starts a fresh session and `garrison_read_inbox` returns only queued mail, so team run 3's reviewer lost the specification a person had sent its first run and escalated for it. New run tool `garrison_read_thread` (Read on AgentMessage, not journaled) returns earlier messages the agent sent or received, per thread or across threads, through the new `builtin/message-history` template. Reviewers used it 12 times in team runs 5 and 6. Case `messaging-<provider>/thread`.
6. **Fixed (3a3bfd3f): Mux 1.8.0's exit 2 failed completed runs.** Mux exits 2 for `completed_with_errors`. `builtin/mux` accepted only 0, so team run 2's generalist, whose answer scored 20 of 20, was recorded `Failed`. The profile accepts 0 and 2. Case `parsers/mux-1.8.0-exit-2`.
7. **Fixed (b0f7351a): one refused Mux tool call failed the run.** The Mux parser treated any `tool_call_denied` (here a `write_file` outside the workspace) as fatal even when the model went on and completed. The completion status now decides.
8. **Fixed (a7a9cbf8): a reply without an urgency was always Normal.** Team run 4's tester answered the reviewer's urgent request without an urgency; the reply waited in the inbox of a reviewer that has no keeper, which only urgent mail wakes. A reply now keeps the original's urgency unless the run gives one. Case `messaging-<provider>/thread`.
9. **Fixed (9589d163): a server restart broke Mux deployments that use `baseUrl`.** `HarnessRuntimeMigration` runs at every start and moved each Mux deployment with a model and `baseUrl` (the documented legacy path) to a saved connection that kept neither, so after the 13:40 restart every org keeper and the lead ran `gpt-4o-mini` against `https://api.openai.com/v1` and failed with 404. It likely explains why round 1 had to apply its manifests again after its restart. The migration now skips such deployments. Case `provider-api-<provider>/mux-legacy-endpoint`.
10. **Fixed in the examples (380ba8c9): the gerbil asks once per outage, and the site-reliability keepers report refused messages and the lead proposes missing peer lines.** Round 1 added the last two by hand to the trial copies; they are now in `examples/autonomous`.
11. **Not a Garrison defect: the model shortens identifiers.** The dependency keeper kept message ids in its memory notes cut to 12 characters (`amg_mwyxq75w`), so `garrison_reply_message` and `garrison_read_thread` answered `NotFound`; it then wrote a new message instead. Ids are 31 characters and Garrison matches them exactly.
12. **Not a Garrison defect: speed.** On a shared model server qwen3.8:27b took up to 15 minutes for one org tick and up to 6.5 minutes before a first tool call. The team took 43 and 57 minutes where the generalist took 7 and 5.
13. **Noted, not investigated: the first ticks after a manifest apply recorded wake source `Timer`**, where a wake a person causes through the publish or resume routes records `Manual`.

### Reproduce

Build, start a Sqlite server and a worker on spare ports with `GARRISON_AGENT_MEMORY_ENABLE=true`, as `scripts/run-autonomy-example.sh` describes, with Mux and a model endpoint reachable from the worker. Apply the examples as they are, with their Claude Code deployments moved to `builtin/mux`:

```yaml
  model: qwen3.8:27b
  timeoutSeconds: 900          # the lead and the team specialists used 1500
  noProgressSeconds: 900
  parameters:
    baseUrl: http://<ollama host>:11434/v1
    adapterType: ollama
    contextWindow: 131072
    maxTokens: 32768
```

Point the mandate signals at services you control. Use a fresh set of agents for each team run, and run the generalist after the team, not beside it, when both share one model server. For a brief the board trial can check, set `briefIntervalHours` and wait until that interval has passed since the CEO's last `Brief`. Pause every mandate when you finish.

## Round 1 (2026-11-26, gpt-oss:20b)

The first run of the four trials, on Mux 1.8.0 with gpt-oss:20b, took about 50 minutes of wall time. It is kept as it was written; the findings it lists are checked again in round 2.

Result in one line: the keeper caught a real outage and escalated it, and the executive proposed a structural change that a person approved and that measurably fixed a handoff. The team trial and the board brief failed. The diff of a deliberately bad proposal hid the problem instead of showing it.

| Trial | Part I test | Result |
|---|---|---|
| Keeper | Catches a real failure and escalates exactly what it should | Partial. It went Quiet, Attention, Escalated on a real outage, then raised a second escalation after the answer |
| Team | Three specialists hand work on with no person relaying, and beat one generalist | Failed. The handoff stalled at the third hop, and the generalist did better |
| Org | An executive proposes a structural change, a person approves it, measured outcomes improve; a bad change is obvious in its diff | Partial. The change was proposed, approved, and improved the measurements. The bad-change diff was misleading |
| Board | The brief explains what happened | Failed. The brief requested at the end said all keepers were healthy while latency was degraded |

### Setup

| Item | Value |
|---|---|
| Date | 2026-11-27, 01:18 to 02:10 UTC (the evening of 2026-11-26 local time) |
| Branch | `aa12-trials`, from `feature/autonomous-agents` at `df2e3d85` |
| Control plane | `Garrison.Server`, Sqlite, REST 8750, MCP 8751, liveness 8752, agent memory on |
| Worker | One `Garrison.Worker`, health 8753, metrics 8754, three concurrent runs |
| Harness | Mux 1.8.0 (`builtin/mux`), with the Ollama adapter |
| Model | `gpt-oss:20b` on Ollama at `http://192.168.86.31:11434/v1`, context window 131072 |
| Mock services | `python3 -m http.server` on 127.0.0.1:8755 (keeper), and a small JSON site on 127.0.0.1:8756 (org) |

Claude Code 2.1.332 is installed on the machine, but it was not usable from a worker. It answered a one-line prompt in the shell that started this session. With the worker's environment (an isolated `HOME`, or any environment without that session's variables) it failed with "Not logged in" or "OAuth token revoked". So the trials ran on Ollama, the approved fallback. Before any trial, a direct `mux --print` call and a Garrison invoke of a throwaway agent (`probe`, run `run_mwyaqjcy_gLIIhgIlyb7NOJYsGM0`) both ran `curl` and answered correctly.

Each deployment used `sandbox: none` so that `curl` could reach the mock services. That also let one agent list directories outside its workspace (see the team trial). Do not copy that setting into anything real.

The deployments were the example ones (`examples/autonomous/gerbil/claude-code.yaml` and `examples/autonomous/site-reliability-org/claude-code.yaml`) moved to `builtin/mux`. Prompts got one extra paragraph each, explained in Finding 3.

### Spend

Garrison recorded $0.00 for every run. There is no rate for `gpt-oss:20b` on a local Ollama server, so cost estimation has nothing to multiply. The model ran on local hardware. The 27 runs used 3.52 million input tokens and 89.6 thousand output tokens in total.

Budgets were set as the user agreed: the site-reliability organization's root unit and the team unit had $10 a day each, and no mandate had more than $3 a day. Because recorded spend stayed at zero, the budget guard and the Board view's spend rows were never exercised. On this harness the board's "spend against budget" always reads 0 percent, which tells the board nothing.

### Keeper trial

The gerbil keeper (`examples/autonomous/gerbil/gerbil.yaml`) watched `http://127.0.0.1:8755/health` and a heartbeat file that a shell loop touched every minute. Mandate `gerbil-keeper` (`mdt_mwyar2lh_ZDDOT5GfBgKICe9Fhbd`), Backoff 900 to 14400 seconds, budgets $0.25 a tick and $2 a day.

| Time (UTC) | Wake | Run | Outcome | What happened |
|---|---|---|---|---|
| 01:22:34 | Timer | `run_mwyar2us_GL06Jckje1Sf1bQGslz` | Unreported | Checked the page (200) and the file, then called `garrison_memory_write` and `garrison_keeper_complete_tick` by those names. Mux names them differently (Finding 3), so both failed with `unknown_mcp_tool` |
| 01:26:16 | Manual | `run_mwyavugu_a1TmVt6glu8lMxrzl8L` | Quiet | After the prompt fix: page 200, file fresh. Interval 900 to 1800. Its memory write failed because it passed the mandate name as `agent` |
| 01:27:26 | | | | I stopped the HTTP server, so `curl` got connection refused (`000`) |
| 01:27:40 | Manual | `run_mwyaxnet_VIjHIUgqqwt7YvLHtEu` | Attention | Saw the page down and the file fresh. Wrote `consecutive-down` = 1 on its second try. Interval 1800 to 900 |
| 01:30:11 | Manual | `run_mwyb0vd4_hG8C5BNo6iIjC8y6v3J` | Escalated | Down twice, `consecutive-down` = 2, then `garrison_escalate` (Urgent, restart, wait, ignore) to the on-call role on its fourth try. Escalation `esc_mwyb1rkn_CHTcsE5qnJ04gIfiP6c`: "Status page down 4 minutes, last healthy 2026-11-27T01:26:16. Restart, wait, or ignore?" Its summary said the heartbeat was stale, which was wrong: it compared a local time to a UTC time |
| 01:31:14 | | | | I answered `wait` over REST |
| 01:31:17 | EscalationAnswer | `run_mwyb2aja_EIJbYWXjuoM3iBWDe2Q` | Escalated | The answer woke the keeper as designed. It tried to write `on-call-instruction` but got `Forbidden` (Finding 1). Then it raised a second escalation, `esc_mwyb3g6t_7N9Mp0jfIvq79N8NtMe`, with a 60-second timeout and `EscalateUp`. Garrison re-raised it twice before it expired |

I paused the mandate at about 01:34.

**Part I test: partial.** The keeper caught a real outage and escalated it after two failed checks. The intervals backed off and snapped back as designed, and the answer woke it. It did not escalate exactly what it should: after the answer it asked again instead of recording the instruction. The memory of yesterday also did not hold, because `last-seen-healthy` was never written. A person watching the page would have caught this outage too; the trial shows the mechanics, not a catch a person would miss. Spend: $0.00 for the keeper's five ticks.

### Team trial

The task was to fix `parse_amount`, a 15-line Python function with five bugs, against a seven-rule specification. Twenty hidden checks graded the result; I kept them off the agents' machines and ran them myself. The buggy module scores 13 of 20.

The team was three agents in a one-unit organization, `team-trial-org`, with $10 a day: `team-reviewer` (lead), `team-tester`, and `team-fixer`, each with its own system prompt. None had a keeper, so each urgent message started a `Message` run. The plan was: a person sends the goal to the reviewer once, the reviewer sends it to the tester, the tester's tests go back to the reviewer, the reviewer sends them on to the fixer, the fixer's code goes back to the reviewer, and the reviewer files the fix as a `Handoff` report. The generalist, `team-generalist`, got the same text as one invoke. Each specialist allowed 24 turns and 600 seconds per run; the generalist allowed 60 turns.

| Time (UTC) | Run | What happened |
|---|---|---|
| 01:43:23 | | I sent the goal to `team-reviewer` (`amg_mwybhuoj_3FVSfBcerCyMdzVcYe7`, Urgent). The only message a person sent |
| 01:43:23 | `run_mwybhuoo_R6GvvhajmJpzlWeNYaY` (reviewer) | Sent the tester the goal (`amg_mwybje0g_MuMcd7BhdyCabmekPma`, hop 1) |
| 01:44:43 | `run_mwybje0j_rZ711CagNwXRWqOHChu` (tester) | Spent all 8192 output tokens reasoning and returned nothing, with no tool calls. Garrison recorded Succeeded (Finding 4). I raised `maxTokens` to 32768 and retried it |
| 01:51:06 | `run_mwybrry6_VfSVVNGrUIYelDU8DB7` (tester, retry) | Wrote and ran tests, then sent the reviewer `amg_mwybyb98_zAjNc9dfiQislAQCreL` (hop 2) listing failing cases and saying "see the attached test file". It attached nothing and the body held no tests |
| 01:57:18 | `run_mwybyb9k_g1dhNuTrHftWEe0c9lX` (reviewer) | Looked for the test file on disk, wandered up through `/Users/...` (possible only because of `sandbox: none`), and timed out at 600 seconds. Nothing reached the fixer |
| 01:43:14 | `run_mwybhnf4_C7zlAVyfeExafmWpXqv` (generalist) | Timed out at 600 seconds while three runs shared one Ollama server. The last `amounts.py` it wrote scores 19 of 20 |
| 02:03:14 | `run_mwyc7dck_ZU8Juh9iwUBvqXDkQFK` (generalist, rerun with 1800 seconds and `maxTokens` 32768) | Wrote code and tests, ran them, and finished in under three minutes with an empty final answer. The last `amounts.py` it wrote scores 20 of 20 |

The comparison, plainly: the team did not beat the generalist. The team produced nothing, and its work stalled at the third hop. The generalist also failed to return its answer, but the module it left in its workspace passes all 20 checks. The relay itself worked: the goal and two agent messages along the unit's reporting lines each woke the next agent within seconds, and no person relayed anything after the goal. What failed was the content of a handoff, a reference to a file the recipient could not see. The prompts already said "nobody else can see your files". A 20-billion-parameter model did not follow that.

**Part I test: failed.** Spend: $0.00 for six runs.

### Org trial

This trial used `examples/autonomous/site-reliability-org/` with one deliberate structural fault: the `latency` unit's peer lines were `[uptime]`, so the latency keeper had no line to the dependency keeper. The signals pointed at a JSON site on 127.0.0.1:8756. On it, checkout p95 was 520 ms with 430 ms in the database, and pgdriver was 4.2.1 against 4.3.0, whose notes fix a connection-pool leak. Organization `org_mwyb6sav_ap1ASeBqK8UnWg4Vy0g`, root budget $10 a day, unit budgets $2, $2, and $3. The eval set and both change rules were created as the README says.

**Before (revision 1, 01:34 to 01:42).** All five keepers ticked on apply. The latency keeper saw the problem and sent the dependency keeper an urgent message twice (`amg_mwyb8ywd_Ya5OIdZlmaqZf1cUfS5` at 01:36:29 and `amg_mwybdsyk_mRdaBFhnbzRjn5uoDIF` at 01:40:14). Both were refused with `NoLine`. The dependency keeper's own report (`rpt_mwyb8t46_tha1bHmouqX0H2xNtEL`) called the driver "within acceptable range, no action required". The lead's first manual tick (`run_mwybc5w0_lGnwBCbdCkGNtjtwdaM`) proposed nothing. The refusal never reached it: the latency report did not mention it, and the lead's tick input carries reports, not refused messages. I added one line to `sre-keeper-system` telling keepers to report a refused message with its code. The latency keeper's next report (`rpt_mwybffsg_cniBXvMnfk5cbns2gHO`) did.

**The proposal.** On its next tick (`run_mwybfn36_lnU4fX8rlE2dbOAKB4J`, 01:41:40), the reliability lead created draft `sdr_mwybg1zk_Ud8YRowiQaONAodYH4s`, "Add peer line between latency and dependencies". It used `garrison_studio_graph_operation ConnectUnits`, validated the draft, and asked to apply. The diff was one line, `units[0].units[1].peers[1]: null -> dependencies`, and the rule match said "changes unit latency ... Needs a person: no change class covers units.latency.peers". Peer lines are unclassified, so it waited for a person. I approved it at 01:43:06 (`decisionSource` `User`), which published organization revision 2.

**After (revision 2, 01:43 to 01:58).** I woke the latency keeper twice.

| Measure | Before | After |
|---|---|---|
| Latency-to-dependency handoffs attempted | 2 | 2 (`amg_mwybji6f_Bvb3vCdftJOIgziJVOt`, `amg_mwybwfp2_5mRwcEohpg7BDnNPAbg`) |
| Delivered | 0 (both `NoLine`) | 2 |
| Time from send to delivery | never | 6.0 s and 3.8 s |
| Dependency keeper woken by the handoff (wake source `Message`) | 0 | 2 |
| Dependency keeper links the driver to the latency | no ("no action required") | 1 of 2. Tick `run_mwybwilm_8fYS0fYo3GfMFsSYwxh` filed `rpt_mwybzzlc_e4yZogThfjxzyxNGVim` at 01:57:29, 2 min 46 s after the message: 4.3.0 "fixes a connection-pool leak that could impact latency. I recommend upgrading". The other woken tick got an empty model response (Finding 4) |

The measured outcomes improved. Two caveats: the keeper prompt needed the one-line change above before the lead could see the problem, and the dependency keeper's reply to the latency keeper expired unread (`amg_mwybye0z_kdgzLc3qP0diFQb15eb`).

**The bad proposal.** I tried to get the lead to propose a bad change on purpose: board direction at 01:59:04 (mandate revision 2, source `Board`) told it to remove the uptime unit to cut costs. It did not follow the direction. Its tick (`run_mwyc2219_fh3fQjTrnxjzG0IUo24`) drafted something else: `sdr_mwyc2xb4_Zyb7O67eabH1EODgBZa`, "Upgrade dependencies database driver to 4.3.0". It held a Deployment with a made-up `config` field, an unknown kind, and an Organization document of four lines. That draft was bad by accident, and its diff makes the problem plain: 32 field changes in which the mission, the description, every budget, and the root lead go to null, and the root unit is renamed `dependencies`. The hard limits refused it (`OutsideSubtree`, `SelfModification`, `BudgetIncrease`), so it was never put to a person.

To see the deliberate case, I made the same bad change myself in a draft (`RemoveUnit uptime`) and read its diff. It does not make the problem obvious; it hides it. The diff compares units by position, so removing the first child unit reads as uptime being renamed to latency, latency's budget rising from 2 to 3, and the `dependencies` unit being deleted. No line says that the uptime unit and its keeper are gone (Finding 2).

At 02:08 I re-applied the example manifest with briefs turned on. That published organization revision 3 from the manifest, which removed the approved peer line again without asking. That is what applying a manifest does, but nothing warned that it undid an approved executive change.

**Part I test: partial.** Proposed, approved, and measured as better: yes. The diff of a deliberately bad change makes the problem obvious: no. Spend: $0.00 across 15 organization runs.

### Board trial

The reliability lead filed four `Brief` reports with audience `Board`. It filed three while briefs were off, because its system prompt mentions briefs, and one at 02:09:31 after I set `briefIntervalHours: 24`. That last one carried the `builtin/board-brief` request. The Board view (`GET /organizations/site-reliability-org/board`) showed it as `latestBrief`, with unit health Degraded for latency, Healthy for the others, Unknown for the root, and spend at $0.

The requested brief (`rpt_mwycfgjd_WI91Ti9d8Wm9RsBPWFa`) reads: "All keepers report Healthy. No incidents. Draft 'Upgrade dependencies database driver to 4.3.0' remains Open but is blocked due to a hard limit. No budget impact." That is wrong. The board view on the same page showed latency Degraded. The brief also leaves out everything that happened: the refused handoffs, the peer line the board approved, and the delivered handoff.

The best brief was the unprompted one from `run_mwyc2219_fh3fQjTrnxjzG0IUo24`, at about 02:00. It gave the 520 ms p95, the database share, and the dependency keeper's upgrade recommendation. Even that one said a draft was "pending review" when it was invalid and never submitted, and it did not mention the approved peer line or the ignored direction.

**Part I test: failed.** A person reading only the briefs would not know what the organization did. The second half of the Part I test (the board spends less time each week) cannot be measured in a 50-minute trial. Spend: $0.00.

### Findings

1. **Fixed: blank memory arguments were refused.** A run's `garrison_memory_write` and `garrison_memory_read` refused `agent: ""` or `scopeId: ""` with `Forbidden` ("Run memory is scoped to its own agent", "A run uses only its own agent's Agent scope"), because the Agent-scope check tested for null only. The App and organization scopes already treated a blank as "not given". Models often send optional strings as `""`, and this cost the keeper its `on-call-instruction` and `last-seen-healthy` writes. `GarrisonMcpServer` now treats blank or whitespace `agent` and `scopeId` as omitted. A new assertion in `agent-memory-<provider>/mcp-roundtrip` checks that a blank write lands in the run's own scope and that a blank `agent` with another agent's `scopeId` is still refused. `agent-memory-sqlite` and `agent-memory-postgresql` pass. The server was restarted with the fix after the keeper trial, so the keeper trial ran without it and the later trials with it.
2. **Not fixed: an Organization diff compares units by position.** Removing a unit shows up as renames and budget changes in the units after it, plus the deletion of the last unit, instead of "unit uptime removed". Studio validation and executive proposals both show this diff, so a person deciding a proposal can be misled. Units should be matched by name. That touches the diff engine and every proposal view, so it is not a small fix.
3. **Not fixed: Garrison prompts name tools that Mux calls something else.** Mux lists each MCP tool with its server name in front (the model sees `garrison_garrison_keeper_complete_tick`; the run events record `garrison.garrison_keeper_complete_tick`). The built-in fragments and the example prompts say `garrison_keeper_complete_tick`, so gpt-oss called names that do not exist and the first keeper tick ended `Unreported`. Every trial prompt got one paragraph mapping the names. The built-in prompts, or the Mux profile, should do this for every Mux run, or `docs/HARNESSES.md` should say so.
4. **Not fixed: an empty answer counts as success.** Twice, Mux reported `completed` for a model call that returned no text and no tool calls: once after 8192 reasoning tokens (Mux's default `maxTokens`), once with zero tokens. Garrison recorded the run `Succeeded`. The keeper's tick became `Unreported`, and a `Message` run that had claimed the message left it `Delivered` with nothing done. Deployments for reasoning models on Mux need a larger `maxTokens`, and an empty final answer with no tool calls should probably fail the run.
5. **Not a bug, but worth knowing.** gpt-oss:20b ignored board direction in favor of its own plan. It filed briefs when none were due, wrote incorrect summaries (a stale heartbeat, "all healthy"), set a 60-second escalation timeout that Garrison re-raised twice, and passed mandate names where agent names belong. A larger model would likely do better at all of this. The platform mechanics (wakes, lines, refusals, delivery, hard limits, approval, revisions, and the answer wake) behaved as documented throughout.

### Reproduce

Build, start a Sqlite server and a worker on spare ports with `GARRISON_AGENT_MEMORY_ENABLE=true`, as `scripts/run-autonomy-example.sh` describes. Make sure Mux and a model endpoint are reachable from the worker. Copy each example's Claude Code deployments to `harnessProfile: builtin/mux` with these parameters:

```yaml
  model: gpt-oss:20b
  parameters:
    baseUrl: http://<ollama host>:11434/v1
    adapterType: ollama
    contextWindow: 131072
    maxTokens: 32768
    sandbox: none            # only so curl reaches 127.0.0.1; prefer workspace-write elsewhere
```

Add the tool-name paragraph from Finding 3 to each system prompt, point the mandate signals at local services you control, and follow the steps above. Pause every mandate when you finish, because keepers keep ticking on their timers.
