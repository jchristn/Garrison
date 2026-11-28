# UX pass 1: sense-making review (LP5.3)

This review asks one question of every route: does it make sense? The reviewer played a capable operator who is new to Garrison and knows only what the dashboard and `docs/` say. Nothing was fixed (LP-012). Findings are numbered `UXP1-S001` and up, ranked by severity and then by how many people they reach.

Severity:

- **High:** a user gets stuck or is misled.
- **Medium:** confusing, but the user recovers.
- **Low:** wording or polish.

Personas are a **first-time evaluator** (trying Garrison for the first time) and an **operator** (running it day to day).

## Environment

The seeded instance from LP5.1 (`docs/testing/UX_PASS_1.md`) was used: server on 18950, Vite dev server on 18955, signed in as `admin@garrison`. The instance was built from `a7e7829d`, but the Vite dev server serves the working tree, so the tour text on screen already matched the rewritten strings from `21abd902`. Pages were driven with Playwright from `dashboard/` at 1366x768, English, light theme. The LP5.1 route captures were used as well. Evidence is in `docs/testing/ux-pass-1/sense-*.png`.

### What this review changed on the instance

- Created the organization `sense-review-team` (`org_mx02cpd0_Ws8idjbcxEXq7jlVpp7`). It has two units: `research` (lead `research-lead`, members `research-flaky` and `dependency-keeper`, Day budget $5) and `experiments` (lead `research-member`, Day budget $3). Revision 1 is published.
- Created the keeper `research-lead-review` (`mdt_mx02hlea_kBcWCK0owAp8dkEGhRw`) on `research-lead`, with a $1 daily budget. Its ticks run the research fan-out, so `research-flaky` now fails roughly every hour. Because `research-flaky` now holds a position in this organization, trail drawers for its older runs also show "Unit research".
- Created the tenant `sense-empty` (`ten_mx02o85a_beE1W02iXB5hKmwcCVg`) to see empty states, then loaded the site reliability example into it from the Watch an organization tour.
- Created the tenant `sense-firstrun` (`ten_mx02up71_b5qvheIhNTbux5FCnzI`) and walked the setup wizard there: skipped the credential, architect, and keeper steps, applied the sample echo agent, and started a test run.
- Started every tour, which marks them finished for `admin@garrison`.

## Coverage

### Routes by check

Each cell says whether the check passed (OK), had findings (finding IDs), or does not apply (n/a). The checks are:

- **Q1 to Q3:** the three Product Standard questions.
- **Terms:** labels match the docs and the Learn glossary.
- **Empty:** each empty state makes the next step obvious.
- **Links:** links between related records work in both directions.
- **No source:** a new operator can follow the page without reading source.

| Route group | Q1 doing now | Q2 operate | Q3 when wrong | Terms | Empty | Links | No source |
|---|---|---|---|---|---|---|---|
| Home | OK | OK | S006, S012 | S027 | S011 | OK | OK |
| Invoke | OK | OK | S008 | S021 | S008 | OK | OK |
| Agents (agents, studio, architects, deployments, pipelines, triggers, capabilities, apps, agent detail) | OK | OK | OK | S005, S021, S022 | OK | S004 | OK |
| Autonomy (keepers, messages, reports, memory, escalations, freezes, keeper, message thread, report, escalation detail) | OK | OK | S013 | S019, S020 | S007 | S004 | S023 |
| Organizations (list, detail tabs, Design, board, performance, change rules) | OK | S015 | S013, S016 | S020 | OK | S004 | OK |
| Evaluations (eval sets, eval runs, shadow trials, canary releases, details) | OK | OK | OK | OK | S007 | S004 | OK |
| Runs (runs, conversations, pipeline runs, queue, artifacts, run detail, Trail tab) | S001 | OK | S006 | OK | OK | S004 | S023 |
| Approvals (approvals, stage reviews, approval detail) | S012 | OK | S012 | OK | S007 | OK | OK |
| Analytics | OK | n/a | OK | OK | n/a | n/a | OK |
| Connections | OK | OK | OK | S005 | S007 | n/a | OK |
| Configuration, Operations, Import / Export | OK | OK | OK | OK | OK | n/a | OK |
| Fleet | OK | OK | OK | OK | OK | n/a | OK |
| Access, Monitoring, System | OK | OK | OK | S019 | OK | n/a | OK |
| Learn | n/a | n/a | n/a | S020 | n/a | S014 | S023 |

### Journeys

| Journey | Done | Notes |
|---|---|---|
| First look tour (from the Guided tour list and Home "?") | Done | Every step points at something real. S027 covers two copy slips. |
| Run an agent tour (from the list, and the Agents, Invoke, and Connections "?") | Done | Steps are real and in a sensible order. The terms in S005 drift from what the pages say. |
| Follow a request tour (from the list and the Runs "?") | Done | S010: the tour uses the newest run, and its example has no second agent to follow. |
| Build a team tour (from the list and the Organizations "?") | Done | S026: two steps point at a tab without opening it. |
| Keep it safe tour (from the list and the Autonomy Keepers and Freezes "?") | Done | S002: the spend caps step contradicts the keeper form. |
| Watch an organization tour (from the list, the Board tab "?", and Autonomy Messages, Reports, Memory, Escalations "?") | Done | Also run in the empty tenant with the example loaded. S009 covers why the Autonomy "?" choice does not fit. |
| Example data offer | Done | The offer was clear about what it applies and that it costs nothing. "Continue without it" skips every step and ends cleanly (`sense-tour-continue-without.png`). See S010 and S028. |
| Learn page: diagrams against the product, and every box link | Done | 59 box links checked. S014 covers the three that land in the wrong place, and S023 covers the internal names. |
| Follow a request from Home | Done, with difficulty | S001: Home has no route to a multi-agent request. The reviewer got there through Autonomy, Messages, a message, then Open trail. All three views and the drawer were used. The story is retold below. |
| Build a team in the Design tab | Done | Created an organization, added a unit, a lead, and members, then a child unit. Attached a keeper (blocked at first by S003), set budgets, read the Rules tab, hit the parent budget check and fixed it, and published. Also S015, S016, S017, S025. |
| Investigate a failure | Done | From Home's Recent failures to the run, then the transcript, Stderr, Result, the Trail, and the failed step's drawer. S006: the cause is only in the transcript. |
| Setup wizard to its last step | Partly | All six steps were walked. After "Run it" the reviewer did not follow the run to its end. S011. |
| Narrow widths, dark theme, other locales | Not done | Left to the visual review (LP5.2). |
| Graph view legibility | Not done | At 14 steps the graph view renders as a strip too small to read (`sense-trail-graph-tiny.png`). Trail density belongs to the visual review (LP5.2, its `v001` images), so no sense finding was filed. |

### Follow a request, in the reviewer's words

On the trail of `run_mx00eokj_si4FQ9DqzFZuer0vYbH`:

1. `admin@garrison` sent a REST request to `support-intake`.
2. The intake run sent an urgent message to `support-triage` and then finished, so the caller got its reply at that point. The reply is intake's echo, not the final outcome.
3. The urgent mail woke `support-triage`, which sent urgent mail to `support-investigator`.
4. That woke the investigator, which wrote to `support-scribe`.
5. The scribe filed an incident report: "Invoice export outage", Degraded, 212 accounts affected.

The trail counted four agents, three message hops, 1.28 s, and $0.0004, with nothing failed. The reviewer could follow all of this from the Sequence view (`sense-trail-sequence.png`) and the drawer. The only confusing part is the Reply row (S024).

## Findings

### UXP1-S001 (High): no way to find a multi-agent request, and the Runs search box does nothing

- **Route:** Home, Runs (`/dashboard/runs`).
- **Journey step:** Follow a request, step 1, "from Home, find the deep request".
- **Persona:** first-time evaluator, operator.
- **Evidence:** `sense-home.png`, `sense-runs-search.png`.
- **Expected:** From Home or Runs, an operator can find a request that went through several agents, by agent, by kind, or by "has a trail with hops", and then open its trail.
- **Actual:**
  - Home shows recent failures, open escalations, and keepers, but no recent requests and no trails.
  - The Runs list shows Run, Agent, Status, TTFT, Duration, Cost, and Created. Its only filters are Status, Harness, and dates.
  - The "Search by name" box on Runs does nothing. Typing `support-intake` and pressing Enter still lists all 72 runs.
  - The Run kind column exists but is hidden by default. Nothing marks which runs started a chain.
  - The origin run was on page 2 among dozens of keeper ticks. The only discoverable path is Autonomy, then Messages, then a message, then Open trail.
- **Suggestion:** make the Runs search filter by agent, show Run kind and the caller by default, and add a "Recent requests" list with agent and hop counts on Home.

### UXP1-S002 (High): the keeper form says budgets are not enforced, while the tour, Learn, and docs say they are

- **Route:** Organization Design tab, Keepers, New keeper. The same form is used for Autonomy, Add keeper.
- **Journey step:** Build a team (attach a keeper), and the Keep it safe tour's Spend caps step.
- **Persona:** operator.
- **Evidence:** `sense-keeper-budgets-later.png`, `sense-tour-safe-spendcaps.png`.
- **Expected:** One story about spend caps. `docs/BRAKES.md` "Spend caps" and the Learn glossary say a spent daily budget moves the keeper to CapReached, skips wakes until the next UTC day, and raises an urgent escalation. The Keep it safe tour says the same.
- **Actual:** The Budgets section of the keeper form says "Stored now and enforced in a later release." An operator who reads it either distrusts the brake or concludes that the tour is wrong. Both readings are a problem for a safety control.
- **Suggestion:** replace the hint with what the cap does: "A spent day pauses the keeper until the next UTC day and escalates to you."

### UXP1-S003 (High): the New keeper form rejects a deployment it shows as selected

- **Route:** Organization Design tab, select a unit, Keepers, New keeper.
- **Journey step:** Build a team, attach a keeper.
- **Persona:** operator.
- **Evidence:** `sense-keeper-deployment-error.png`.
- **Expected:** The agent's only deployment is shown in the Deployment field and is used when the form is saved.
- **Actual:**
  - The dialog opens with the agent and its one deployment (`research-flaky-fake`) already shown.
  - Save fails with "Some fields need attention" and, under Deployment, "Choose the deployment its ticks run on."
  - With only one option there is nothing else to pick, and choosing the option that is already selected does not change anything in a browser. The reviewer got past it only by having the script re-select the option.
  - This happened on both attempts, even after waiting five seconds for the form to load.
- **Suggestion:** when the deployment list loads, store its single (or first active) deployment in the form's value, not only in the displayed option.

### UXP1-S004 (Medium): related records do not link to each other in both directions

- **Route:** Run detail, Agent detail, Keeper detail, Organization Chart and Design, Report detail, Trail drawer, Shadow trial, Canary release.
- **Journey step:** Follow a request, Investigate a failure, Build a team.
- **Persona:** operator.
- **Evidence:** `sense-run-header-no-links.png`, `sense-keeper-run-raw-ids.png`, `sense-agent-no-keeper-link.png`, `sense-keeper-detail.png`, `sense-org-chart-tab.png`.
- **Expected:** Each related record is one click away, in both directions.
- **Actual:**
  - **Run detail:** "Run of support-intake" does not link to the agent. Deployment and Node are plain text. A keeper run shows `KEEPER mdt_mx00ejrl_...` as a raw ID with no link. A message-woken run shows `CALLER message:amg_mx00eot3_...` as raw text, not a link to the message. A shadow copy does not say which live run it copies, even though the trail knows (LP-014).
  - **Agent detail:** no link to the agent's keeper or to its organization unit. Agent to keeper and agent to unit are both one-way.
  - **Keeper detail:** links to the agent, but not to its deployment or its organization unit.
  - **Organization Chart, Design, and Board:** keeper names on units (`uptime-watch`, `latency-watch`) and the board's unit names are not links.
  - **Report detail:** shows `ORGANIZATION UNIT oun_mx00eojv_gvIeXIe...` as a raw ID with no name and no link.
  - **Shadow trial and canary release:** source, candidate, and baseline deployments are plain text, and the shadow trial does not list or link its compared runs.
  - **Trail drawer:** Agent and Unit are plain text. Only Open record is a link.
  - **What already works:** message thread to sender, recipient, delivered run, and trail; report to author, run, and trail; escalation to agent, run, trail, and keeper; approval to agent, run, trail, and deployment. These pages show the pattern the others should follow.
- **Suggestion:** link every agent, deployment, keeper, unit, message, and run reference on detail pages, and show names instead of raw IDs.

### UXP1-S005 (Medium): "Connections" and "harness profile" name the same thing on different pages

- **Route:** Connections, Agents (Agents and Deployments explainers, Deployments table), Architects, setup wizard step 3, Secrets explainer.
- **Journey step:** Run an agent tour, step 1 to step 3.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-connections-page.png`, `sense-wizard-connection-terms.png`.
- **Expected:** One name. The sidebar and the tour say Connections. The Learn glossary says the docs call it a harness profile and the dashboard calls it a connection.
- **Actual:**
  - The Deployments table header is "HARNESS PROFILE". The Agents and Deployments explainers say "harness profile". The Architects empty state says "Pick the harness profile".
  - Setup wizard step 3 says "Choose the harness profile and model" above a field labeled "Connection" whose placeholder is "Choose a harness profile".
  - The Connections table has a column named "CONNECTION" that shows the executable (`garrison-fake-harness`).
  - Connections is also the only hub page with no explainer box and no "See the diagram" link, so a new user never learns there that a connection is a harness profile.
- **Suggestion:** use "connection" everywhere in the dashboard, rename the Connections column to "Executable", and give Connections the same explainer box as its neighbours.

### UXP1-S006 (Medium): a failed run does not say why it failed or what to do

- **Route:** Run detail of a failed run, Trail drawer of a failed step, Home Recent failures.
- **Journey step:** Investigate a failure.
- **Persona:** operator.
- **Evidence:** `sense-failed-run-header.png`, `sense-failed-run-transcript.png`, `sense-failed-step-drawer.png`.
- **Expected:** The run page names the failure and its cause near the top, and suggests a next step (check the connection, look at Stderr, retry).
- **Actual:**
  - The header shows Outcome "Harness failed" and Exit code 1. Stderr says "No stderr was captured." The Result tab shows the agent's normal output.
  - The cause is only in transcript event #6 (Error) and in the last lifecycle line, "Harness exited with code 1: Failed (Harness failed)".
  - In the trail, the failed step's drawer shows only "State: Failed", with no outcome or error.
  - Home's Recent failures says "Harness failed" with no hint of what that means. "Retry run" is the only action offered.
- **Suggestion:** add an error summary block to failed runs (outcome, the last Error event, exit code, and links to Stderr and the deployment), and show the outcome in the trail drawer.

### UXP1-S007 (Medium): empty lists say "No records match the current filters" when nothing exists

- **Route:** Autonomy Escalations, Evaluations Eval sets, Approvals (default Pending filter), and other tables that use the same component. Also Connections.
- **Journey step:** first visit to an empty tenant.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-badge-other-tenant.png` (Escalations in a new tenant), `sense-approvals-badge-empty.png`.
- **Expected:** An empty state like the one on Keepers, Organizations, or Runs, which says what the thing is and offers the first action.
- **Actual:**
  - In a new tenant, Escalations and Eval sets show the full filter bar and "No records match the current filters." even though no filter is set.
  - Connections' empty state says only "Configure a saved connection first."
- **Suggestion:** show the real empty state when the tenant has none of the record type, and keep "no match" for when filters are set.

### UXP1-S008 (Medium): Invoke opens on an agent that cannot run

- **Route:** Invoke.
- **Journey step:** Run an agent, step 4; a first visit to Invoke.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-invoke-default-agent.png`.
- **Expected:** Invoke preselects an agent that can run, or none, and tells a new tenant how to get one.
- **Actual:**
  - In the seeded tenant, Invoke preselects Legacy Importer, which is frozen and has no deployment. The first thing on the page is "This agent has no active deployment with a weight above zero, so an invoke would be refused."
  - In an empty tenant it preselects Agent architect, and the same warning sends the user to the Deployments tab instead of the agent wizard or the setup wizard.
  - The agent list shows display names (Legacy Importer), while every other page shows names (`legacy-importer`). See S021.
- **Suggestion:** preselect the most recently invoked runnable agent, and in a tenant with no runnable agent point to the setup wizard.

### UXP1-S009 (Medium): the Autonomy "?" button and the Learn autonomy diagram start tours that do not cover the page

- **Route:** Autonomy hub (every tab), Learn "Autonomy building blocks".
- **Journey step:** hub "?" buttons.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-tour-team-keepers.png` (tour style), the hub mapping in `dashboard/src/config/tours.js`.
- **Expected:** The "?" on a page starts a tour that explains that page.
- **Actual:**
  - On Messages, Memory, Reports, and Escalations, "?" starts Watch an organization. That tour opens the board and performance pages of an organization. It ends on Reports and Escalations but never mentions messages or memory.
  - On Keepers and Freezes, "?" starts Keep it safe, which shows a keeper only for its spend caps.
  - No tour teaches what a keeper is, how to add one, or how to read its ticks. Yet keepers are the first tab of Autonomy and the first idea in the Learn autonomy diagram.
  - The Learn "Autonomy building blocks" diagram also offers Watch an organization.
  - Sending a new user from the Messages tab to an organization board does not make sense, and it fails outright in a tenant with no organization.
- **Suggestion:** add a short "Keepers" tour (keeper, tick, memory, report, escalation, messages) for the Autonomy hub and the autonomy diagram, and keep Watch an organization for the Organizations Board and Performance tabs.

### UXP1-S010 (Medium): the Follow a request tour usually has nothing to follow

- **Route:** Follow a request tour, from the Runs "?" and the tour list.
- **Journey step:** tour step 1 to step 5, and the example offer.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-tour-sample-offer.png`, `sense-tour-continue-without.png`.
- **Expected:** The tour shows a request crossing several agents, which is the point of the Trail tab.
- **Actual:**
  - The tour opens the tenant's newest run, which is usually a single keeper tick with one agent and no hops.
  - In a tenant with no runs it offers to load the gerbil example. That is one keeper and one agent, so the trail it produces has nothing to follow between agents. The offer itself says "The run steps need a run. The first keeper tick makes one a few seconds after the apply."
  - In the seeded tenant it happened to land on a fan-out run only because the reviewer's new keeper had just ticked.
- **Suggestion:** have the tour pick the newest run with message hops or child runs, and offer an example that makes one (the site reliability or support-desk shape).

### UXP1-S011 (Medium): first run shows raw JSON and three competing starting points

- **Route:** Home in a new tenant, setup wizard.
- **Journey step:** first run.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-firstrun-home.png`, `sense-wizard-raw-json.png`.
- **Expected:** One clear first step, and plain language inside the wizard.
- **Actual:**
  - After "Skip setup", Home stacks two cards: "New here? Start with Learn" (Open Learn) and "No agents in this tenant yet" (Open the agent wizard, Run setup). That is three entry points.
  - The second card says there are no agents while the Agents card beside it says 1 (the built-in architect).
  - On wizard step 6, Test run, the panel above the message box is the raw JSON of the manifest apply (`"id": "man_..."`, `"createdCount": 2`, ...).
  - Step 3 mixes "harness profile" and "Connection" (S005). Step 5 keeps "Skip setup" next to "Run it".
- **Suggestion:** merge the two Home cards into one with one primary action, count only agents a user created, and replace the JSON with "Created echo-agent and its deployment".

### UXP1-S012 (Medium): the Approvals badge opens an empty list

- **Route:** sidebar Approvals badge, Approvals tab.
- **Journey step:** Keep it safe tour, step 5; daily triage.
- **Persona:** operator.
- **Evidence:** `sense-approvals-badge-empty.png`.
- **Expected:** The badge opens the list that holds what it counts.
- **Actual:** The badge showed 1 because a pipeline stage review was pending. Clicking it opens the Approvals tab with the Pending filter, and the table says "0 records" and "No records match the current filters." The pending item is on the Stage reviews tab, and nothing on the page says so.
- **Suggestion:** open the tab that holds the pending items, or show "1 stage review is waiting" with a link above the table.

### UXP1-S013 (Medium): the board marks the unit with the most open escalations as "Unknown"

- **Route:** Board (`/dashboard/board/{organization}`).
- **Journey step:** Watch an organization tour, steps 1 and 2.
- **Persona:** operator.
- **Evidence:** `sense-board-health-unknown.png`.
- **Expected:** The unit that most needs a person stands out.
- **Actual:**
  - The uptime unit has five open escalations but shows Health "Unknown", because health comes only from reports and uptime files none. The three units with Degraded reports look worse.
  - "3 unhealthy reports" lists reports whose health is Degraded, not Unhealthy, which are separate values everywhere else.
  - The five open escalations are the same question raised on five ticks. They are listed one by one on Home, the board, and Escalations, with nothing to say they repeat.
- **Suggestion:** let open escalations and budget caps raise a unit's health, call the list "Degraded or unhealthy reports", and group repeated questions from the same keeper.

### UXP1-S014 (Medium): Learn's self-revision diagram sends proposals to Approvals

- **Route:** Learn, "Self-revision" and "Brakes".
- **Journey step:** Learn page, box links.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-learn-selfrevision.png`.
- **Expected:** Each box opens the page where the thing appears.
- **Actual:**
  - "A person decides" and "Apply" open Approvals (tool calls and stage reviews). Executive proposals wait on the organization's Proposals tab, as the Change rules explainer says.
  - In Brakes, "Refused run" opens Runs, but a refused run is never created, so it never appears there.
- **Suggestion:** link the proposal boxes to the organization list (or Board, where proposals are summarized), and link "Refused run" to the Freezes tab or the docs only.

### UXP1-S015 (Medium): two editors for the chart, and a new organization opens on the other one

- **Route:** Organization detail, Chart and Design tabs.
- **Journey step:** Build a team, after Create organization.
- **Persona:** operator.
- **Evidence:** `sense-org-chart-tab.png`.
- **Expected:** One place to edit units, which the tour and the explainer call the Design tab.
- **Actual:**
  - The Chart tab has its own Tree and Canvas views, Add unit, Edit, Add unit below, Remove, and Cancel everything in this unit.
  - The Design tab has a canvas, Add unit, a people palette, and the Keepers, Budget, and Rules inspector.
  - Create organization lands on Chart, which shows "Add the root unit". The Build a team tour and its summary talk only about Design.
  - A new user cannot tell which tab to use or whether they differ.
- **Suggestion:** make Chart read-only (or remove its editing actions) and open new organizations on Design.

### UXP1-S016 (Medium): an empty organization reports an impossible error

- **Route:** Organization Design tab, new organization.
- **Journey step:** Build a team, before the first unit.
- **Persona:** operator.
- **Evidence:** `sense-design-empty-checks.png`.
- **Expected:** "No units yet" with a pointer to Add unit, and no error.
- **Actual:** "CHECKS: 1 PROBLEM. Errors: 1. The organization has more than one root unit, including -." The organization has zero units.
- **Suggestion:** skip the root-unit check when there are no units, or report "Add a root unit".

### UXP1-S017 (Medium): a keeper attached in the Design tab shows as an ID and "Not scheduled"

- **Route:** Organization Design tab, Keepers inspector.
- **Journey step:** Build a team, attach a keeper.
- **Persona:** operator.
- **Evidence:** `sense-design-keeper-id-not-scheduled.png`.
- **Expected:** After Created, the inspector shows the keeper's name, its status, and its next wake.
- **Actual:**
  - Right after saving, the inspector shows `mdt_mx02hlea_kBcWCK0owAp8dkEGhRw` and "Not scheduled", and the canvas chip says "Not sched...".
  - The keeper was Active with its next wake an hour away, and it had already ticked once.
  - Only a page reload showed "research-lead-review, Active, Next wake in 1 hour".
- **Suggestion:** refresh the inspector from the created keeper, and link its name to the keeper page.

### UXP1-S018 (Medium): the escalation badge and request activity ignore the selected tenant

- **Route:** sidebar Autonomy badge, Home "API request activity", with a system admin switched to another tenant.
- **Journey step:** first run in a new tenant; operator switching tenants.
- **Persona:** operator (system admin).
- **Evidence:** `sense-badge-other-tenant.png`, `sense-firstrun-home.png`.
- **Expected:** Counts on screen belong to the tenant in the top bar.
- **Actual:**
  - In the new tenant `sense-empty`, the Autonomy badge said 5 escalations were waiting while that tenant's Escalations list was empty. The five belonged to `default`.
  - `EscalationsContext` documents the count as "in the signed-in tenant", which is the token's tenant.
  - Home's API request activity in a brand-new tenant showed 40,455 requests.
- **Suggestion:** read both counts for the selected tenant, or label them as server-wide.

### UXP1-S019 (Low): brake wording differs between pages

- **Route:** Autonomy Freezes explainer and Kind filter, System Settings kill switch, First look tour.
- **Persona:** operator.
- **Expected:** The same description as the Learn glossary and `docs/BRAKES.md`: the kill switch stops keeper wakes and message wakes, and freezes can target units and organizations too.
- **Actual:**
  - The Freezes explainer and the Settings kill switch text mention only keeper ticks, not message wakes.
  - The Freezes explainer lists agent, deployment, keeper, or app, and the Kind filter has no Unit or Organization, although the board freezes both.
  - The First look tour says "A freeze stops any of it at once", which is true of the kill switch, not of a freeze.
- **Suggestion:** reuse the glossary sentences for the kill switch and freeze targets, and add Unit and Organization to the filter.

### UXP1-S020 (Low): smaller term drift

- **Route:** Keepers, Learn, Memory, Change rules, Board.
- **Persona:** first-time evaluator.
- **Expected:** One word per idea, matching the docs.
- **Actual:**
  - Tick outcome "Needs attention" on Keepers and keeper detail, but "Attention" in the Learn tick box and in `docs/KEEPERS.md`.
  - Learn's Teams diagram says "Mailbox". The docs and the agent's Inbox tab say "inbox".
  - The Memory explainer names only agent and app scopes. The glossary lists Agent, App, OrgUnit, and Organization.
  - The Change rules explainer says an executive can never change "budgets". The hard limit is only on raising them ("no budget raises").
  - Board "unhealthy reports" includes Degraded (S013).
- **Suggestion:** align these with the glossary wording.

### UXP1-S021 (Low): agents appear under two different names

- **Route:** Invoke, keeper form, Autonomy filters, Design canvas, Runs.
- **Persona:** operator.
- **Evidence:** `sense-keeper-deployment-error.png` (title "New keeper for research-flaky", Agent field "Vendor Checker").
- **Expected:** The same name in every place, or the name next to the display name.
- **Actual:** Selects and filters use display names (Vendor Checker, Legacy Importer), while tables, the canvas, trails, and dialog titles use names (`research-flaky`, `legacy-importer`). One keeper dialog shows both, so it looks like the wrong agent is chosen.
- **Suggestion:** show "Display name (name)" in selects.

### UXP1-S022 (Low): three different things are called a wizard or a studio

- **Route:** sidebar header, Agents hub, Home.
- **Persona:** first-time evaluator.
- **Expected:** Distinct names for distinct tools.
- **Actual:** The product subtitle in the sidebar is "Agent Studio", and so is a tab under Agents. "Setup wizard" (sidebar) and "Agent wizard" (Agents and Home) are different tools offered side by side on the empty Home card.
- **Suggestion:** drop "Agent Studio" from the sidebar subtitle and say in one line on the Home card how the two wizards differ.

### UXP1-S023 (Low): internal names reach the screen

- **Route:** Learn diagrams, escalation and approval detail, run detail.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-learn-request.png`, `sense-learn-selfrevision.png`, `sense-escalation-detail.png`.
- **Expected:** Plain words, with code names only in the docs.
- **Actual:**
  - The Learn boxes show `RunService`, `ExecutionSpec`, `ExecutiveDraftValidator`, and `managementAccess: OrgSubtree`.
  - Escalation and approval details show "LEASE EPOCH".
  - The run header shows "FILE SPACE cfs_...". `builtin/...` template names fill the run header.
  - None of these tell a new operator anything they can act on.
- **Suggestion:** move class names into the "Read about" docs links, and put lease epoch and file space behind View JSON.

### UXP1-S024 (Low): the trail's Reply step is easy to misread

- **Route:** Trail tab, List view and drawer.
- **Journey step:** Follow a request, explain what happened.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-trail-list.png`, `sense-trail-reply-drawer.png`.
- **Expected:** It is clear what the caller received and when, relative to the work that kept going.
- **Actual:**
  - "Reply: admin@garrison" is row 6 of 14, between the triage run and the triage tool call, so the request seems to finish halfway through.
  - Its drawer labels the person "Agent", shows no reply text or result, and its Open record goes back to the same run.
- **Suggestion:** label the row "Reply to caller (root run finished)", show the root run's result in the drawer, and label the person "Caller".

### UXP1-S025 (Low): publishing does not show what will go live

- **Route:** Organization header, Publish changes; the "Review changes" link.
- **Journey step:** Build a team, publish.
- **Persona:** operator.
- **Evidence:** `sense-review-changes.png`, `sense-publish-dialog.png`.
- **Expected:** The publish dialog lists what changes and repeats the check results.
- **Actual:**
  - Review changes listed only "Units added (2)", leaving out the three members, two budgets, and the keeper.
  - The publish dialog has a Note field and Publish, with no summary and no check results.
- **Suggestion:** show the full diff and the check count in the publish dialog.

### UXP1-S026 (Low): Build a team tour points at tabs without opening them

- **Route:** Build a team tour, steps 3 and 4.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-tour-team-keepers.png`.
- **Expected:** The step shows the content it describes.
- **Actual:** The Keepers and Budget steps highlight the tab button while the People tab stays open, so "this tab lists who in it has a keeper" describes something the user cannot see.
- **Suggestion:** open the tab as the step starts.

### UXP1-S027 (Low): small copy slips

- **Route:** Home, sidebar, keeper detail, Design tab.
- **Persona:** first-time evaluator, operator.
- **Evidence:** `sense-keeper-detail.png`, `sense-design-duplicate-member-error.png`.
- **Actual:**
  - The First look "At a glance" step says runs "active or failed today". The cards say "Last 24 hours".
  - The Autonomy badge links to the Keepers tab, while its tooltip says "Open Autonomy, then Escalations".
  - Keeper detail labels "MINIMUM INTERVAL (SECONDS)" and shows "15 min".
  - The duplicate member error says the same thing three times ("This agent already holds a position in the organization. An agent is a lead or a member of one unit only. An agent holds one position in an organization; research-member is already lead of experiments.").
- **Suggestion:** fix each sentence. Link the badge to the Escalations tab.

### UXP1-S028 (Low): the example offer uses API words

- **Route:** tour example offer.
- **Persona:** first-time evaluator.
- **Evidence:** `sense-tour-sample-offer.png`.
- **Expected:** Plain words.
- **Actual:** "load the gerbil example through the manifest apply", and a list of `Mandate/gerbil-keeper`, `HarnessProfile/autonomy-script`, and so on. The dashboard calls these a keeper and a connection.
- **Suggestion:** say "Load the gerbil example (one agent and its keeper)" and list items by their dashboard names.

## Summary

28 findings: 3 High, 15 Medium, 10 Low.

These five changes would most help a new operator understand Garrison:

1. **Make requests findable (S001):** a working Runs search, Run kind and caller shown by default, and a "Recent requests" list on Home that leads to trails.
2. **Link every reference (S004):** run, agent, deployment, keeper, unit, and message pages should link to each other and show names, not raw IDs.
3. **Explain failures where they appear (S006):** an error summary on failed runs and in the trail drawer, with the next step.
4. **One vocabulary (S005, S019, S020, S021):** "connection" everywhere, the glossary's wording for brakes, and one name per agent.
5. **Tours that match their page (S009, S010):** a keepers tour for the Autonomy hub, and a Follow a request tour that opens a run with hops to follow.

Fix S002 and S003 before any of these, because they mislead or block an operator setting up a brake.
