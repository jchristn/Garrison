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
