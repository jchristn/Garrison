// P12.21 manifest bundle export, P12.22 schema-generated invoke forms, P12.27 transcript export.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseSchema, buildFormModel, initialState, buildValue, stateFromValue, fieldPath, mapServerErrors, leafFields } from '../utils/schemaForm';
import { transcriptQuery, transcriptFileName, transcriptMediaType } from '../utils/transcripts';
import { EXPORT_KINDS, parseResourceSelectors, invalidResourceSelectors, manifestExportQuery, bundleFileName, bundleRequirements } from '../utils/manifestBundles';
import ApiClient from '../utils/api';

const SCHEMA = {
  type: 'object',
  title: 'Research request',
  required: ['topic', 'depth'],
  properties: {
    topic: { type: 'string', description: 'What to research' },
    depth: { type: 'integer', default: 2, minimum: 1 },
    ratio: { type: 'number' },
    urgent: { type: 'boolean', default: true },
    tone: { enum: ['formal', 'casual'], default: 'formal' },
    tags: { type: 'array', items: { type: 'string' }, default: ['a'] },
    scores: { type: 'array', items: { type: 'number' } },
    address: { type: 'object', required: ['city'], properties: { city: { type: 'string' }, zip: { type: 'string' } } },
    extra: { type: 'array', items: { type: 'object' } }
  }
};

describe('schema form model', () => {
  it('parses schema text and rejects non-objects', () => {
    expect(parseSchema('')).toBeNull();
    expect(parseSchema('not json')).toBeNull();
    expect(parseSchema('[1]')).toBeNull();
    expect(parseSchema('{"type":"object"}')).toEqual({ type: 'object' });
  });

  it('builds fields for every supported type', () => {
    const model = buildFormModel(SCHEMA);
    const byName = Object.fromEntries(model.fields.map((f) => [f.name, f]));
    expect(model.title).toBe('Research request');
    expect(byName.topic).toMatchObject({ type: 'string', required: true, description: 'What to research' });
    expect(byName.depth).toMatchObject({ type: 'integer', required: true, default: 2 });
    expect(byName.ratio.type).toBe('number');
    expect(byName.urgent.type).toBe('boolean');
    expect(byName.tone).toMatchObject({ type: 'enum', options: ['formal', 'casual'] });
    expect(byName.tags).toMatchObject({ type: 'array', itemType: 'string' });
    expect(byName.address.type).toBe('object');
    expect(byName.address.children.map((c) => [c.key, c.required])).toEqual([['address.city', true], ['address.zip', false]]);
    expect(byName.extra.type).toBe('json');
    expect(leafFields(model).map((f) => f.key)).toContain('address.city');
  });

  it('returns no model for schemas without object properties', () => {
    expect(buildFormModel({ type: 'string' })).toBeNull();
    expect(buildFormModel({ type: 'object' })).toBeNull();
    expect(buildFormModel(null)).toBeNull();
  });

  it('nests objects only one level deep', () => {
    const model = buildFormModel({ type: 'object', properties: { a: { type: 'object', properties: { b: { type: 'object', properties: { c: { type: 'string' } } } } } } });
    expect(model.fields[0].children[0].type).toBe('json');
  });

  it('fills defaults and builds the value', () => {
    const model = buildFormModel(SCHEMA);
    const state = initialState(model);
    expect(state.depth).toBe('2');
    expect(state.urgent).toBe(true);
    expect(state.tags).toEqual(['a']);
    state.topic = 'GPUs';
    state['address.city'] = 'Austin';
    state.scores = ['1.5', ''];
    const { value, errors } = buildValue(model, state);
    expect(errors).toEqual({});
    expect(value).toEqual({ topic: 'GPUs', depth: 2, urgent: true, tone: 'formal', tags: ['a'], scores: [1.5], address: { city: 'Austin' } });
  });

  it('reports required, number, integer, and json errors', () => {
    const model = buildFormModel(SCHEMA);
    const state = initialState(model);
    state.depth = '2.5';
    state.ratio = 'abc';
    state.extra = '[oops';
    const { errors } = buildValue(model, state);
    expect(errors).toMatchObject({ topic: 'required', depth: 'integer', ratio: 'number', extra: 'json' });
  });

  it('round-trips a value through form state', () => {
    const model = buildFormModel(SCHEMA);
    const value = { topic: 'x', depth: 3, urgent: false, tone: 'casual', tags: ['p', 'q'], address: { city: 'Oslo', zip: '0150' }, extra: [{ k: 1 }] };
    const state = stateFromValue(model, value);
    expect(buildValue(model, state).value).toEqual(value);
  });
});

describe('server field errors', () => {
  it('converts server keys to form paths', () => {
    expect(fieldPath('input')).toEqual({ path: '', index: null });
    expect(fieldPath('input.topic')).toEqual({ path: 'topic', index: null });
    expect(fieldPath('input.tags[1]')).toEqual({ path: 'tags', index: 1 });
    expect(fieldPath('input.address.city')).toEqual({ path: 'address.city', index: null });
    expect(fieldPath('deploymentId')).toBeNull();
  });

  it('maps messages onto controls and keeps the rest general', () => {
    const model = buildFormModel(SCHEMA);
    const mapped = mapServerErrors(model, {
      input: 'Not valid',
      'input.topic': 'Required',
      'input.tags[1]': 'Too short',
      'input.address.city': 'Required',
      'input.extra[0].name': 'Missing',
      'input.unknown': 'Not allowed'
    });
    expect(mapped.byKey.topic).toBe('Required');
    expect(mapped.byKey.tags).toBe('[1] Too short');
    expect(mapped.byKey['address.city']).toBe('Required');
    expect(mapped.byKey.extra).toBe('[0] Missing');
    expect(mapped.general).toEqual(['Not valid', 'unknown: Not allowed']);
  });
});

describe('transcript helpers', () => {
  it('builds queries, names, and media types', () => {
    expect(transcriptQuery('Markdown')).toEqual({ format: 'markdown', includeThinking: undefined });
    expect(transcriptQuery('json', true)).toEqual({ format: 'json', includeThinking: 'true' });
    expect(() => transcriptQuery('pdf')).toThrow();
    expect(transcriptFileName('run_1', 'markdown')).toBe('run_1-transcript.md');
    expect(transcriptFileName('cnv_1', 'json')).toBe('cnv_1-transcript.json');
    expect(transcriptMediaType('json')).toContain('application/json');
    expect(transcriptMediaType('markdown')).toContain('text/markdown');
  });
});

describe('manifest bundle helpers', () => {
  it('parses and checks Kind/name selectors', () => {
    const entries = parseResourceSelectors('Agent/triage, Pipeline/release\nAgent/triage\n\nPromptTemplate/team/review');
    expect(entries).toEqual(['Agent/triage', 'Pipeline/release', 'PromptTemplate/team/review']);
    expect(invalidResourceSelectors(['Agent/x', 'Secret/key', 'Agent/', '/x', 'nope'])).toEqual(['Secret/key', 'Agent/', '/x', 'nope']);
    expect(EXPORT_KINDS).not.toContain('Secret');
  });

  it('builds the export query', () => {
    expect(manifestExportQuery({})).toEqual({ kinds: undefined, resources: undefined, followReferences: undefined, includeBuiltIn: undefined });
    expect(manifestExportQuery({ kinds: ['Agent', 'Pipeline'], resources: ['Agent/x'], followReferences: true, includeBuiltIn: true })).toEqual({ kinds: 'Agent,Pipeline', resources: 'Agent/x', followReferences: 'true', includeBuiltIn: 'true' });
    expect(bundleFileName('default')).toBe('garrison-bundle-default.yaml');
  });

  it('reads requirements from the Bundle document', () => {
    const yaml = [
      '# Garrison manifest bundle (garrison/v1) exported 2026-10-14T12:00:00Z from tenant default.',
      'apiVersion: garrison/v1',
      'kind: Bundle',
      'metadata:',
      '  name: garrison-bundle',
      'spec:',
      '  exportedUtc: 2026-10-14T12:00:00.0000000Z',
      '  requiredSecrets:',
      '  - name: github-token',
      '    kind: ApiKey',
      '  - name: claude-oauth',
      '    kind: ClaudeCodeOAuthToken',
      '  requiredArtifactStores:',
      '  - s3-main',
      '  requiredBuiltIns:',
      '  - kind: HarnessProfile',
      '    name: builtin/fake',
      '---',
      'apiVersion: garrison/v1',
      'kind: Agent',
      'metadata:',
      '  name: triage',
      'spec:',
      '  requiredSecrets:',
      '  - name: not-this'
    ].join('\n');
    expect(bundleRequirements(yaml)).toEqual({
      secrets: [{ name: 'github-token', kind: 'ApiKey' }, { name: 'claude-oauth', kind: 'ClaudeCodeOAuthToken' }],
      artifactStores: ['s3-main'],
      builtIns: [{ kind: 'HarnessProfile', name: 'builtin/fake' }]
    });
    expect(bundleRequirements('kind: Bundle\nspec:\n  requiredSecrets: []\n  requiredArtifactStores: []\n')).toEqual({ secrets: [], artifactStores: [], builtIns: [] });
    expect(bundleRequirements('kind: Agent')).toEqual({ secrets: [], artifactStores: [], builtIns: [] });
  });
});

describe('api client', () => {
  afterEach(() => vi.restoreAllMocks());

  const fake = (body) => vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }));

  it('exports manifests with GET and selection query, returning text', async () => {
    const spy = fake('kind: Bundle\n');
    const client = new ApiClient('http://127.0.0.1:1');
    const text = await client.exportManifests('default', { kinds: ['Agent'], resources: ['Pipeline/p'], followReferences: true });
    expect(text).toBe('kind: Bundle\n');
    const [url, init] = spy.mock.calls[0];
    expect(init.method).toBe('GET');
    expect(url).toBe('http://127.0.0.1:1/v1.0/api/tenants/default/manifests/export?kinds=Agent&resources=Pipeline%2Fp&followReferences=true');
  });

  it('reads transcripts as text, JSON included', async () => {
    const spy = fake('{"schema":"garrison.transcript/v1"}');
    const client = new ApiClient('http://127.0.0.1:1');
    const text = await client.runTranscript('default', 'run_1', 'json', true);
    expect(text).toBe('{"schema":"garrison.transcript/v1"}');
    expect(spy.mock.calls[0][0]).toBe('http://127.0.0.1:1/v1.0/api/tenants/default/runs/run_1/transcript?format=json&includeThinking=true');
    await client.conversationTranscript('default', 'cnv_1');
    expect(spy.mock.calls[1][0]).toBe('http://127.0.0.1:1/v1.0/api/tenants/default/conversations/cnv_1/transcript?format=markdown');
  });
});
