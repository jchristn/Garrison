# Autonomy story trials (AA12.7)

These are the four short trials from Part I of `AUTONOMOUS_AGENTS_PLAN.md` ("How we'll know it works"), run on a real harness. AA-076 replaced the month-long keeper trial with short runs, so each trial lasted minutes. The whole session took about 50 minutes of wall time.

Result in one line: the keeper caught a real outage and escalated it, and the executive proposed a structural change that a person approved and that measurably fixed a handoff. The team trial and the board brief failed. The diff of a deliberately bad proposal hid the problem instead of showing it.

| Trial | Part I test | Result |
|---|---|---|
| Keeper | Catches a real failure and escalates exactly what it should | Partial. It went Quiet, Attention, Escalated on a real outage, then raised a second escalation after the answer |
| Team | Three specialists hand work on with no person relaying, and beat one generalist | Failed. The handoff stalled at the third hop, and the generalist did better |
| Org | An executive proposes a structural change, a person approves it, measured outcomes improve; a bad change is obvious in its diff | Partial. The change was proposed, approved, and improved the measurements. The bad-change diff was misleading |
| Board | The brief explains what happened | Failed. The brief requested at the end said all keepers were healthy while latency was degraded |

## Setup

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

## Spend

Garrison recorded $0.00 for every run. There is no rate for `gpt-oss:20b` on a local Ollama server, so cost estimation has nothing to multiply. The model ran on local hardware. The 27 runs used 3.52 million input tokens and 89.6 thousand output tokens in total.

Budgets were set as the user agreed: the site-reliability organization's root unit and the team unit had $10 a day each, and no mandate had more than $3 a day. Because recorded spend stayed at zero, the budget guard and the Board view's spend rows were never exercised. On this harness the board's "spend against budget" always reads 0 percent, which tells the board nothing.

## Keeper trial

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

## Team trial

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

## Org trial

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

## Board trial

The reliability lead filed four `Brief` reports with audience `Board`. It filed three while briefs were off, because its system prompt mentions briefs, and one at 02:09:31 after I set `briefIntervalHours: 24`. That last one carried the `builtin/board-brief` request. The Board view (`GET /organizations/site-reliability-org/board`) showed it as `latestBrief`, with unit health Degraded for latency, Healthy for the others, Unknown for the root, and spend at $0.

The requested brief (`rpt_mwycfgjd_WI91Ti9d8Wm9RsBPWFa`) reads: "All keepers report Healthy. No incidents. Draft 'Upgrade dependencies database driver to 4.3.0' remains Open but is blocked due to a hard limit. No budget impact." That is wrong. The board view on the same page showed latency Degraded. The brief also leaves out everything that happened: the refused handoffs, the peer line the board approved, and the delivered handoff.

The best brief was the unprompted one from `run_mwyc2219_fh3fQjTrnxjzG0IUo24`, at about 02:00. It gave the 520 ms p95, the database share, and the dependency keeper's upgrade recommendation. Even that one said a draft was "pending review" when it was invalid and never submitted, and it did not mention the approved peer line or the ignored direction.

**Part I test: failed.** A person reading only the briefs would not know what the organization did. The second half of the Part I test (the board spends less time each week) cannot be measured in a 50-minute trial. Spend: $0.00.

## Findings

1. **Fixed: blank memory arguments were refused.** A run's `garrison_memory_write` and `garrison_memory_read` refused `agent: ""` or `scopeId: ""` with `Forbidden` ("Run memory is scoped to its own agent", "A run uses only its own agent's Agent scope"), because the Agent-scope check tested for null only. The App and organization scopes already treated a blank as "not given". Models often send optional strings as `""`, and this cost the keeper its `on-call-instruction` and `last-seen-healthy` writes. `GarrisonMcpServer` now treats blank or whitespace `agent` and `scopeId` as omitted. A new assertion in `agent-memory-<provider>/mcp-roundtrip` checks that a blank write lands in the run's own scope and that a blank `agent` with another agent's `scopeId` is still refused. `agent-memory-sqlite` and `agent-memory-postgresql` pass. The server was restarted with the fix after the keeper trial, so the keeper trial ran without it and the later trials with it.
2. **Not fixed: an Organization diff compares units by position.** Removing a unit shows up as renames and budget changes in the units after it, plus the deletion of the last unit, instead of "unit uptime removed". Studio validation and executive proposals both show this diff, so a person deciding a proposal can be misled. Units should be matched by name. That touches the diff engine and every proposal view, so it is not a small fix.
3. **Not fixed: Garrison prompts name tools that Mux calls something else.** Mux lists each MCP tool with its server name in front (the model sees `garrison_garrison_keeper_complete_tick`; the run events record `garrison.garrison_keeper_complete_tick`). The built-in fragments and the example prompts say `garrison_keeper_complete_tick`, so gpt-oss called names that do not exist and the first keeper tick ended `Unreported`. Every trial prompt got one paragraph mapping the names. The built-in prompts, or the Mux profile, should do this for every Mux run, or `docs/HARNESSES.md` should say so.
4. **Not fixed: an empty answer counts as success.** Twice, Mux reported `completed` for a model call that returned no text and no tool calls: once after 8192 reasoning tokens (Mux's default `maxTokens`), once with zero tokens. Garrison recorded the run `Succeeded`. The keeper's tick became `Unreported`, and a `Message` run that had claimed the message left it `Delivered` with nothing done. Deployments for reasoning models on Mux need a larger `maxTokens`, and an empty final answer with no tool calls should probably fail the run.
5. **Not a bug, but worth knowing.** gpt-oss:20b ignored board direction in favor of its own plan. It filed briefs when none were due, wrote incorrect summaries (a stale heartbeat, "all healthy"), set a 60-second escalation timeout that Garrison re-raised twice, and passed mandate names where agent names belong. A larger model would likely do better at all of this. The platform mechanics (wakes, lines, refusals, delivery, hard limits, approval, revisions, and the answer wake) behaved as documented throughout.

## Reproduce

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
