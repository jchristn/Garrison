import { describe, expect, it } from 'vitest';
import { connectionTemplates, isConnection, listRuntimeProfiles } from '../utils/runtimeProfiles';
import { withWizardSettings } from '../utils/agentWizard';
import { findHub, findPage, pathFor } from '../config/navConfig';

describe('shared runtime references', () => {
  it('offers one Codex choice using the streaming driver regardless of catalog ordering', () => {
    const exec = { id: 'exec', isBuiltIn: true, harnessType: 'Codex', promptDelivery: 'Stdin' };
    const streaming = { id: 'streaming', isBuiltIn: true, harnessType: 'Codex', promptDelivery: 'CodexAppServer' };
    const claude = { id: 'claude', isBuiltIn: true, harnessType: 'ClaudeCode' };
    for (const profiles of [[exec, streaming, claude], [streaming, exec, claude]]) {
      expect(connectionTemplates(profiles)).toEqual([streaming, claude]);
    }
    expect(connectionTemplates([exec, { ...streaming, active: false }, { id: 'saved', harnessType: 'Codex', isBuiltIn: false }])).toEqual([exec]);
  });
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
  it('includes previously configured custom harnesses without exposing built-in recipes as connections', () => {
    expect(isConnection({ isBuiltIn: false, executable: 'custom-agent' })).toBe(true);
    expect(isConnection({ isBuiltIn: true, executable: 'claude' })).toBe(false);
    expect(isConnection({ runtimeConfiguration: { model: 'local-model' } })).toBe(true);
  });
  it('keeps one Connections page and small configuration and operations hubs', () => {
    expect(findHub('connections').page.id).toBe('harnessProfiles');
    expect(findHub('connections').tabs).toBeUndefined();
    expect(findHub('configuration').tabs).toHaveLength(5);
    expect(findHub('operations').tabs).toHaveLength(4);
    expect(findHub('manifests').page.id).toBe('manifests');
    expect(findHub('manifests').hidden).toBe(true);
    expect(findPage('secrets').hub).toBe('configuration');
    expect(pathFor('harnessProfiles')).toBe('/dashboard/connections');
    expect(pathFor('secrets')).toBe('/dashboard/configuration');
  });
});
