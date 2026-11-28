// Organization templates (LP3.8): a new organization from Blank, Gerbil, or Site reliability. Gerbil and Site
// reliability apply the example manifests through the existing manifest apply route (as the setup wizard applies its
// sample), so the result is the same as following the example's README. Plain functions so Node tests import them.

import { parseAllDocuments } from 'yaml';
import { GERBIL_MANIFEST, SITE_RELIABILITY_MANIFEST } from './orgTemplateManifests';

/**
 * The gerbil example has a keeper but no organization, so its template adds a one-unit organization led by the
 * gerbil agent with its keeper attached. Everything else comes from examples/autonomous/gerbil.
 */
export const GERBIL_ORGANIZATION = [
  'apiVersion: garrison/v1',
  'kind: Organization',
  'metadata:',
  '  name: gerbil-org',
  'spec:',
  '  description: One keeper that watches a status page (examples/autonomous/gerbil)',
  '  mission: Keep the status page healthy and tell a person when it is not.',
  '  units:',
  '    - name: watch',
  '      lead: gerbil',
  '      leadTitle: Status keeper',
  '      leadMandate: gerbil-keeper',
  ''
].join('\n');

/**
 * The templates in the order the picker shows them. `manifest` is null for Blank, which creates an empty organization
 * with the organization route instead. `organization` is the name of the organization the manifest creates.
 */
export const ORG_TEMPLATES = [
  { id: 'blank', manifest: null, organization: null },
  { id: 'gerbil', manifest: `${GERBIL_MANIFEST}---\n${GERBIL_ORGANIZATION}`, organization: 'gerbil-org' },
  { id: 'siteReliability', manifest: SITE_RELIABILITY_MANIFEST, organization: 'site-reliability-org' }
];

/** One template by ID, or null. */
export function orgTemplate(id) {
  return ORG_TEMPLATES.find((x) => x.id === id) || null;
}

/** What a template's manifest holds, as [{ kind, name }] in document order (comments and blank documents skipped). */
export function templateContents(manifest) {
  if (!manifest) return [];
  const out = [];
  for (const doc of parseAllDocuments(manifest)) {
    const value = doc.toJS() || {};
    if (value.kind && value.metadata?.name) out.push({ kind: String(value.kind), name: String(value.metadata.name) });
  }
  return out;
}

/** The ID of the organization an apply result created or updated, from its Organization item, or null. */
export function appliedOrganizationId(result, name) {
  const item = (result?.items || []).find((i) => i.kind === 'Organization' && (!name || i.name === name));
  return item?.resourceId || null;
}
