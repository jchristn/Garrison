import { describe, expect, it } from 'vitest';
import { listRuntimeProfiles } from '../utils/runtimeProfiles';
import { withWizardSettings } from '../utils/agentWizard';
import { findHub, findPage, pathFor } from '../config/navConfig';

describe('shared runtime references', () => {
  it('discovers connections beyond the first catalog page', async () => {
    const seen = [];
    const client = { listHarnessProfiles: async (_tenant, query) => { seen.push(query.pageNumber); return query.pageNumber === 1 ? { items: [{ id: 'template' }], endOfResults: false } : { items: [{ id: 'saved', runtimeConfiguration: { model: 'local-model' } }], endOfResults: true }; } };
    expect((await listRuntimeProfiles(client, 'tenant')).map((p) => p.id)).toEqual(['template', 'saved']);
    expect(seen).toEqual([1, 2]);
  });
  it('references a saved connection without persisting endpoint or credential copies', () => {
    const body = withWizardSettings({ name: 'dev', model: 'old', inferenceEndpoint: { baseUrl: 'http://old' }, resourceBindings: [{ kind: 'Secret', alias: 'credential', resourceId: 'old' }, { kind: 'McpServer', alias: 'tools', resourceId: 'mcp' }] }, { usesSavedRuntime: true, harnessProfileId: 'saved' });
    expect(body.harnessProfileId).toBe('saved');
    expect(body.model).toBeNull();
    expect(body.inferenceEndpoint).toBeNull();
    expect(body.resourceBindings).toEqual([{ kind: 'McpServer', alias: 'tools', resourceId: 'mcp' }]);
  });
  it('keeps resources and platform settings navigable with four and six visible tabs', () => {
    expect(findHub('configuration').tabs.filter((p) => !p.hidden)).toHaveLength(4);
    expect(findHub('platformConfiguration').tabs).toHaveLength(6);
    expect(findPage('secrets').hub).toBe('platformConfiguration');
    expect(pathFor('secrets')).toBe('/dashboard/platform-configuration');
  });
});
