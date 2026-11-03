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
