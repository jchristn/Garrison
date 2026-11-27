# Dashboard accessibility review

Reviewed 2026-10-15 for P15.11. The audit covers the login page and all 37 dashboard navigation pages in light and dark themes using axe-core WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA rules. It also exercises a dialog entirely with the keyboard. The API responses are synthetic fixtures; the audit checks the actual production-built React UI.

## Findings corrected

- Secondary and muted text, status badges, and action colors lacked sufficient text contrast. The light and dark palettes now preserve contrast, including dark text on bright dark-theme action backgrounds.
- The RTL testing locale appeared with an invalid HTML language tag on its selector option. The synthetic option now inherits its surrounding language rather than claiming an invalid language identifier.
- Dialogs had no accessible name, did not trap keyboard focus, and did not restore focus to the invoking control. Dialog titles now label the dialog, the background is inert, focus remains inside the topmost dialog, Escape closes it, and closing restores the invoking control's focus.
- Reduced-motion preferences now disable transitions and animations, including theme-transition intermediates that should not be treated as final contrast values.

## Verification and limits

`tests/e2e/accessibility.spec.js` runs the axe audit and preserves a JSON report. Its second test verifies the dialog name, initial focus, Shift+Tab/Tab cycling, Escape, and focus restoration. Both tests passed after the fixes. No serious or critical automated violations remain in the scanned states.

Automated results do not establish complete WCAG conformance. The scope does not include a screen-reader session, every expanded modal and error state, every mobile breakpoint, contrast in external Grafana panels, or native-language quality. Those require additional manual review. The existing responsive, locale, and right-to-left browser suites remain complementary checks.

## Addendum: Autonomy views (AA12.10)

Reviewed 2026-11-26 for AA12.10. The review covers every page in the Autonomy group of the sidebar: Keepers, Escalations, Freezes and the kill switch, Memory, Reports, Messages and message threads, Organizations (with executive proposals), Board, Performance, Change rules, Evaluations, Eval runs, Shadow trials, and Canary releases, along with their detail pages and dialogs. Each view was read in source for labels, roles, focus order, keyboard operation of dialogs and charts, color tokens, live regions, and text alternatives for charts. Tooltips were out of scope, since another change adds them across the dashboard.

### Findings corrected

- The answer choices in the escalation answer dialog were a radio group in which every option was its own tab stop and the arrow keys did nothing. The group now has one tab stop, on the chosen option or else the first one. The arrow keys, Home, and End move between options and choose them, and a missing choice error is linked to the group with `aria-describedby`.
- The keeper page updates live over the `mandate:{id}` channel, but a screen reader heard nothing when a tick started or finished. The status line in the page header (status, Ticking, Live) and the Last tick value are now polite live regions. The Last tick region is always present, so the first tick is announced too.
- The progress line on an eval run page ("3 of 10 cases, 2 passed") changes as each case finishes. It is now a polite live region, next to the existing progress bar.
- Unit cards in the organization chart used `h4` under the page's `h2` panel headings, which skipped a level on the Board. They are now `h3`. The arrow before a peer line name is now hidden from screen readers, so it no longer reads as "left right arrow".
- The open-escalation count on the Autonomy sidebar item, and the pending count on Approvals, put `aria-label` on a plain `span`, where screen readers ignore it. Both badges now have `role="img"`, so the label ("2 escalations waiting for an answer") is their accessible name.

### Checked and found sound

- **Labels.** Every form control in the Autonomy dialogs and pages has a visible label tied to it with `htmlFor` and `id`. That includes Freeze, Lift freeze, Cancel everything in a unit, Send message, File report, Answer escalation, New keeper revision, org unit, eval case and its checks, Run eval, board direction, and Talk to the CEO. The one control without a visible label, the tick outcome filter on the keeper page, has an `aria-label`. The rollback choice for active ticks is a `fieldset` with a `legend`.
- **Roles.** Errors in dialogs use `role="alert"`. Coverage, decision, retired, pending, frozen, and kill switch banners use `role="status"`. Spend bars and performance bars are `role="meter"` with a label that states the value. Eval progress is a labeled `role="progressbar"`. Scrolling tables are focusable regions with a name, and tables use `scope` on their headers.
- **Dialogs and focus order.** Every Autonomy dialog is built on the shared `Modal` or `ConfirmModal`, so the P15.11 behavior applies: a name from the title, focus kept inside, Escape to close, and focus returned to the control that opened it. Page actions come before the page body in the DOM, in reading order.
- **Charts.**
  - The keeper interval chart and the report metric chart use `TimeSeriesChart`: an SVG with `role="img"` and the chart title as its label, legend toggles as buttons with `aria-pressed`, and a Data table below as the text alternative and the keyboard path to every value. The hover readout is mouse-only, and the data table holds the same values.
  - The performance chart is a `figure` of labeled meters with each value printed beside its bar, so it reads without color.
  - The organization chart is nested lists of unit cards. Collapse buttons carry `aria-expanded` and a label that names the unit. Peer line chips highlight their peer on focus as well as on hover.
- **Live regions.** The Talk to the CEO transcript is `role="log"` with `aria-live="polite"`. A cascade cancel result is a `role="status"`.
- **Color.** Autonomy styles use the theme tokens (`--color-*`, `--series-*`). The only literal color is a fallback inside `var(--color-danger, ...)`. Status and health badges carry text, so no meaning depends on color alone.

### Recorded, not fixed

- **Board panels are not live regions.** The Board refreshes over the organization channel, and the attention list, spend, and brakes can change while it is open. Turning whole panels into live regions would announce every refresh at length. The page shows a Live badge and has a Refresh button, and a kill switch banner uses `role="status"`. A short summary announcement ("2 new escalations") would serve screen reader users better. That needs a design for which changes deserve one, so it stays open.
- **Shadow trial and canary release counts are not live.** Both pages poll for their counters and step state. The same reasoning applies: the values sit in KPI cards that a user can read on demand, and announcing every poll would be noise. A polite announcement when a trial or release changes status would help. It is not built.
- **Peer line chips are buttons that only highlight.** A peer line chip highlights the peer's card on focus or hover and does nothing when pressed. It is a button so that keyboard users can reach the highlight. Making it move focus to the peer card would give the press a purpose, but the chart has no focusable target for a card yet.
- **Detail pages are not in the automated audit.** `tests/e2e/accessibility.spec.js` scans every navigation page, which includes each Autonomy list page in light and dark themes. It does not open detail pages, the Board with an organization, or the Autonomy dialogs, because the shared mocks do not serve their data. The feature specs (`board.spec.js`, `keepers.spec.js`, `evaluations.spec.js`, and others) exercise those pages functionally, but not with axe. Adding them means giving the audit the feature specs' mocks.
- **No screen reader session.** As with P15.11, this review was a source reading backed by the automated audit, not a session with a screen reader.

### Verification

`npm run lint` passed. The Vitest files for the changed components passed: `escalations.test.jsx`, `keepers.test.jsx`, `evaluations.test.jsx`, `organizations.test.jsx`, and `board.test.jsx`. `approvals.test.jsx` has one failure, in the deployment editor's Approvals step field order (`managementAccess` listed first). That code was not touched here. `tests/e2e/accessibility.spec.js` passed all four tests, including the audit of every navigation page in both themes, with no serious or critical violations.
