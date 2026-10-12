// Conversations (P12.1): the list configuration against the e2e mock rows, how a turn got its session, the invoke body
// fields, the API methods, navigation, and the translated messages for the 409 conversation errors.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../i18n';
import { conversationsConfig, runsConfig, TurnSession, ConversationState, conversationTitle } from '../views/runConfigs';
import { turnSessionMode, turnSessionTone, textPreview, conversationBody, CONVERSATION_MODES, CONVERSATION_ERROR_CODES } from '../utils/conversations';
import { pathFor, LEGACY_REDIRECTS, hubForPath, detailPageBySlug } from '../config/navConfig';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { ENUMS } from '../utils/constants';
import { PROMPT_ROLES, templateKindForRole, defaultTemplateFor } from '../utils/deployments';
import { errorMessage } from '../utils/errors';
import ApiClient, { ApiError } from '../utils/api';
import { respond, CONVERSATION_TURN_RUNS } from '../../tests/e2e/mocks.js';

const BASE = 'http://127.0.0.1/v1.0/api/tenants/default';
const get = (path) => respond('GET', new URL(`${BASE}/${path}`));

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('conversation helpers', () => {
  it('names how each turn got its harness session', () => {
    expect(turnSessionMode(null)).toBe('none');
    expect(turnSessionMode({ conversationId: null, conversationTurn: 0 })).toBe('none');
    expect(turnSessionMode({ conversationId: 'cnv_1', conversationTurn: 1 })).toBe('first');
    expect(turnSessionMode({ conversationId: 'cnv_1', conversationTurn: 2, resumeSessionId: 'ses-1' })).toBe('resumed');
    expect(turnSessionMode({ conversationId: 'cnv_1', conversationTurn: 3, conversationFallbackReason: 'AffinityWaitExpired' })).toBe('fallback');
    expect(turnSessionMode({ conversationId: 'cnv_1', conversationTurn: 4 })).toBe('pending');
    expect(turnSessionTone('resumed')).toBe('success');
    expect(turnSessionTone('fallback')).toBe('warning');
    expect(turnSessionTone('pending')).toBe('neutral');
  });

  it('previews text on one line and cuts it with an ellipsis', () => {
    expect(textPreview('  a\n\nb  ')).toBe('a b');
    expect(textPreview(null)).toBe('');
    const long = textPreview('x'.repeat(500), 20);
    expect(long).toHaveLength(20);
    expect(long.endsWith('...')).toBe(true);
  });

  it('builds the conversation fields of an invoke body', () => {
    expect(CONVERSATION_MODES).toEqual(['none', 'start', 'continue']);
    expect(conversationBody('none', 'cnv_1')).toEqual({});
    expect(conversationBody('start', 'cnv_1')).toEqual({ startConversation: true });
    expect(conversationBody('continue', 'cnv_1')).toEqual({ conversationId: 'cnv_1' });
    expect(conversationBody('continue', '')).toEqual({});
  });

  it('translates every conversation error the server answers with 409', () => {
    const t = i18n.getFixedT('en');
    for (const code of CONVERSATION_ERROR_CODES) {
      const message = errorMessage(t, new ApiError(409, { code, message: `Conversation cnv_1: ${code}` }));
      expect(message, code).not.toContain(code);
      expect(message.length, code).toBeGreaterThan(40);
    }
    expect(errorMessage(t, new ApiError(409, { code: 'ConversationBusy' }))).toMatch(/previous turn/);
  });
});

describe('conversations page', () => {
  const t = (...args) => i18n.t(...args);
  const ctx = { t, i18n, navigate: vi.fn() };
  const rows = () => get('conversations?maxResults=25&skip=0').objects;
  const render = (key, row) => renderToStaticMarkup(<>{conversationsConfig.columns(ctx).find((c) => c.key === key).render(row)}</>);

  it('is a Runs hub tab with a detail route, and the old slug redirects to it', () => {
    expect(pathFor('conversations')).toBe('/dashboard/runs?tab=conversations');
    expect(pathFor('conversations', 'cnv_0001')).toBe('/dashboard/conversations/cnv_0001');
    expect(pathFor('conversations', null, { agentId: 'agt_1' })).toBe('/dashboard/runs?tab=conversations&agentId=agt_1');
    expect(LEGACY_REDIRECTS).toContainEqual({ from: 'conversations', to: '/dashboard/runs', tab: 'conversations' });
    expect(hubForPath('/dashboard/conversations/cnv_0001').key).toBe('runs');
    expect(detailPageBySlug('conversations').id).toBe('conversations');
    expect(PAGE_VIEWS.conversations).toBeTruthy();
    expect(DETAIL_VIEWS.conversations).toBeTruthy();
  });

  it('lists title, agent, state, turns, affinity node, fallbacks, and activity with tooltips', () => {
    const columns = conversationsConfig.columns(ctx);
    expect(columns.map((c) => c.key).slice(0, 6)).toEqual(['title', 'agentName', 'state', 'turnCount', 'affinityNodeName', 'fallbackCount']);
    for (const c of columns) expect(c.tip.length, c.key).toBeGreaterThan(25);
    const [first, busy, untitled] = rows();
    expect(render('title', first)).toContain('Plan the release 1');
    expect(render('title', untitled)).toContain('Untitled conversation');
    expect(render('state', busy)).toContain('Working');
    expect(render('state', first)).toContain('Idle');
    expect(render('fallbackCount', first)).toMatch(/data-tip="[^"]*Affinity wait expired/);
    expect(render('lastFallbackReason', first)).toContain('Affinity wait expired');
    expect(render('affinityNodeName', first)).toContain('garrison-worker-0');
    expect(conversationsConfig.detailPath(first)).toBe('/dashboard/conversations/cnv_0001');
  });

  it('filters by agent with names from the lookups, keeping an agent from the URL', () => {
    const filter = conversationsConfig.filters.find((f) => f.name === 'agentId');
    expect(filter.options({ agents: { agt_1: 'echo' } }, {})).toEqual(['agt_1']);
    expect(filter.options({ agents: { agt_1: 'echo' } }, { agentId: 'agt_9' })).toEqual(['agt_1', 'agt_9']);
    expect(filter.optionLabel('agt_1', t, { agents: { agt_1: 'echo' } })).toBe('echo');
    expect(filter.optionLabel('agt_9', t, {})).toBe('agt_9');
    expect(conversationsConfig.urlFilters).toContain('agentId');
    expect(runsConfig.urlFilters).toContain('conversationId');
  });

  it('continues a conversation in Invoke and lists its turns as runs', () => {
    const navigate = vi.fn();
    const [cont, runs] = conversationsConfig.rowActions(rows()[0], { ...ctx, navigate });
    cont.onClick();
    runs.onClick();
    expect(navigate).toHaveBeenNthCalledWith(1, '/dashboard/invoke?agentId=agt_0001&conversationId=cnv_0001');
    expect(navigate).toHaveBeenNthCalledWith(2, '/dashboard/runs?conversationId=cnv_0001');
  });

  it('deletes through the API and offers delete even for a busy conversation (the server answers 409)', async () => {
    const remove = vi.fn().mockResolvedValue(null);
    await conversationsConfig.api.remove({ deleteConversation: remove }, 'default', 'cnv_0002');
    expect(remove).toHaveBeenCalledWith('default', 'cnv_0002');
    expect(conversationsConfig.canDelete(rows()[1])).toBe(true);
  });

  it('shows the state badge and an untitled placeholder', () => {
    expect(renderToStaticMarkup(<ConversationState conversation={{ busy: true }} t={t} />)).toContain('pill-info');
    expect(conversationTitle(t, { title: null })).toBe('Untitled conversation');
  });
});

describe('conversation turns', () => {
  const t = (...args) => i18n.t(...args);
  const turns = () => get('conversations/cnv_0001/runs?maxResults=1000&skip=0').objects;

  it('serves the turns oldest first with their session details', () => {
    const list = turns();
    expect(list.map((r) => r.id)).toEqual(CONVERSATION_TURN_RUNS.map((i) => `run_${String(i).padStart(4, '0')}`));
    expect(list.map((r) => r.conversationTurn)).toEqual([1, 2, 3]);
    expect(list.map(turnSessionMode)).toEqual(['first', 'resumed', 'fallback']);
    expect(get('runs/run_0001').conversationTurn).toBe(0);
    expect(get('conversations/cnv_0002').busy).toBe(true);
  });

  it('labels each turn session with a translated badge and the fallback reason', () => {
    const [first, resumed, fallback] = turns().map((r) => renderToStaticMarkup(<TurnSession run={r} t={t} />));
    expect(first).toContain('New session');
    expect(resumed).toContain('Resumed');
    expect(resumed).toMatch(/data-tip="[^"]*ses-1/);
    expect(fallback).toContain('Fresh session');
    expect(fallback).toContain('Affinity wait expired');
    expect(renderToStaticMarkup(<TurnSession run={{ conversationId: null }} t={t} />)).toBe('-');
  });

  it('labels and explains every fallback reason, the new outcome, and the audit event', () => {
    for (const reason of ENUMS.conversationFallbackReason) {
      expect(t(`enums.conversationFallbackReason.${reason}`)).not.toBe(`enums.conversationFallbackReason.${reason}`);
      expect(t(`tips.enums.conversationFallbackReason.${reason}`).length).toBeGreaterThan(40);
    }
    expect(ENUMS.runOutcome).toContain('ConversationStateLost');
    expect(ENUMS.auditEventType).toContain('ConversationDeleted');
    expect(t('enums.runOutcome.ConversationStateLost')).toBe('Conversation state lost');
  });

  it('shows the conversation and turn of a run in the Runs list', () => {
    const column = runsConfig.columns({ t, i18n }).find((c) => c.key === 'conversationId');
    expect(column.defaultHidden).toBe(true);
    const markup = renderToStaticMarkup(<>{column.render(turns()[1])}</>);
    expect(markup).toContain('cnv_0001');
    expect(markup).toContain('turn 2');
    expect(column.render({ conversationId: null })).toBe('-');
  });
});

describe('conversation fallback prompt role', () => {
  it('binds a Task template, defaulting to builtin/conversation-fallback', () => {
    expect(PROMPT_ROLES).toContain('ConversationFallback');
    expect(templateKindForRole('ConversationFallback')).toBe('Task');
    const templates = [
      { id: 'pt_task', name: 'builtin/default-task', kind: 'Task', isBuiltIn: true, builtInKey: 'default-task' },
      { id: 'pt_fb', name: 'builtin/conversation-fallback', kind: 'Task', isBuiltIn: true, builtInKey: 'conversation-fallback' }
    ];
    expect(defaultTemplateFor('ConversationFallback', templates)).toBe('pt_fb');
    expect(i18n.t('resources.deployments.promptRoles.ConversationFallback')).toMatch(/Conversation fallback/);
  });
});

describe('conversation API methods', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(body, status = 200) {
    const calls = [];
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push({ url: String(url), method: init?.method, body: init?.body });
      return { ok: status < 400, status, statusText: '', text: async () => (body === null ? '' : JSON.stringify(body)) };
    });
    return calls;
  }
  const client = () => new ApiClient('http://127.0.0.1:8700');
  const T = 'http://127.0.0.1:8700/v1.0/api/tenants/default';

  it('lists conversations with filters and paging', async () => {
    const calls = stubFetch(get('conversations?maxResults=25&skip=0'));
    const page = await client().listConversations('default', { pageNumber: 2, pageSize: 25, agentId: 'agt_0001', search: 'plan' });
    expect(calls[0].url).toBe(`${T}/conversations?agentId=agt_0001&search=plan&maxResults=25&skip=25`);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('reads, deletes, and lists the turns of a conversation', async () => {
    let calls = stubFetch(get('conversations/cnv_0001'));
    expect((await client().getConversation('default', 'cnv_0001')).turnCount).toBe(3);
    expect(calls[0].url).toBe(`${T}/conversations/cnv_0001`);
    calls = stubFetch(get('conversations/cnv_0001/runs?maxResults=1000&skip=0'));
    expect((await client().listConversationRuns('default', 'cnv_0001')).items).toHaveLength(3);
    expect(calls[0].url).toBe(`${T}/conversations/cnv_0001/runs?maxResults=1000&skip=0`);
    calls = stubFetch(null, 204);
    expect(await client().deleteConversation('default', 'cnv_0001')).toBeNull();
    expect(calls[0]).toMatchObject({ url: `${T}/conversations/cnv_0001`, method: 'DELETE' });
  });

  it('surfaces 409 ConversationBusy on delete as an ApiError with its code', async () => {
    stubFetch({ code: 'ConversationBusy', message: 'Conversation cnv_0002 has an unfinished turn (run run_0004).' }, 409);
    const err = await client().deleteConversation('default', 'cnv_0002').catch((e) => e);
    expect(err.status).toBe(409);
    expect(err.code).toBe('ConversationBusy');
    expect(errorMessage(i18n.getFixedT('en'), err)).toMatch(/previous turn/);
  });

  it('sends startConversation and conversationId in the invoke body', async () => {
    const calls = stubFetch(get('runs/run_0036'));
    await client().invokeAgent('default', 'agt_0001', { input: 'hi', ...conversationBody('continue', 'cnv_0001') });
    expect(JSON.parse(calls[0].body)).toEqual({ input: 'hi', conversationId: 'cnv_0001' });
    await client().invokeAgent('default', 'agt_0001', { input: 'hi', ...conversationBody('start') });
    expect(JSON.parse(calls[1].body)).toEqual({ input: 'hi', startConversation: true });
  });
});
