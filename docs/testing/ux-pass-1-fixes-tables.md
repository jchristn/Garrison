# UX pass 1 fixes: shared tables, states, tabs, tooltips, and menus (LP5.5)

These are the fixes for the UX pass 1 findings in the shared components: `DataTable`, `TableFrame`, `TablePagination`, `AutoRefreshSelect`, `FilterBar`, `ActionMenu`, the new `RowActions`, `ResourceView`, `Tabs`, `Tooltip`, `PageHeader`, and the table, state, tab, and tooltip CSS. The findings are in `ux-pass-1-visual.md` and `ux-pass-1-sense.md`.

Verification ran against the seeded stack (server on 18950) with `tests/audit/capture.mjs` at 1366x768, 1280x800, 768x1024, and 390x844 in English and German (704 shots, none failed), and `tests/audit/tableWidths.mjs`:

| Width and locale | Before | After |
|---|---|---|
| 1366x768, en | 0 overflows | 0 overflows |
| 1366x768, de | not measured | 0 overflows |
| 1280x800, de | 7 overflows | 1 overflow (see V016) |

The commits:
- `419d4d2e` covers tooltips and tab strips.
- `3fae8f91` covers table states, widths, the pinned row menu, the toolbar, and the filters.
- `07ad7e64` covers row actions, create buttons, and the help button.
- The follow-up commit that adds this file covers the short auto-refresh labels, the pager group, header hyphenation limits, and FilterBar widths.

| ID | What changed | Commit | After image | Status |
|---|---|---|---|---|
| UXP1-V003 | Words in table cells now wrap only between words. Only IDs and `.cell-break` cells may break anywhere, and those cells keep a minimum width. Below 1100 px, long text columns (`col-text`) keep 11rem and the table scrolls sideways inside its frame. | 3fae8f91 | `ux-pass-1/fix-UXP1-V003-after.png` | Fixed |
| UXP1-V007 | A failed load now shows its error, with the HTTP status, in place of the rows. It no longer shows a record count, a page count, or "No records match". Organization detail says "not found" only on a 404. | 3fae8f91 | `ux-pass-1/fix-UXP1-V007-after.png` | Fixed |
| UXP1-V008 | The empty state now carries the page's primary action: `config.emptyAction`, or the lone primary header button. Runs gets Invoke an agent. The empty message now sits below the scrolling table, so it is no longer clipped at 390. | 3fae8f91 | `ux-pass-1/fix-UXP1-V008-after.png` | Fixed for ResourceView lists. The empty styles inside detail tabs (Child runs, Stderr) belong to their pages. |
| UXP1-V009 | The tab scroll buttons now have their own space, set by the strip's margin, and a solid background. The active tab scrolls fully into view on mount, when it changes, and when the strip resizes. | 419d4d2e | `ux-pass-1/fix-UXP1-V009-after.png` | Fixed |
| UXP1-V015 | A tooltip now opens only on hover, or on `:focus-visible` focus that follows a navigation key. Inside a tour card, a control's tooltip sits above or below the card. | 419d4d2e | `ux-pass-1/fix-UXP1-V015-after.png` | Fixed |
| UXP1-V016 | The Actions column is now pinned at the end edge, with a shadow while it covers other columns, and its heading is visually hidden. Up to 1440 px, cells use tighter side padding. Long header words of 12 or more letters may hyphenate. | 3fae8f91, follow-up | `ux-pass-1/fix-UXP1-V016-after.png` | Fixed, with one exception. The runs list overflows by 31 px at 1280 de because of its new Caller column (`RunCaller`, uncommitted runs work). The row menu stays reachable there. |
| UXP1-V017 | Columns for times, counts, versions, and similar values (`col-short`) now stay on one line. An ID in a detail value now stays on one line, and "Open trail" gets its own space. | 3fae8f91 | `ux-pass-1/fix-UXP1-V017-after.png` | Fixed for tables and detail values. Transcript tool chips and the Approvals URL belong to their pages. |
| UXP1-V019 | The pager and the refresh button now wrap as one group. The auto-refresh select uses short labels ("15 sec"), its label shows at every width, and the per-page select is narrow. | 3fae8f91, follow-up | `ux-pass-1/fix-UXP1-V019-after.png` | Fixed |
| UXP1-V025 | Date inputs are now at least 12rem wide, and so are FilterBar date fields and text filters. Below 600 px, labels sit above inputs and every filter takes the full width. | 3fae8f91, follow-up | `ux-pass-1/fix-UXP1-V025-after.png` | Fixed |
| UXP1-V027 | The new `RowActions` shows one inline primary action and puts the rest in the shared row menu. Row menus now take test IDs. These tables use it: studio prompts, studio items, eval set cases, prompt template versions, architect prompt versions, and organization revisions. The inbox now shows 25 rows per page. | 07ad7e64 | `ux-pass-1/fix-UXP1-V027-after.png` | Partly fixed. Agent revisions keep their draft buttons, because about 20 tests depend on them; they can move in a follow-up. Run Approvals and eval run cases already have one inline action. The agent Recent runs tab belongs to its page. |
| UXP1-V028 | These create buttons now have the plus icon: Send message, File report, Run set, Freeze something, and New template. The "?" help button now sits right of the title on every page and hub. | 07ad7e64 | `ux-pass-1/fix-UXP1-V028-after.png` | Fixed |
| UXP1-V029 | A first load now hides the counts and the page count. Organization detail keeps its header while it loads. | 3fae8f91 | `ux-pass-1/fix-UXP1-V029-after.png` | Fixed |
| UXP1-V038 | The row menu now measures its real height and opens below its trigger. It flips up only when it does not fit below and there is more room above. Otherwise it scrolls. | 3fae8f91 | `ux-pass-1/fix-UXP1-V038-after.png` | Fixed |
| UXP1-S007 | When a list with default filters comes back empty, the page asks once whether the tenant has any records of that kind. If none exist, it shows the real empty state. If some do, it says the default view is empty and offers Show all. "No records match" now offers Clear filters. | 3fae8f91 | `ux-pass-1/fix-UXP1-S007-after.png` | Fixed for lists. Connections' empty state belongs to its page. |
