// Brakes (AA3.8): the page-wide "freezes changed" signal. Kept free of imports so the dashboard shell can send it
// without pulling the freeze helpers (and their dependencies) into the entry chunk.

/** Window event sent after a freeze is applied or lifted, or the kill switch changes, so banners and lists reload. */
export const FREEZES_CHANGED_EVENT = 'garrison:freezes-changed';

/** Tell every banner, list, and control on the page that freezes changed. */
export function notifyFreezesChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(FREEZES_CHANGED_EVENT));
}
