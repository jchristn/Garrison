import { createContext, useContext } from 'react';

/**
 * Pending permission approvals for the signed-in tenant (P12.3), provided by the dashboard shell. `pending` is the
 * number of approvals waiting for a person, or null when it is unknown (not loaded yet, or the caller may not read
 * approvals). `refresh()` re-reads the count, for example right after a decision.
 */
const ApprovalsContext = createContext({ pending: null, refresh: () => {} });

export const ApprovalsProvider = ApprovalsContext.Provider;

/** Current pending approval count and a refresh function. */
export function usePendingApprovals() {
  return useContext(ApprovalsContext);
}

export default ApprovalsContext;
