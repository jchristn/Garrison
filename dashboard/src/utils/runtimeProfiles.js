/** Read the full permitted profile catalog so configured connections remain discoverable across pages. */
export async function listRuntimeProfiles(client, tenantId, filters = {}) {
  const items = [];
  let pageNumber = 1;
  for (;;) {
    const page = await client.listHarnessProfiles(tenantId, { ...filters, pageNumber, pageSize: 1000 });
    items.push(...(page.items || []));
    if (page.endOfResults !== false || !page.items?.length) return items;
    pageNumber += 1;
  }
}

/** Configured connections and existing tenant/custom harness records share one registry. Built-ins are creation choices. */
export function isConnection(profile) {
  return Boolean(profile?.runtimeConfiguration) || profile?.isBuiltIn === false;
}

/** One creation choice per harness type. New Codex connections prefer its streaming app-server driver. */
export function connectionTemplates(profiles) {
  const choices = new Map();
  for (const profile of profiles) {
    if (!profile.isBuiltIn || profile.active === false) continue;
    const existing = choices.get(profile.harnessType);
    if (!existing || (profile.harnessType === 'Codex' && profile.promptDelivery === 'CodexAppServer')) choices.set(profile.harnessType, profile);
  }
  return [...choices.values()];
}
