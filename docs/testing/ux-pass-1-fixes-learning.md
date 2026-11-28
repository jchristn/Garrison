# UX pass 1 fixes: learning, tours, first run, and wording

Task LP5.5 in `LEARNABILITY_PLAN.md`, for the findings in `ux-pass-1-sense.md` and `ux-pass-1-visual.md` that cover the Learn page, the tours, the setup wizard and first run, and wording across the dashboard. The user approved fixing every finding and adding a seventh tour (LP4.11). After images are in `ux-pass-1/`, captured from the seeded instance (vite 18955, server 18950) at 1366x768 unless the name says otherwise.

## Terms

One word per concept, taken from the docs and the Learn glossary. Where the dashboard and the docs differ, the glossary entry says so once.

| Concept | Dashboard term | Not used on screen | Where the other word is explained |
|---|---|---|---|
| A harness launch recipe (`HarnessProfile`) | Connection | harness profile | Glossary "Connection (harness profile)", and the Connections explainer ("the docs call it a harness profile") |
| A mandate an agent keeps on a schedule | Keeper | mandate (except the manifest kind in the docs) | Glossary "Keeper" |
| The tick outcome `Attention` | Attention | Needs attention (kept only for the board's "Needs attention" list, which is a different thing) | `docs/KEEPERS.md` |
| Where an agent's queued messages wait | Inbox | mailbox | `docs/MESSAGING.md` |
| What the kill switch stops | keeper wakes and message wakes | keeper ticks only | Glossary "Kill switch", `docs/BRAKES.md` |
| What a freeze can target | agent, deployment, keeper, app, unit, organization | the four-target list | Glossary "Freeze" |
| The executive's budget limit | never raises a budget | "budgets" | `docs/EXECUTIVES.md` hard limits |
| An agent in a select or filter | Display name (name) | display name alone | `utils/agentLabel.js` |
| The two wizards | setup wizard (a sample agent in minutes) and agent wizard (the architect drafts agents) | Agent Studio as the product subtitle | The Home first-run card says how they differ |

## Findings

| ID | What changed | Commit | After image | Status |
|---|---|---|---|---|
| UXP1-S005 | Connection everywhere in nine locales (Deployments column and form, Agents and Deployments explainers, Architects, setup wizard step 3, studio, capabilities, tooltips). The glossary term is "Connection (harness profile)" and explains the docs word once. Connections has the same explainer box as its neighbours, with "See the diagram", and its target column is "Endpoint or executable". | dcb767de, 5aac3ffc | `fix-UXP1-S005-after.png`, `fix-UXP1-S005-deployments-after.png` | Fixed |
| UXP1-S008 | Invoke preselects the first agent with an active deployment of weight above zero. With none, the select says "Choose an agent" and a note offers Run setup. Agent options show "Display name (name)". | 973e607f | `fix-UXP1-S008-after.png` | Fixed |
| UXP1-S009 | New tour Agents on their own (LP4.11, seven steps): Keepers list, wake schedule, ticks, revisions, messages and threads, memory, escalations. It offers the gerbil example on a tenant without keepers, is the Autonomy "?" tour on every tab but Freezes (which keeps Keep it safe), is offered by the Learn autonomy section, and the First look autonomy step points to it. Learn's organization section offers Watch an organization, so every tour is on Learn once. e2e spec `tests/e2e/tours/agents-on-their-own.spec.js`, written, not run. | dcb767de | `fix-UXP1-S009-after.png`, `fix-UXP1-S009-390-after.png` | Fixed |
| UXP1-S011 | Home in a tenant with no agents of its own shows one card: Run setup is the one primary action, beside the agent wizard and Learn, and it says how the two wizards differ. The Agents card shows 0 with "Only the built-in agent architect". The Learn card shows only once the tenant has agents. Wizard step 6 lists what the manifest made ("Created Agent echo-agent") instead of JSON, and Skip setup is gone from the last step. | dcb767de, 973e607f | `fix-UXP1-S011-after.png`, `fix-UXP1-S011-wizard-after.png` | Fixed |
| UXP1-S012 | The Approvals badge opens Stage reviews when only stage reviews wait, and the Approvals tab says "1 pipeline stage review is waiting on the Stage reviews tab" with a link. | 973e607f | `fix-UXP1-S012-after.png` (stage review count mocked, live push blocked) | Fixed |
| UXP1-S014 | "A person decides" and "Apply" open Organizations (where each organization's Proposals tab is); "Refused run" opens Freezes. | dcb767de | `fix-UXP1-S014-after.png` | Fixed |
| UXP1-S018 | Home request activity asks for the selected tenant (`tenantId` on the summary route). The badge counts were already polled for the selected tenant; WebSocket pushes, which carry the token's tenant, now only trigger a re-read when another tenant is selected. | 973e607f | `fix-UXP1-S018-after.png` (sense-empty: no badge, 0 requests) | Fixed |
| UXP1-S019 | Freezes explainer, kill switch help, banner, toast, tooltips, and confirm text say keeper wakes and message wakes, and list unit and organization targets. The Kind filter includes Unit and Organization. First look says "The kill switch stops all of it at once". | dcb767de, 5aac3ffc | `fix-UXP1-S019-after.png` | Fixed |
| UXP1-S020 | Tick outcome label Attention; Learn teams box and text say Inbox; the Memory explainer names agent, app, unit, and organization scopes; the Change rules explainer says it can never raise a budget; Watch an organization says "reports that say Degraded or Unhealthy". | dcb767de | `fix-UXP1-S020-after.png` | Fixed |
| UXP1-S021 | Selects and filters for agents (Invoke, keeper form, Autonomy filters, triggers, pipelines, messages, reports, freezes, org unit form, analytics) show "Display name (name)". | 5aac3ffc | `fix-UXP1-S021-after.png` | Fixed |
| UXP1-S022 | The sidebar brand drops the "Agent Studio" subtitle. The Home first-run card says how the setup wizard and the agent wizard differ. | 973e607f | `fix-UXP1-S022-after.png` | Fixed |
| UXP1-S023 | Learn draws no class or tool names (the docs SVGs keep them, and each box links to its guide); lease epoch leaves escalation and approval details; the run header drops the file space ID (View JSON keeps both). The `builtin/...` template list in the run header was folded into a count by the runs fixes (UXP1-V010). | dcb767de, 973e607f | `fix-UXP1-S023-after.png` | Fixed |
| UXP1-S027 | First look says "in the last 24 hours"; the Autonomy badge opens Escalations and its tooltip says so; keeper detail says "Minimum interval" and "Maximum interval"; a PositionTaken refusal shows the server's one sentence. | dcb767de, 5aac3ffc, 973e607f | `fix-UXP1-S027-after.png` | Fixed |
| UXP1-S028 | The example offer says "Load the gerbil example (one agent and its keeper)" with no API words, and lists each item by dashboard name (Keeper gerbil-keeper, Connection autonomy-script). | dcb767de | `fix-UXP1-S028-after.png` | Fixed |
| UXP1-V022 | Explainers open on the first view of a topic, then fold to their title line (a click opens them again, and the choice is remembered); below 768 px they start folded. The small agent diagram sizes its boxes to their text and turns its arrows down when the boxes stack. | dcb767de | `fix-UXP1-V022-after.png` (390) | Fixed |
| UXP1-V023 | Below 900 px a Learn diagram starts as its list, and a diagram shown there scrolls at its own size instead of shrinking to 7 px text. Identifiers break after an underscore and are never hyphenated. | dcb767de | `fix-UXP1-V023-after.png` (768) | Fixed |
| UXP1-V039 | A tour scrolls its target to the middle of the window (a target taller than most of the window starts at the top), so the card no longer points at the bottom edge. | dcb767de | `fix-UXP1-V039-after.png` | Fixed |

## Verification

- Every tour walked with Playwright on the seeded instance at 1366x768 and 390x844, replayed from Learn. At 1366 no step was skipped. At 390, Follow a request skips "Three views" and Build a team skips its four canvas steps, because those controls are not shown at phone width (trail and org designer layouts, not tour targets).
- Routes recaptured with `tests/audit/capture.mjs` (home, invoke, deployments, architects, connections, learn, approvals, freezes, memory) at 1366, 768, and 390.
- `scripts/export-diagrams.mjs` rerun; `docs/images/learn/autonomy.svg`, `runtime.svg`, and `teams.svg` changed.
- vitest (targeted): tours, learn, i18nKeys, tooltips, organizations, keepers, escalations, approvals, memory, messages, reports, freezes, pipelines, triggers, enumLabels, capabilities, agentWizard, studio, board, runTrail, deleteErrors, m1, autonomyFollowUps, autonomyUsability, secretGuides, runtimeProfiles, evaluations, apps, utils. `npm run lint`, `npm run build`, and `scripts/check-em-dash.sh` pass.
