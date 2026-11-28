# UX pass 1: visual review (LP5.2)

This is the visual half of UX pass 1. It asks one question of every route: does it look good? The review is checked against the Look and Feel, Controls, Copy-to-Clipboard, Data Tables, Responsive Behavior (including Mandatory Visual QA), Accessibility, and Error, Empty, and Loading States sections of `DASHBOARD_STYLE_AND_USABILITY.md`. One exception was recorded beforehand: at 1366 and wider, tables must not scroll sideways, and below 768 they may.

Nothing was fixed (LP-012). The environment is the one in the header of `UX_PASS_1.md`: commit `a7e7829d`, with 3,994 captured shots.

## How the review was done

- **Screenshots.** Every image was read from contact sheets. Pages at 1366 and 1280 were read two to a sheet at half scale, and suspect areas were zoomed to 1:1. Pages at 390 were read four to a sheet at full scale, in bands of 1,544 px. Pages at 768 were read at full scale. Dialogs and menus were read eight to a sheet.
- **Live instance (vite on 18955, server on 18950).** I used it for the checks that screenshots cannot show:
  - Trail density at 14 nodes (the seeded chain), and at 50 and 200 nodes by stubbing the trail response with `page.route`.
  - Organization canvas density at 4 units (seeded), and at 15, 50, and 200 units by stubbing the organization, units, and chart responses.
  - Keyboard focus on Runs and on the organization designer, in both themes.
  - Row hover on Agents.
  - Three tours started from the Learn page: Run an agent, Follow a request, and Build a team.
- **Data.** Nothing was written to the server.
- **Screenshots in this report.** The shots named below are in `docs/testing/ux-pass-1/`. They are cropped from the capture or taken from the live instance. None is wider than 1366.

## Coverage

Passes:
1. Every route, 1366 light en.
2. Every route, 1366 dark en.
3. Every route, 390 light en.
4. Every route, 1280 light de.
5. A sample of 30 routes at 768 light and dark.
6. ja for the hubs, Learn, trail, and designer.
7. All forced states (loading, empty, error) at 1366 and 390, en and de, light and dark.

In the table, "all" means every captured page or tab in the group was read. "Top" means only the first band was read, for the reason given in the notes.

| Route group (slugs) | 1 1366 light en | 2 1366 dark en | 3 390 light en | 4 1280 light de | 5 768 sample | 6 ja | 7 forced states |
|---|---|---|---|---|---|---|---|
| Shell, Home, Invoke, Learn (`home--home`, `invoke--invoke`, `learn--learn`, `manifests--manifests`) | all; Learn to section 5 | all; Learn to section 5 | all; Learn and Home to 3,100 px | all; Learn to section 5 | home, invoke, learn (top band of Learn plus diagrams 1 and 2) | home, learn (sections 1 to 4) | n/a |
| Agents hub (`agents--*`, 9 tabs) | all | all | all | all | agents--agents | agents--agents, agents--studio | agents: all three states, all cells |
| Agent, studio, prompt detail (`detail-agents-*`, `detail-studio-seeded*`, `detail-prompt-templates-*`) | all | all | all | all | gerbil, gerbil revisions, studio, studio graph, prompt template | studio, studio graph | n/a |
| Runs hub (`runs--*`, 5 tabs) | all | all | all | all | runs--runs | runs--runs | runs: all three states |
| Run detail (`detail-runs-*`, 5 runs x 8 tabs) | all | all | all, except the input, result, stderr, approvals, and children tabs of four runs at 390, whose top band repeats the summary card read 16 times | all | chain-origin and its trail tab | chain-origin trail (dark is a blank capture, see gaps) | n/a |
| Trail (`trail-*`, 5 slugs) | all | all | all, to 3,968 px | all | all four views | all four views | trail: loading and error at 1366; at 390 the panel is below the band |
| Autonomy (`autonomy--*`, 6 tabs; keeper, escalation, message, and report detail) | all | all | all | all | escalations, escalation detail | escalations | escalations, freezes, keepers, messages, reports: all states |
| Organizations (`organizations--*`, `detail-organizations-*`, board, performance) | all | all | all | all | org list, board, site-reliability detail and design | org list, both design tabs | organizations list; org detail loading and error |
| Evaluations (`evaluations--*`, eval, canary, and shadow detail) | all | all | all | all | canary list and detail | not sampled | eval runs: all states |
| Approvals (`approvals--*`, `detail-approvals-*`, pipeline review) | all | all | all | all | not sampled | not sampled | n/a |
| Configuration, Connections, Operations, Fleet, Access | all | all | all | all | secrets, nodes | not sampled | n/a |
| Monitoring, Analytics, System | all; analytics to 3,100 px, settings to 3,100 px | all; same limits | all; settings and analytics to 3,100 px | all; settings to 3,100 px | requests, explorer, settings | not sampled | n/a |
| Row menus and dialogs (`*~menu`, `*~action-*`, 58 to 59 per cell) | all | all | all; 9 of 16 menus did not open in the capture | all | not sampled | not sampled | n/a |
| Live checks | trail at 14, 50, 200; canvas at 4, 15, 50, 200; focus; hover; 3 tours | trail and canvas at the same sizes; focus; follow-a-request tour | tour start not reachable at 390 (see gaps) | n/a | n/a | n/a | n/a |

**Gaps and why:**
- **Shots over 3,100 px.** The capture is full page, so Learn (6,383 px), Settings (8,000), Analytics (6,700 to 7,300), and the fan-out transcript (5,867) are very tall.
  - Below 3,100 px I read Learn only at 1366 light, where a zoom covered diagrams 1 to 3.
  - The rest of those pages repeat the pattern above them (more settings sections, more charts of the same kind).
- **ja at 768 and 390.** Not captured by design.
  - At 1366, ja was reviewed for the hubs, Learn, trail, and designer only, as the brief asked.
  - Evaluations, Approvals, Configuration, Fleet, and Monitoring were not reviewed in ja.
- **Capture defects** (recapture before LP5.5):
  - `ja/dark/1366x768/detail-runs-chain-origin--trail.png` is a blank white image (11 KB).
  - At 390, 9 of the 16 row-menu shots show no open menu: escalations, keepers, messages, reports, prompt templates, canary releases, evaluations, shadow trials, and runs. The tap hit a copy button, or a kebab that had scrolled out of view.
  - `agents--agents~menu` at 1366 shows a highlighted row with no menu.
  - `agents--agent-wizard` shows the plain Agents list, so the wizard was not open.
- **Tours at 390.** The tour picker start buttons were not found from the Learn page at 390. Tour placement was therefore checked only at 1366.
- **Message menu side effect.** Opening the message row menu raised two "blocked write" toasts in the capture (`autonomy--messages~menu`). Opening it may send a mark-as-read write. That is behavior, not looks, so it is only noted here.

## Findings

Findings are ranked by severity, then by how many screens they touch.
- **High:** looks broken or unusable.
- **Medium:** clearly off; a reviewer would reject it.
- **Low:** polish.

"All cells" means every locale, theme, and viewport where the route was captured.

### UXP1-V001 Trail Graph view fits the whole trail into an unreadable strip

- **Severity:** High
- **Route:** `trail-graph`, `trail-fanout-graph`, and the Graph view of every `detail-runs-*--trail`
- **Cells:** all cells, worst at 768. Live check at 14, 50, and 200 nodes, light and dark.
- **Screenshots:** `ux-pass-1/v001-trail-graph-14-light.png`, `ux-pass-1/v001-trail-graph-200-dark.png`, `ux-pass-1/v001-trail-graph-768.png`
- **Expected:** Node text is readable at first render, about 11 px or more. A large trail opens at a sensible zoom and the user pans.
- **Actual:**
  - Fit-to-view scales the 14-node seeded chain until node text is about 5 px. The chain sits in one horizontal strip with about 70% of the canvas empty above and below.
  - At 768 the strip is about 80 px tall.
  - At 50 and 200 nodes the nodes become specks of 2 to 3 px, and the canvas is still mostly empty.
  - Edge labels ("performed", "sent") overlap the nodes.
  - In dark theme the minimap is a solid light gray block that does not match the canvas.
  - In the capture the zoom control showed only "+"; live, it shows +, minus, and fit.
- **Suggested fix:** Clamp fit-to-view to a minimum zoom of about 0.8, start at the focus run, pan for the rest, and theme the minimap.

### UXP1-V002 Organization canvas is unreadable past a handful of units, and the Chart tab grows without limit

- **Severity:** High
- **Route:**
  - `detail-organizations-site-reliability--design` and `detail-organizations-support-desk--design`
  - the Chart tab of `detail-organizations-*`
  - `detail-board-site-reliability`
- **Cells:** all cells. Live check at 4, 15, 50, and 200 units, light and dark.
- **Screenshots:** `ux-pass-1/v002-org-designer-4.png`, `ux-pass-1/v002-org-designer-50.png`, `ux-pass-1/v002-org-designer-200-dark.png`, `ux-pass-1/v002-org-chart-50.png`
- **Expected:** A legible tree with visible connectors. A large organization stays navigable: readable at a minimum zoom, with pan and collapse.
- **Actual:**
  - At 4 units, the chart takes about a third of a 640x480 canvas with text near 9 px.
    - Lead names are cut ("Lead: uptime-keeper Next ...", "dependency-keeper...").
    - The two peer lines show only as handle dots.
    - Child card borders almost vanish in dark.
  - Units nest as boxes inside boxes, so the support-desk chain of four levels gets narrower at each level, and "writeups" spills past its parent.
  - At 15, 50, and 200 units, the nesting lays out as one long horizontal strip and fit-to-view shrinks it to text of about 2 px.
  - "Fit view", "Undo", and "Redo" are plain text, not buttons.
  - The Add unit form wraps badly at 768 (Lead title and Add drop alone to row 2).
  - The Chart tab renders every unit as a nested card with its own red "Cancel everything in this unit" button. At 50 units it is 6,476 px tall and at 200 units 25,602 px, with the indent creeping right at each level.
- **Suggested fix:**
  - Draw a top-down tree with edges, not nested boxes, and give nodes a minimum width.
  - Fit with a minimum zoom near 1.0 and allow collapsing subtrees.
  - Style the canvas toolbar as buttons.
  - Collapse the Chart tab below depth 2 by default.

### UXP1-V003 Table columns at 390 shrink until words break mid-word, a few letters per line

- **Severity:** High
- **Route:**
  - `detail-organizations-*--budgets` ("w/ri/t/e/u/p/s", "inv/esti/gat/ion")
  - `detail-performance-site-reliability` ("relia/bility", "up/tim/e")
  - `autonomy--reports` ("Invoic/e expor/t")
  - `detail-organizations-*--revisions` ("manif/est")
  - `access--roles` and `detail-studio-seeded--prompts` (description about 80 px wide, rows 400 to 500 px tall)
  - `agents--capabilities` (two letters per line)
  - `autonomy--freezes` (reason cut to "Th/CF/be")
  - `autonomy--messages` (subject clipped)
  - `organizations--change-rules` (Limits about 15 lines per row, and one row 330 px tall)
  - `monitoring--audit`, `monitoring--requests`, and the prompt templates Updated column ("11 / minutes / ago")
- **Cells:** en and de, light and dark, 390. A milder form shows at 768 (`autonomy--escalations`: the question runs to 10 lines of about 9 characters).
- **Screenshots:** `ux-pass-1/v003-390-budgets.png`, `ux-pass-1/v003-390-roles.png`
- **Expected:** Below 768 a table keeps readable column widths and scrolls sideways, which the recorded exception allows. Words never break inside.
- **Actual:** Columns shrink to fit the phone width, and the word breaking splits words.
- **Suggested fix:** Give text columns a minimum width of about 160 px, keep relative times on one line, and allow breaks anywhere only in ID cells.

### UXP1-V004 Freeze details dialog has an empty body

- **Severity:** High
- **Route:** `autonomy--freezes~action-1`
- **Cells:** all cells (en and de, light and dark, every viewport)
- **Screenshot:** `ux-pass-1/v004-freeze-dialog-dark.png`
- **Expected:** Target, kind, reason, who froze it and when, and the lift state, like the other details dialogs.
- **Actual:** The title, the ID, an empty band between two dividers, and View JSON and Close.
- **Suggested fix:** Render the freeze record's fields in the details dialog.

### UXP1-V005 Prompt template Rendered pane overflows the page

- **Severity:** High
- **Route:** `detail-prompt-templates-first` (also seen in `mechanical.json`)
- **Cells:**
  - At 768 and 390, en and de, light and dark, the main column scrolls sideways (937 px at 768, 929 px at 390).
  - At 1366 the pane clips instead.
- **Screenshots:** `ux-pass-1/v005-prompt-render-768.png`, `ux-pass-1/v005-prompt-render-1366.png`
- **Expected:** The rendered preview wraps, or scrolls inside its own box, and the copy button sits clear of the text.
- **Actual:**
  - Long lines run past the card and the viewport.
  - At 1366 they are cut at the right edge with no scrollbar.
  - The copy icon sits on top of the first line ("site-reliability org ca...").
  - The Content textarea also soft-wraps hanging indents back to column 0.
- **Suggested fix:** Use `white-space: pre-wrap` with `overflow: auto` on the Rendered pane, and reserve right padding for the copy button.

### UXP1-V006 The other sideways-scroll cases from `mechanical.json`, confirmed

- **Severity:** Medium
- **Route and cells:**
  - `analytics--analytics` at 390, en and de, light and dark: main 447 px (en) and 583 px (de). The Range segmented control runs past the card, so "Custom" is cut.
  - `detail-agents-docs-helper--revisions` and `detail-agents-gerbil--revisions` at 390, en and de, both themes: main 413 px and 545 px.
    - The toolbar buttons "Pin assets in a new draft" and "Choose capabilities in a new draft" run off the card.
    - The table's Author column is cut.
    - At 1280 de, the "Vergleiche..." action is also clipped.
  - `detail-pipeline-runs-review` at 390 de, both themes: main 404 px. The review button row (Genehmigen, Änderungen anfordern, Ablehnen) does not wrap, so "Ablehnen" runs past the card edge.
- **Screenshots:** `ux-pass-1/v006-analytics-390.png`, `ux-pass-1/v006-revisions-390-de.png`, `ux-pass-1/v006-pipeline-review-390-de.png`
- **Expected:** No sideways scroll on the main column at any width.
- **Actual:** As listed.
- **Suggested fix:** Let segmented controls and button rows wrap, or scroll inside their own box, below 600 px.

### UXP1-V007 Error states also claim "no records" or "not found"

- **Severity:** Medium
- **Route:**
  - `~state-error` on agents, escalations, freezes, keepers, messages, reports, eval runs, organizations, and runs
  - `detail-organizations~state-error`
- **Cells:** all forced-state cells (en and de, light and dark, 1366 and 390)
- **Screenshots:** `ux-pass-1/v007-error-state-de.png`, `ux-pass-1/v007-org-error.png`
- **Expected:** One error with a Retry path. The table body and counts are hidden, or show the error.
- **Actual:**
  - Under the red "The server hit an internal error." banner, the toolbar says "0 records, Page 1 of 1" and the table says "No records match the current filters".
  - Organization detail shows the 500 banner and "Organization not found. It does not exist in this tenant, or it was deleted." together.
  - The error text gives no status code or request ID.
- **Suggested fix:** While a load has failed, hide the table body and counts, and show "not found" only on a 404.

### UXP1-V008 Empty states are inconsistent, and at 390 the empty row is clipped

- **Severity:** Medium
- **Route:**
  - `autonomy--escalations~state-empty` and `autonomy--freezes~state-empty` show only the table row "No records match the current filters" with no filter set.
  - `autonomy--messages`, `autonomy--reports`, `evaluations--eval-runs`, and `runs--runs` `~state-empty` have product empty cards, but no button, although the page has Send message, File report, Run set, and Invoke. Runs says "Invoke an agent to start a run" with nothing to click.
  - The same problem appears on `detail-studio-seeded--release`.
  - Inside detail tabs the empty styles differ: a centered gray box on Child runs, a left-aligned line on Stderr, a table row on Approvals.
  - At 390, the empty-row message is centered on the full scrolled table width, so it reads "No records matc" or "Keine Datensätze er". This affects every `~state-error`, the escalations and freezes empties, `approvals--approvals`, the agent Inbox tabs, and the run Approvals (0) tab.
- **Cells:** all forced-state cells; the clipping is at 390 only
- **Screenshots:** `ux-pass-1/v008-empty-escalations.png`, `ux-pass-1/v008-empty-runs-de.png`, `ux-pass-1/v008-empty-390-clipped.png`
- **Expected:** One shared empty state with the page's primary action. Agents, keepers, organizations, and node pools already do this well.
- **Actual:** As listed.
- **Suggested fix:** Use the shared EmptyState with its action on every list, show it when the default filter returns nothing, and render the table empty row outside the scroll container.

### UXP1-V009 The scrolling tab strip hides the active tab, and its chevrons cover labels

- **Severity:** Medium
- **Route:**
  - At 390, every hub with more tabs than fit: agents, runs, autonomy, organizations, evaluations, configuration, operations, access.
  - Detail tabs on agents, organizations, studio, and runs (Stderr and Trail).
  - At 768, the studio tab strip cuts its last tab to "Ar".
- **Cells:** en and de, light and dark, 390 (and 768 for studio)
- **Screenshot:** `ux-pass-1/v009-tab-strip-390.png`
- **Expected:** The selected tab scrolls fully into view, and the chevrons never sit over text.
- **Actual:**
  - On `runs--queue`, the selected Queue tab is off-screen; only a sliver of underline shows.
  - Elsewhere the labels under the chevrons are cut ("Capabilitie", "‹gents", "Eskala›", "Stder›").
- **Suggested fix:** Scroll the active tab into view on mount, and pad the strip so the chevrons have their own space.

### UXP1-V010 Run detail puts the chosen tab below the first screen

- **Severity:** Medium
- **Route:** every `detail-runs-*` tab and every `trail-*` slug (the Trail tab is the first stop of the Follow a request tour)
- **Cells:** all cells.
  - At 1366x768, the tabs start at y 545 to 620.
  - At 1280 de, they start at about y 580.
  - At 768, the trail toolbar starts at y 1,370.
  - At 390, the tabs start at y 2,550 to 2,700.
- **Screenshot:** `ux-pass-1/v010-run-detail-fold.png`
- **Expected:** With a tab chosen, its content starts on the first screen, or at least the tab bar does.
- **Actual:** The sandbox warning, the outcome grid, and the telemetry block come first.
  - "Templates used" wraps each template name over two mono lines in a quarter-width column ("builtin/claude-code-mcp- / config v1"), which leaves a hole under the other columns.
  - At 390, telemetry is 17 label and value pairs in one column.
  - The telemetry note runs into the metric labels with no gap.
- **Suggested fix:** Collapse telemetry into a disclosure (or its own tab), show the templates as a count with a popover, and make the tab bar sticky.

### UXP1-V011 Trail Sequence view: narrow lanes, cut titles, clipped edge labels

- **Severity:** Medium
- **Route:** `trail-sequence`, `trail-drawer`, and the Sequence view of every `detail-runs-*--trail`
- **Cells:** all cells. Live check at 200 nodes and 12 agents.
- **Screenshots:** `ux-pass-1/v011-trail-sequence.png`, `ux-pass-1/v011-trail-drawer-dark.png`, `ux-pass-1/v011-trail-sequence-200.png`
- **Expected:** Titles and edge labels are readable. Lanes use the space, and lanes off to the right are visibly there.
- **Actual:**
  - Lanes are about 165 to 170 px wide in a 1,040 px canvas, with about 60% of it empty. Titles are still cut: "garrison_send_mes...", "Request: admin@ga...", and in German "Lauf: Dringende N...".
  - Five return edges bundle on one side of a lane, and their labels are cut to single letters ("p", "d").
  - "started" and "replied" sit on their lines.
  - The bottom node is cut with no scroll cue.
  - With the step drawer open, only about 2.5 lanes show and "support-inv" is cut mid-word.
  - With 12 agents, 5.5 lanes are visible and nothing says the canvas scrolls sideways.
  - The List view stays clean at 200 nodes, paged 25 at a time.
- **Suggested fix:**
  - Size lanes to their labels, or to the space available.
  - Give edge labels a background and stagger bundled ones.
  - Add an edge fade where lanes continue.
  - Lay the drawer over the canvas.

### UXP1-V012 Trail selection highlight hides a failed status

- **Severity:** Medium
- **Route:** `detail-runs-failed--trail` (any trail whose focus run failed)
- **Cells:** all cells
- **Screenshot:** `ux-pass-1/v012-failed-trail.png`
- **Expected:** A failed Run node keeps its red border; selection is a separate ring.
- **Actual:** The failed focus run has a teal fill and border, so it reads as a success. Only the small "Failed 179 ms" text says otherwise.
- **Suggested fix:** Draw focus and selection as an outer ring and keep the status color on the border.

### UXP1-V013 Filled red destructive buttons outweigh the primary action

- **Severity:** Medium
- **Route:**
  - One "Cancel everything in this unit" on every unit card of `detail-board-site-reliability` and of the `detail-organizations-*` Chart tab.
  - Freeze and Delete side by side on `detail-agents-*` and `detail-keepers-*`.
  - Delete on `detail-prompt-templates-*` and `detail-studio-seeded*`.
  - Stop trial on `detail-shadow-trials-seeded`.
  - Restart server on `system--settings`.
  - Freeze something on `autonomy--freezes`.
- **Cells:** all cells; worst at 390, where the red pair sits on its own row
- **Screenshots:** `ux-pass-1/v013-red-buttons-board.png`, `ux-pass-1/v013-red-buttons-agent-390.png`
- **Expected:** One solid primary per view. Destructive actions are outlined, or kept in a menu.
- **Actual:** Up to five solid red buttons per screen, heavier than Invoke or Publish changes.
- **Suggested fix:** Outline-danger style for destructive buttons in headers and repeated cards, with per-unit cancel moved to the unit menu.

### UXP1-V014 The sidebar footer hides the last nav items on short windows

- **Severity:** Medium
- **Route:** every page, at viewport heights of 768 and 800
- **Cells:** en, de, and ja, light and dark, 1366x768 and 1280x800
- **Screenshot:** `ux-pass-1/v014-sidebar-footer-dark.png`
- **Expected:** Monitoring and System are reachable, and it is clear the nav scrolls.
- **Actual:** The pinned footer (Setup wizard, Guided tour, Learn, Version) starts after Access. Monitoring and System are hidden or half covered, with no fade or shadow.
- **Suggested fix:** Show a scroll shadow at the bottom of the nav list, or fold the footer links into one Help menu when the window is short.

### UXP1-V015 Tooltips open on focus and cover the content they belong to

- **Severity:** Medium
- **Route:**
  - Every dialog: the close button gets focus on open, and its tooltip "Close this window without saving. You can also press Escape." covers the dialog header.
  - The tab tooltips on `detail-agents-*--inbox` and `--revisions` cover the "See the diagram" link.
  - Tour cards: the Next button's tooltip ("Go to the next step...") covers the card's own body text on Run an agent steps 2 and 3, and Build a team step 4.
- **Cells:** all cells; tours were checked live at 1366 light and dark
- **Screenshots:** `ux-pass-1/v015-modal-tooltip.png`, `ux-pass-1/v015-tour-next-tooltip.png`
- **Expected:** Tooltips appear on hover after a short delay, or on keyboard focus only, and never cover the control's own panel.
- **Actual:** As listed.
  - Focus rings themselves are good: a clear blue ring on nav items, buttons, inputs, and pager controls, in both themes.
  - Each keyboard step also opens a tooltip, which is acceptable for keyboard users but not on programmatic focus.
- **Suggested fix:** Do not show tooltips on programmatic focus (dialog open, tour step), and place tour and tab tooltips outside the card.

### UXP1-V016 Tables scroll sideways at 1280 in German and at 768, and the Actions column is cut

- **Severity:** Medium
- **Route:**
  - At 1280 de:
    - `agents--capabilities` ("AKT"), `autonomy--memory` ("AKTI"), and the cycles table of `detail-keepers-*`
    - `evaluations--shadow-trials` ("AKTION"; in its menu shot the table is shown scrolled, with names cut)
    - `runs--conversations`, `trail-list` (Einzelheiten cut), `autonomy--messages~menu`, `autonomy--reports~menu`
  - At 768:
    - `fleet--nodes` ("AC"), `configuration--secrets`, `agents--agents`
    - `evaluations--canary-releases`, `autonomy--escalations`, `detail-agents-gerbil--revisions`, `trail-list`
- **Cells:** de light 1280; en light and dark 768
- **Screenshots:** `ux-pass-1/v016-table-1280-de.png`, `ux-pass-1/v016-table-768.png`
- **Expected:** At 1280 the table fits; 1280 is a desktop width. At 768 the row menu stays reachable, and a fade shows the table scrolls.
- **Actual:** The last column is cut at the card edge with no cue, while name columns wrap into two or three lines.
- **Suggested fix:**
  - Pin the actions column to the right with an edge fade.
  - Clamp long text columns.
  - Move low-value columns (sample, affinity node) into the Columns picker when the table is narrower than 1,100 px.

### UXP1-V017 Short values and identifiers wrap while wide columns have room

- **Severity:** Medium
- **Route:**
  - Short values wrap:
    - `monitoring--audit` ("4 / minutes / ago", "Agent / Execute")
    - `agents--capabilities` and `agents--deployments` (names split at hyphens; the copy icon is pushed off its value)
    - `access--roles` ("8 minutes / ago")
    - `configuration--agent-assets`, `organizations--change-rules`, `runs--conversations`
    - `evaluations--canary-releases`, `evaluations--shadow-trials`, `fleet--nodes`, `detail-studio-seeded--prompts`
  - Identifiers break inside: the Raising run on `detail-escalations-*`, `detail-reports-agent`, the keeper ticks, `detail-conversations-seeded--files`
    - "Open trail" runs straight on after the ID.
  - Transcript tool chips ("mcp__garrison__garris / on_send_message").
  - The request URL on the run Approvals tab ("example.co / m").
  - Home's node row ("Joels-MacBook-Pro", "just now").
- **Cells:** 1366 and 1280, all locales and themes (worse in de)
- **Screenshots:** `ux-pass-1/v017-squeezed-audit.png`, `ux-pass-1/v017-escalations-768.png`
- **Expected:** Times, statuses, slugs, and IDs stay on one line, truncated with a copy button. The free-text column takes the slack.
- **Actual:** Rows are two to three lines tall while Reason or Description has empty space.
- **Suggested fix:** `white-space: nowrap` and a min-width on time, status, and slug columns; ellipsis with a copy button on IDs, as the keeper tick field already does.

### UXP1-V018 German KPI labels break mid-word and push their values out of line

- **Severity:** Medium
- **Route:**
  - `analytics--analytics` ("MITTLERE DELEGATIONSWARTEZ / EIT", "AUSGABEGESCHWINDI / GKEIT")
  - the telemetry grid on every `detail-runs-*` ("ZEIT BIS ZUM ERSTEN TOKEN OHNE DELEGATION")
  - `home--home` ("STEUERUNGSEBENE BEREIT")
- **Cells:** de, light and dark, 1280 and 1366. The en run telemetry has the same two-line misalignment.
- **Screenshot:** `ux-pass-1/v018-kpi-de.png`
- **Expected:** Labels wrap between words, and values line up across the row.
- **Actual:** Labels break inside words, and three-line labels drop their value below their neighbours.
- **Suggested fix:** `hyphens: auto` with `lang="de"`, a reserved two-line label height, and values aligned to the bottom.

### UXP1-V019 The table toolbar wraps into ragged rows, and the auto-refresh select is oversized

- **Severity:** Medium
- **Route:** every data table toolbar (about 60 pages)
- **Cells:**
  - The ragged wrap is at 768 and 390 in all locales and themes.
  - The oversized select is at every width.
  - At 1280 de, the request history refresh button drops alone to a second line.
- **Screenshots:** `ux-pass-1/v019-toolbar-768.png`, `ux-pass-1/v019-toolbar-390.png`
- **Expected:** One aligned toolbar, with the pager kept together as a unit.
- **Actual:**
  - « and ‹ stay on row 1 while the page input, "Page 1 of 2", › and » drop to row 2. At 390, "«" sits alone at the end of a row.
  - The unlabeled auto-refresh select is about 155 px wide to say "Off".
  - On `approvals--approvals` the control order changes.
- **Suggested fix:** Wrap the pager in one nowrap group, size the auto-refresh select to its longest option (about 110 px), and give it a visible label at narrow widths.

### UXP1-V020 Dark theme contrast gaps

- **Severity:** Medium
- **Route and cells:** en dark at 1366 and 768.
  - The red error banner (every `~state-error`): muted red text on dark maroon, visibly lower contrast than the text around it, and no dismiss control.
  - Disabled primary buttons look enabled at 768 and 1366: Send on `invoke--invoke`, Save on `system--settings`, Open board on `organizations--board`.
  - The modal backdrop dims the page only slightly, and the dialog surface is nearly the page color.
  - Native controls are not themed: the date input's calendar icon is dark on dark (`autonomy--messages`, `autonomy--reports`), and the "Choose Files" button on `detail-conversations-seeded--files` is light gray.
  - Budget progress tracks on the board and the org Budgets tab are nearly invisible.
  - The disabled Select and Edit text on `detail-studio-seeded--prompts` is close to invisible.
  - The canvas minimap is a light gray block (see V001 and V002).
  - Badges, status pills, callouts, code blocks, and the Learn diagrams all hold up well in dark.
- **Screenshots:** `ux-pass-1/v020-dark-error-banner.png`, `ux-pass-1/v020-dark-disabled-768.png`
- **Expected:** Normal text at 4.5:1, disabled controls clearly muted, and the dialog visibly above the page.
- **Actual:** As listed.
- **Suggested fix:**
  - Lighten the dark danger text token.
  - Give disabled buttons a neutral surface at 0.5 opacity.
  - Darken the backdrop to about 0.6.
  - Set `color-scheme: dark` on form controls.
  - Raise the track contrast.

### UXP1-V021 Server info endpoints break in the middle of the value

- **Severity:** Medium
- **Route:** `system--server-info`
- **Cells:** all cells
- **Screenshot:** `ux-pass-1/v021-server-info.png`
- **Expected:** Each URL on one line, truncated with copy, or wrapped only at "/".
- **Actual:**
  - "http://127.0.0.1:189 / 55", ".../mc / p", ".../v1 / .0/a2a".
  - The labels "Server in use" and "REST API" wrap because the Endpoints card is narrow.
  - The OpenAPI copy icon wraps to its own line at 390.
  - Feature flags render as a raw JSON array.
- **Suggested fix:** Stack each label above a full-width value with ellipsis and copy, and show feature flags as badges.

### UXP1-V022 Explainer callouts push content down, and the Agents diagram has tall empty boxes

- **Severity:** Medium (390), Low (1366)
- **Route:**
  - Callouts on every hub tab, and on organization, keeper, conversation, and board detail.
  - The Agents and Deployments diagram on `agents--agents`, `agents--deployments`, and `agents--agent-wizard`.
- **Cells:**
  - At 390, all locales and themes: the callout is 250 to 520 px, and forced states land 1,000 to 2,000 px down.
  - At 1366, tables start at y 560 to 600.
- **Screenshot:** `ux-pass-1/v022-explainer-390.png`
- **Expected:** The list or the state starts on the first screen, and diagram boxes fit their text.
- **Actual:**
  - The Deployment A, Deployment B, and Run boxes are about 150 px tall for one or two lines.
  - At 390 the boxes stack, but the arrows still point right into empty space.
- **Suggested fix:** Collapse callouts to their title line after the first view (and by default below 768), size diagram boxes to content, and use down arrows when stacked.

### UXP1-V023 Learn diagrams are too small at 768, and identifiers hyphenate inside the boxes

- **Severity:** Medium
- **Route:** `learn--learn`
- **Cells:**
  - At 768, en, light and dark: "A request's life" box text is about 7 px and edge labels about 6 px; the first diagram is about 9 px.
  - At 1366 the diagrams are legible (about 11 px) in en, de, and ja, both themes.
  - At 1366 dark, "garrison_keeper_complete_-tick" is hyphenated inside the Keeper run box.
- **Screenshot:** `ux-pass-1/v023-learn-768.png`
- **Expected:** Diagram body text of at least 11 px, and identifiers not hyphenated.
- **Actual:** As listed.
- **Suggested fix:** Below about 900 px, switch to the "Show as list" view or scroll the diagram at native scale, and allow identifier breaks only after "_".

### UXP1-V024 Home: stacked panels touch, and Recent failures shows green checks

- **Severity:** Medium
- **Route:** `home--home`; the touching cards also occur on `system--server-info` and `detail-pipeline-runs-review` ("Waiting for your review" touches "2 stages")
- **Cells:** all cells
- **Screenshot:** `ux-pass-1/v024-home-stack.png`
- **Expected:** The grid gap between stacked panels, and a failure icon beside a failed item.
- **Actual:**
  - The Nodes, escalation, Autonomy, Common tasks, and Observability panels butt edge to edge.
  - Each Recent failures row starts with a green check next to a red Failed badge.
- **Suggested fix:** Apply the gap token to the stacked panels and use the failure icon.

### UXP1-V025 Filter inputs clip their text and mis-align

- **Severity:** Medium
- **Route:**
  - `monitoring--requests`: From and To show "mm/dd/yyyy, --:-", and "Path contains" shows "for example /v1.0/api/te".
  - The date filters on `runs--runs`, `runs--pipeline-runs`, `autonomy--messages`, `autonomy--reports`, and `monitoring--audit`: "Filed before" drops alone to a new line, and labels wrap at 390.
  - Text filters at 390 are about 55% wide while selects are full width (`approvals--approvals`, `autonomy--memory`, `agents--capabilities`, `approvals--pipeline-reviews`).
- **Cells:** all cells; the clipping is worst at 768 and 390
- **Screenshot:** see `ux-pass-1/v019-toolbar-768.png` for the shared toolbar context
- **Expected:** A wrapping filter bar with one gap, and inputs wide enough for their placeholder.
- **Actual:** As listed.
- **Suggested fix:** Give datetime inputs a minimum width of about 190 px, put labels above inputs below 600 px, and make every filter full width at 390.

### UXP1-V026 Detail page headers follow three layouts

- **Severity:** Low
- **Route:**
  - Agent, prompt template, run, and pipeline detail put actions on the right.
  - Conversation, keeper, and organization detail put actions in a row under the title.
  - Escalation, report, message thread, eval run, eval set, approval, canary, and shadow trial detail add a green text link among the buttons ("Back to escalations", "All shadow trials").
  - Studio uses a "Back to the wizard" button.
  - `detail-escalations-answered` and `-open` differ from each other.
- **Cells:** all cells
- **Screenshot:** `ux-pass-1/v026-header-escalation.png`
- **Expected:** One header: back link above, then the title, ID, and badges, then actions on the right.
- **Actual:** As listed.
- **Suggested fix:** One shared detail header component.

### UXP1-V027 Row actions use different patterns

- **Severity:** Low
- **Route:**
  - Inline text links instead of the kebab menu:
    - `detail-studio-seeded--prompts` (Select, Clone, Edit, Reset to default, Delete)
    - `detail-studio-seeded--items` (Edit, Remove)
    - the eval set cases (Edit, Remove)
    - the revisions tables (Compare, Compare with live)
    - the prompt template Versions tab (Diff)
    - the run Approvals tab (View)
    - the eval run cases (Open)
  - The agent Recent runs tab is a bare list of IDs, not a table.
  - The Inbox defaults to 50 per page where every other table uses 25.
- **Cells:** all cells
- **Screenshot:** none separate (visible in `ux-pass-1/v006-revisions-390-de.png`)
- **Expected:** The shared row menu, with at most one inline primary action.
- **Actual:** As listed.
- **Suggested fix:** Move these into the shared row action menu.

### UXP1-V028 Create buttons and the help button are styled and placed inconsistently

- **Severity:** Low
- **Route:**
  - Without the "+" icon: "New template", "New draft", "Send message", "File report", "Run set", "Freeze something". Most other create buttons read "+ Add ...".
  - The page help "?" sits right of the title on Agents and Runs, alone under the subtitle on Approvals, Autonomy, Organizations, and Invoke, inline after "Updated" on Home, and beside the primary button on Connections. Evaluations has none at 390.
- **Cells:** all cells
- **Screenshot:** none separate
- **Expected:** One create style and one help position.
- **Actual:** As listed.
- **Suggested fix:** A plus icon on every create button, and the help button always right of the title.

### UXP1-V029 Loading states show "0 records", and the organization loader has no header

- **Severity:** Low
- **Route:** every list `~state-loading`; `detail-organizations~state-loading`
- **Cells:** all forced-state cells
- **Screenshot:** none separate
- **Expected:** A skeleton or a dash for the counts, and the page header kept in place while loading.
- **Actual:**
  - "0 records, Page 1 of 1" with a disabled pager.
  - The organization detail shows a bare spinner, so the layout jumps when data arrives.
  - Spinners elsewhere do not shift the layout.
- **Suggested fix:** Hide counts while loading, and render the header and tabs around the detail spinner.

### UXP1-V030 Charts clip their last label and waste height on sparse data

- **Severity:** Low
- **Route:** `analytics--analytics`; `home--home` and `monitoring--requests` (request activity); keeper and report detail (single-point series)
- **Cells:** all cells
- **Screenshot:** `ux-pass-1/v030-chart-axis.png`
- **Expected:** Full axis labels, and a compact plot or a note when data is sparse.
- **Actual:**
  - The last tick reads "10:15:00 PI", and every tick carries ":00" seconds.
  - A single-point series draws one dot in a 280 px empty chart.
  - The "Last day" request chart draws one full-height bar at the right edge, and at 390 the refresh icon sits on its own row.
- **Suggested fix:** Pad the plot's right edge, drop seconds, show "not enough data yet" under two points, and shorten the plot at 390.

### UXP1-V031 The Settings page is noisy and its section headings sit on card borders

- **Severity:** Low
- **Route:** `system--settings`
- **Cells:** all cells
- **Screenshot:** `ux-pass-1/v031-settings-768.png`
- **Expected:** Section headings above their cards, and a restart notice once per section.
- **Actual:**
  - Every field carries an orange "Restart required" pill and a "Settings file" chip.
  - Headings ("Coordination leases", "REST", "MCP") sit on the card's top border like legends.
  - Badges are inline on some fields and on their own row on others.
  - The REST TLS checkbox floats in the column.
- **Suggested fix:** Show the restart notice once per section heading and the source chip only when the value does not come from the settings file.

### UXP1-V032 KPI grids leave orphan rows

- **Severity:** Low
- **Route:** `home--home` (8 cards in 5 columns at 1366, 3 at 768); `analytics--analytics` (11 cards); `monitoring--requests`; `detail-shadow-trials-seeded` (fifth card alone, and the intro touches the cards)
- **Cells:** all cells
- **Screenshot:** none separate
- **Expected:** Even rows.
- **Actual:** Ragged last rows.
- **Suggested fix:** Use 4 or 8 columns at desktop and 2 or 4 at tablet.

### UXP1-V033 Cards nest three deep, and body text sizes are mixed

- **Severity:** Low
- **Route:**
  - Three-deep nesting:
    - `detail-pipeline-runs-review`, where each stage holds a full table card for one row
    - `detail-board-site-reliability`, where unit cards sit inside the Chart card, the root card is narrower than its children, and links are underlined only here
    - `detail-eval-runs-*`, `detail-evaluations-*`, the canary steps, and the agent revisions tab
  - Mixed text sizes:
    - Intro paragraphs at about 16 px against 14 px elsewhere: org budgets and design, studio preview and prompts, shadow trial, architects, and the "Waiting for your review" card.
    - The org design text summary is 16 px under a 13 px panel.
- **Cells:** all cells
- **Screenshot:** `ux-pass-1/v006-pipeline-review-390-de.png` (the larger review text)
- **Expected:** At most two levels of card, and one body size.
- **Actual:** As listed.
- **Suggested fix:** Drop the inner table border inside cards, use a compact list for five rows or fewer, and use one body text token.

### UXP1-V034 Small wraps and clipped controls in dialogs and forms

- **Severity:** Low
- **Route:**
  - The deployment create and edit step chips wrap, with "7 Approvals" alone on a row (`agents--deployments~action-2` and `-3`, worse in de).
  - The change-rule Limit select clips "Shortest wake interval (se" (`organizations--change-rules~action-1` to `-3`).
  - View dialogs use disabled inputs, so the text is low contrast.
  - The change-rule Description textarea shows a half-cut third line at 390.
  - "Failing only (1)" wraps beside its heading on `detail-eval-runs-docs-helper`; in de it takes three lines.
  - At 390, the copy icon overlaps text in single-line code boxes ("returns ⧉ er" on `detail-runs-chain-origin--input`, "{{secret.⧉:n" on `configuration--secrets~action-4`).
  - On `detail-studio-seeded`, the architect message box is half width with the Send button floating, and the meta line runs together.
- **Cells:** as listed
- **Screenshot:** none separate
- **Expected:** Labels on one line, and selects wide enough for their options.
- **Actual:** As listed.
- **Suggested fix:**
  - Make the step chips a single scrolling row.
  - Widen the limit selects.
  - Render View dialogs as read-only text.
  - Reserve padding for copy buttons.

### UXP1-V035 Japanese and German text details

- **Severity:** Low
- **Route:**
  - ja: `learn--learn` (single characters orphaned on a line, "す。", "ん。")
  - ja: `autonomy--escalations` (the header "回答" breaks one character per line)
  - ja: the designer toolbar placeholder ("責任者エージェント（任意" is cut before its closing bracket)
  - de and ja: native date inputs show "mm/dd/yyyy"
  - de: English built-in role descriptions on `access--roles`; "Deployment" in the secrets callout
  - de: the browser file input reads "Choose Files / No file chosen"
  - de: the typed confirmation word "delete"
  - de: "Process-Ausführung" in the run banner
  - de: two "Anzeigen" entries in the secrets menu
  - de and en: copy toasts name the wrong record ("Copied the change rule ID" on eval sets, "Copied the organization ID" on change rules) or stay after a route change
- **Cells:** ja light and dark 1366; de all cells
- **Screenshot:** `ux-pass-1/v035-ja-learn.png`
- **Expected:** Clean line breaks, and every string in the active locale.
- **Actual:** As listed. There are no tofu boxes. The Hiragino weight and mixed-script baselines look right.
- **Suggested fix:**
  - Use `word-break: keep-all` and `line-break: strict` for ja, and nowrap header cells.
  - Format dates in the app locale.
  - Translate the role descriptions.
  - Style the file button.
  - Fix the toast nouns.

### UXP1-V036 Topbar truncation at 768

- **Severity:** Low
- **Route:** every page
- **Cells:** all locales and themes, 768 (at 390 the topbar fits)
- **Screenshot:** none separate
- **Expected:** The tenant name is readable.
- **Actual:** The tenant select shows "Defau" with the chevron over it, and the URL chip shows "http://127.0.0.1:1…".
- **Suggested fix:** Give the tenant select a minimum width, and hide the URL chip below about 900 px.

### UXP1-V037 The run Result tab shows JSON as wrapped prose

- **Severity:** Low
- **Route:** `detail-runs-fanout-parent--result`, `detail-runs-chain-origin--result`
- **Cells:** all cells
- **Screenshot:** none separate
- **Expected:** JSON pretty-printed in a mono block.
- **Actual:** Escaped JSON with "\n" sequences, at full width in proportional type.
- **Suggested fix:** Detect JSON and pretty-print it. The "Show raw text" toggle already exists.

### UXP1-V038 The row menu opens upward over the pager

- **Severity:** Low
- **Route:** `runs--runs~menu`, `access--users~menu`
- **Cells:** en and de, 1280
- **Screenshot:** none separate
- **Expected:** The menu opens below its trigger when there is room, and flips only near the viewport edge.
- **Actual:** It covers the toolbar and the page controls above the first row. Menus are never clipped by the table, which is good.
- **Suggested fix:** Anchor the menu below the trigger and flip only on overflow.

### UXP1-V039 Tour cards can point at targets on the bottom edge of the window

- **Severity:** Low
- **Route:**
  - Follow a request, steps 1 and 2 (`trail-views` and `trail-summary`).
  - Run an agent, step 6 (the Trail tab).
- **Cells:** en light and dark, 1366x768 (live)
- **Screenshot:** none separate (see `ux-pass-1/v015-tour-next-tooltip.png` for card styling)
- **Expected:** The target scrolls toward the middle of the window, with the card beside it.
- **Actual:** The highlighted control sits on the bottom edge of the window, partly out of view, with the card above it. Other steps place well, and the highlight ring is clear in both themes.
- **Suggested fix:** Scroll the target into the center before placing the card.

### UXP1-V040 Trail Graph and Sequence quietly become the List at 390

- **Severity:** Low
- **Route:** `trail-graph`, `trail-sequence`
- **Cells:** en and de, light and dark, 390
- **Screenshot:** none separate
- **Expected:** A note that the view needs a wider screen, or a view toggle that stays visible.
- **Actual:** Both slugs look the same as `trail-list`, with the C/T column clipped, and nothing says the view switched.
- **Suggested fix:** Show "Graph needs a wider screen; showing the list" above the list.

## Summary

**Counts by severity:** 40 findings.

| Severity | Count | Findings |
|---|---|---|
| High | 5 | V001 to V005 |
| Medium | 20 | V006 to V025 |
| Low | 15 | V026 to V040 |

**The five changes that would improve the most screens:**

1. **Table column rules in the shared table.** Short values (times, statuses, slugs, IDs) get nowrap and a min-width, and the free-text column takes the slack. Mid-word breaks stop outside ID cells, and the actions column is pinned with an edge fade. This fixes V003, V016, and V017 and part of V025, across about 60 tables at every width.
2. **One state pattern.** Hide the table body and counts on error and while loading. Use the shared EmptyState with the page's primary action. Render any table message outside the scroll container. This fixes V007, V008, and V029 on every list page.
3. **Readable canvases by default.** Clamp fit-to-view to a minimum zoom, open at the focus, and pan. Draw the organization as a tree with edges, with a collapsible Chart tab. Size trail lanes to their labels and keep the status color under the selection ring. This fixes V001, V002, V011, and V012, the heart of LP1 to LP3.
4. **Get the content onto the first screen.** Collapse explainer callouts after the first view and by default below 768. Fold run telemetry and "Templates used" into a disclosure. Scroll the active tab into view in the tab strip. This fixes V009, V010, and V022 on every hub and every run detail tab.
5. **Calm the chrome.** Outline the destructive buttons in headers and unit cards. Stop tooltips from opening on programmatic focus (dialog open, tour steps). Add a scroll cue to the sidebar so Monitoring and System are findable on 768 and 800 high windows. This fixes V013, V014, and V015 across every dialog, every detail page, and every short window.
