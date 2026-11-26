import { createContext, useContext } from 'react';

/**
 * Escalations waiting for an answer in the signed-in tenant (AA2.13), provided by the dashboard shell for the Autonomy
 * sidebar badge. `open` is the count, or null when unknown (not loaded yet, or the caller may not read escalations).
 * `refresh()` re-reads it, for example right after an answer.
 */
const EscalationsContext = createContext({ open: null, refresh: () => {} });

export const EscalationsProvider = EscalationsContext.Provider;

/** Open escalation count and a refresh function. */
export function useOpenEscalations() {
  return useContext(EscalationsContext);
}

export default EscalationsContext;
