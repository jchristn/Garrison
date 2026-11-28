# UX pass 1 fixes: the trail and the Runs pages (LP5.5)

These are the fixes for the trail and Runs findings from the visual review (`ux-pass-1-visual.md`) and the sense-making
review (`ux-pass-1-sense.md`). Before images are the evidence named in each finding. After images sit in `ux-pass-1/`
and were captured from the seeded instance, either with `tests/audit/capture.mjs` (full page) or with the same sign-in
at a fixed viewport.

| ID | What changed | Commit | Before | After | Status |
|---|---|---|---|---|---|
| UXP1-V001 | The graph opens fitted to the focus run and its neighbors (one layer back, three on) at a zoom between 0.8 and 1, so card text stays about 11 px and a larger trail is a pan away. It is 420 to 760 px tall. Layers are wider (268) so edge labels sit on a background between cards. The minimap and the zoom controls use the theme tokens, with failed steps red in the minimap. A unit test covers a 200-step chain, which opens on its first four steps. The seed has no 50 or 200 step trail, so the live check is the 14-step chain and the fan-out. | d965c412 | `v001-trail-graph-14-light.png`, `v001-trail-graph-200-dark.png`, `v001-trail-graph-768.png` | `fix-UXP1-V001-after.png`, `fix-UXP1-V001-dark-after.png` | Fixed |
| UXP1-V010 | Telemetry folds into a "Timing, tokens, and cost" disclosure with the duration and cost in its summary; the page remembers whether it is open. "Templates used" is a count that opens to the list. The tab bar is sticky, and a link that names a tab (`?tab=trail`, a tour step) scrolls the tab bar to the top. The run summary uses two columns on a phone. At 1366x768 the tabs now start at y 544 on a succeeded run; opened on the Trail tab, the trail fills the first screen. | d965c412 | `v010-run-detail-fold.png` | `fix-UXP1-V010-after.png` | Fixed |
| UXP1-V011 | Lanes share the canvas width (176 to 320 units each), titles and lane names are cut by the space they have, and a cut title has a tooltip. Edges within one lane bow out one step further each, with their labels beside their own bow, and the drawing keeps room for the last lane's bows. Cross-lane labels sit above the start of the line, not on it. A fade and a note ("More steps below", "N lanes: scroll sideways") show where the drawing continues. On wide screens the step drawer lies over the diagram. | d965c412 | `v011-trail-sequence.png`, `v011-trail-drawer-dark.png`, `v011-trail-sequence-200.png` | `fix-UXP1-V011-after.png`, `fix-UXP1-V011-drawer-after.png` | Fixed |
| UXP1-V012 | Focus and selection are rings outside the step (dashed for the focus run, solid for the selected step) in the sequence view and outlines in the graph. The box keeps its state color, and a failed step has a light red fill. | d965c412 | `v012-failed-trail.png` | `fix-UXP1-V012-after.png` | Fixed |
| UXP1-V037 | The Result tab finds JSON in a result, either the whole text or a line such as "Tool result: {...}", and shows it pretty-printed in mono code blocks between the prose lines, with a "Show raw text" switch. Plain prose keeps the Markdown view. | d965c412 | none | `fix-UXP1-V037-after.png` | Fixed |
| UXP1-V040 | Below 768 pixels a note above the summary says the sequence view (or the graph, when that was chosen) needs a wider screen and that the list shows the same steps. | d965c412 | none | `fix-UXP1-V040-after.png` | Fixed |
| UXP1-S001 | The Runs search box is gone, since the server's run list has no text search. In its place are Agent and Outcome filters (both server filters). Run kind and Caller show by default (TTFT moves behind the Columns control so the table still fits 1366). A run that is a hop of a longer request shows "Message hop", "Fan-out member", or "Child run" under its kind, linking to the trail of its request; a message caller reads "A message". Home's "Recent requests" list is not in this area and is not done here. | d965c412 | `sense-runs-search.png` | `fix-UXP1-S001-after.png` | Partly fixed: server part below |
| UXP1-S006 | A failed run shows "Why this run failed: <outcome>" under the header: what the outcome means, the last Error event of the transcript (or the error the server stored), the harness exit line, whether stderr holds anything, and buttons to show the error in the transcript (filtered to Error), open Stderr, and open the deployment. In the trail, a failed run step's drawer shows its outcome, exit code, and error message from the run record. Nothing is inferred beyond those records. | d965c412 | `sense-failed-run-header.png`, `sense-failed-step-drawer.png` | `fix-UXP1-S006-after.png` | Fixed |
| UXP1-S010 | Follow a request looks through the newest 100 runs for one that is a hop of a longer request and opens its trail; with none, it offers the site reliability example, whose latency keeper messages the dependency keeper on its first tick, and says so in the offer. Other tours keep the newest run. | 50aee5e8 | `sense-tour-sample-offer.png`, `sense-tour-continue-without.png` | `fix-UXP1-S010-after.png` (the trail the tour now opens in the seeded tenant) | Fixed |
| UXP1-S024 | The step reads "Reply to admin@garrison", and the list adds "(root run finished)". Its drawer labels the person "Caller", explains that the caller got the reply when the root run finished while later steps kept going, shows the reply text from the run that replied as marked data, and its button reads "Open the root run". | d965c412 | `sense-trail-list.png`, `sense-trail-reply-drawer.png` | `fix-UXP1-S024-after.png` | Fixed |

## Server change still needed

UXP1-S001 needs the run list to filter on things the dashboard cannot filter on by itself. In
`src/Garrison.Core/Requests/RunFilter.cs` and `RunRoutes.ListAsync` (`src/Garrison.Server/Routes/RunRoutes.cs`), with the
matching SQL in the Sqlite and Postgresql run enumerations:

- `kind` (`RunKindEnum?`, query `kind`): filter by run kind, so the page can offer a Run kind filter.
- `search` (string, query `search`): a case-insensitive match on agent name and caller name, so a search box can
  come back and do something.
- `hasHops` (bool, query `hasHops`): runs that sent or received a message, started or were started by another run, or
  belong to a fan-out, so the list can show "requests that crossed agents" including the origin run. Today the
  dashboard can only mark the hop runs themselves, not the origin run that later sent messages.

With those, `runsConfig.filters` in `dashboard/src/views/runConfigs.jsx` adds `kind` (options `ENUMS.runKind`), a
`hasHops` toggle, and `search: true` again.

## Tests

- `npm run lint` and `npm run build` in `dashboard/`.
- `npx vitest run` on `runTrail`, `trailLayout`, `runTrailApi`, `runsTrailFixes` (new), `tours`, `i18nKeys`, `tooltips`,
  and `tableColumnBudget`: 141 tests pass.
- `scripts/check-em-dash.sh`.
- `tests/e2e/features.spec.js` now opens the telemetry disclosure before checking the panel; the e2e suite was not run.
