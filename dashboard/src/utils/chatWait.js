// Wait-state messages for the studio chat: what the person sees between sending a turn and the architect's first
// output. Phrases rotate every WAIT_ROTATE_MS and never repeat one of the last few shown. Plain data (no JSX).

/** Keys under components.studio.chat.wait.phrases, in no particular order. */
export const WAIT_PHRASE_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16'];

/** How long each phrase stays before the next one, in milliseconds. */
export const WAIT_ROTATE_MS = 4500;

/** How many recent phrases a new pick avoids. */
export const WAIT_NO_REPEAT = 6;

/**
 * Pick the next phrase key: random, but not one of the last WAIT_NO_REPEAT shown. `random` is injectable for tests.
 * Returns { key, recent } where recent is the updated history (newest last).
 */
export function nextWaitPhrase(recent = [], random = Math.random) {
  const avoid = new Set(recent.slice(-WAIT_NO_REPEAT));
  const choices = WAIT_PHRASE_KEYS.filter((k) => !avoid.has(k));
  const pool = choices.length ? choices : WAIT_PHRASE_KEYS;
  const key = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  return { key, recent: [...recent, key].slice(-WAIT_NO_REPEAT) };
}

/** Queued and leased turns wait for a worker; running turns wait for the model. */
export function waitStage(status) {
  return status === 'Pending' || status === 'Queued' || status === 'Leased' ? 'worker' : 'model';
}
