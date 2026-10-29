// Fan-out groups (AD5.8): the helpers, the API client routes, the run tree on Run detail (groups with policy, progress,
// budget, deadline, and members; other children in a plain list; a placeholder when details fail to load), Cancel
// group, polling without the live channel, labels and tooltips for the new enums, and the translated end reasons.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { en, TRANSLATIONS } from '../i18n/resources';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import RunChildrenTree from '../components/RunChildrenTree';
import FanOutGroupPanel from '../components/FanOutGroupPanel';
import ApiClient from '../utils/api';
import { ENUMS } from '../utils/constants';
import { translateServerText } from '../utils/serverText';
import { FAN_OUT_POLL_MS, budgetUse, buildRunTree, fanOutChannel, fanOutTone, isFanOutStatus, memberLabel, mergeGroup } from '../utils/fanOut';
import { FAN_OUT_PARENT_RUN, fanOutGroup, fanOutMemberRuns, respond } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

let mounted = [];
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
  vi.useRealTimers();
});

function mount(element, { apiClient = {}, addToast = vi.fn() } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>{element}</ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast };
}

function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const children = () => [...fanOutMemberRuns(), { id: 'run_child', agentName: 'echo-agent', status: 'Succeeded' }];

describe('helpers', () => {
  it('names the channel and recognizes its messages', () => {
    expect(fanOutChannel('fog_1')).toBe('fan-out:fog_1');
    expect(isFanOutStatus({ type: 'fan-out.status', fanOutGroup: { fanOutGroupId: 'fog_1' } }, 'fog_1')).toBe(true);
    expect(isFanOutStatus({ type: 'fan-out.status', fanOutGroup: { fanOutGroupId: 'fog_2' } }, 'fog_1')).toBe(false);
    expect(isFanOutStatus({ type: 'files.changed' }, 'fog_1')).toBe(false);
    expect(FAN_OUT_POLL_MS).toBeGreaterThan(0);
  });

  it('measures budget use only against a positive limit', () => {
    expect(budgetUse(0.17, 0.5)).toEqual({ share: 0.34, over: false });
    expect(budgetUse(30000, 20000)).toEqual({ share: 1, over: true });
    expect(budgetUse(5, null)).toBeNull();
    expect(budgetUse(5, undefined)).toBeNull();
    expect(budgetUse(5, 0)).toBeNull();
    expect(budgetUse(undefined, 10)).toEqual({ share: 0, over: false });
  });

  it('gives every status a tone and every member a label', () => {
    expect(ENUMS.fanOutGroupStatus.map(fanOutTone)).toEqual(['info', 'success', 'warning', 'warning', 'neutral']);
    expect(memberLabel({ label: 'a', agent: 'b' }, 0)).toBe('a');
    expect(memberLabel({ agent: 'b' }, 0)).toBe('b');
    expect(memberLabel({}, 2)).toBe('#3');
  });

  it('gathers children under their groups in the server order and keeps the rest apart', () => {
    const tree = buildRunTree(children(), [fanOutGroup('fog_0001'), fanOutGroup('fog_0002')]);
    expect(tree.groups.map((g) => [g.id, g.runs.length])).toEqual([
      ['fog_0001', 2],
      ['fog_0002', 3]
    ]);
    expect(tree.others.map((r) => r.id)).toEqual(['run_child']);
    const missing = buildRunTree(children(), [fanOutGroup('fog_0002')]);
    expect(missing.groups.map((g) => [g.id, g.group === null])).toEqual([
      ['fog_0002', false],
      ['fog_0001', true]
    ]);
    expect(buildRunTree(null, null)).toEqual({ groups: [], others: [] });
  });

  it('replaces a group in place and appends a new one', () => {
    const list = [fanOutGroup('fog_0001'), fanOutGroup('fog_0002')];
    const next = mergeGroup(list, { ...list[0], status: 'Cancelled' });
    expect(next.map((g) => g.status)).toEqual(['Cancelled', 'Running']);
    expect(mergeGroup(list, { fanOutGroupId: 'fog_9' })).toHaveLength(3);
    expect(mergeGroup(list, null)).toBe(list);
  });
});

describe('mocks', () => {
  it('serve a parent run with a three-member running group', () => {
    const groups = respond('GET', new URL(`http://127.0.0.1/v1.0/api/tenants/default/runs/${FAN_OUT_PARENT_RUN}/fan-out-groups`));
    expect(groups.map((g) => [g.fanOutGroupId, g.status, g.total])).toEqual([
      ['fog_0001', 'Joined', 2],
      ['fog_0002', 'Running', 3]
    ]);
    expect(respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/runs/run_0001/fan-out-groups'))).toEqual([]);
    expect(respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/runs/run_0062')).fanOutGroupId).toBe('fog_0002');
    expect(respond('POST', new URL('http://127.0.0.1/v1.0/api/tenants/default/fan-out-groups/fog_0002/cancel')).status).toBe('Cancelled');
  });
});

describe('API client', () => {
  it('calls the fan-out routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push(`${init.method} ${new URL(String(url)).pathname}`);
      if (String(url).endsWith('/fan-out-groups')) return new Response(JSON.stringify([fanOutGroup('fog_0002')]), { status: 200 });
      return new Response(JSON.stringify(fanOutGroup('fog_0002')), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      expect((await client.listRunFanOutGroups('default', 'run_1')).map((g) => g.fanOutGroupId)).toEqual(['fog_0002']);
      expect((await client.getFanOutGroup('default', 'fog_0002')).total).toBe(3);
      await client.cancelFanOutGroup('default', 'fog_0002');
      expect(calls).toEqual(['GET /v1.0/api/tenants/default/runs/run_1/fan-out-groups', 'GET /v1.0/api/tenants/default/fan-out-groups/fog_0002', 'POST /v1.0/api/tenants/default/fan-out-groups/fog_0002/cancel']);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('run tree', () => {
  const client = (extra = {}) => ({
    listRunFanOutGroups: vi.fn(async () => [fanOutGroup('fog_0001'), fanOutGroup('fog_0002')]),
    getFanOutGroup: vi.fn(async (_t, id) => fanOutGroup(id)),
    cancelFanOutGroup: vi.fn(async (_t, id) => ({ ...fanOutGroup(id), status: 'Cancelled', statusReason: 'Cancelled by admin@garrison.' })),
    ...extra
  });

  it('shows each group with its policy, progress, budget, deadline, and members, then the other children', async () => {
    const apiClient = client();
    mount(<RunChildrenTree runId={FAN_OUT_PARENT_RUN} items={children()} />, { apiClient });
    await flush();
    const groups = qa('[data-testid="fan-out-group"]');
    expect(groups.map((g) => g.getAttribute('data-group'))).toEqual(['fog_0001', 'fog_0002']);
    const running = groups[1];
    expect(running.querySelector('[data-testid="fan-out-policy"]').textContent).toBe('Quorum: 2 of 3');
    expect(running.querySelector('[data-testid="fan-out-policy"]').getAttribute('data-tip')).toBe(en.tips.enums.fanOutJoinPolicy.Quorum);
    expect(running.querySelector('[data-testid="fan-out-progress"]').textContent).toBe('1 of 3 finished, 1 succeeded');
    expect(running.querySelector('[data-testid="fan-out-tokens"] [role="meter"]').getAttribute('aria-valuenow')).toBe('30');
    expect(running.querySelectorAll('[data-testid="fan-out-members"] tbody tr')).toHaveLength(3);
    expect(running.querySelector('[data-testid="fan-out-status"]').closest('.pill').getAttribute('data-tip')).toBe(en.tips.enums.fanOutGroupStatus.Running);
    expect(groups[0].querySelector('[data-testid="fan-out-cost"]').textContent).toContain('(no limit)');
    expect(groups[0].querySelector('[data-testid="fan-out-cancel"]')).toBeNull();
    expect(qa('[data-testid="run-children"] li').map((li) => li.textContent)).toEqual([expect.stringContaining('run_child')]);
  });

  it('keeps a group whose details failed to load together, with a note', async () => {
    const apiClient = client({ listRunFanOutGroups: vi.fn(async () => [fanOutGroup('fog_0002')]) });
    mount(<RunChildrenTree runId={FAN_OUT_PARENT_RUN} items={children()} />, { apiClient });
    await flush();
    const placeholder = q('[data-testid="fan-out-group"][data-group="fog_0001"]');
    expect(placeholder.textContent).toContain(en.components.fanOut.detailsUnavailable);
    expect(placeholder.querySelectorAll('li')).toHaveLength(2);
  });

  it('says there are no children when the run has none', async () => {
    mount(<RunChildrenTree runId="run_1" items={[]} />, { apiClient: client({ listRunFanOutGroups: vi.fn(async () => []) }) });
    await flush();
    expect(q('[data-testid="run-tree"]').textContent).toContain(en.views.runDetail.noChildren);
  });
});

describe('group panel', () => {
  it('cancels after confirmation and passes the new view on', async () => {
    const onChange = vi.fn();
    const apiClient = { cancelFanOutGroup: vi.fn(async () => ({ ...fanOutGroup('fog_0002'), status: 'Cancelled' })), getFanOutGroup: vi.fn() };
    const { addToast } = mount(<FanOutGroupPanel group={fanOutGroup('fog_0002')} onChange={onChange} />, { apiClient });
    click(q('[data-testid="fan-out-cancel"]'));
    const confirm = qa('.modal button').find((b) => b.textContent.includes('Cancel group'));
    await act(async () => {
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush();
    expect(apiClient.cancelFanOutGroup).toHaveBeenCalledWith('default', 'fog_0002');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'Cancelled' }));
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('polls a running group without the live channel, and not an ended one', async () => {
    vi.useFakeTimers();
    const apiClient = { getFanOutGroup: vi.fn(async () => fanOutGroup('fog_0002')) };
    mount(<FanOutGroupPanel group={fanOutGroup('fog_0002')} onChange={() => {}} />, { apiClient });
    mount(<FanOutGroupPanel group={fanOutGroup('fog_0001')} onChange={() => {}} />, { apiClient });
    await act(async () => {
      vi.advanceTimersByTime(FAN_OUT_POLL_MS + 10);
    });
    expect(apiClient.getFanOutGroup).toHaveBeenCalledTimes(1);
    expect(apiClient.getFanOutGroup).toHaveBeenCalledWith('default', 'fog_0002');
  });
});

describe('catalog', () => {
  it('labels and explains every fan-out status and policy in every locale', () => {
    for (const [code, catalog] of [['en', en], ...Object.entries(TRANSLATIONS)]) {
      for (const group of ['fanOutGroupStatus', 'fanOutJoinPolicy']) {
        for (const value of ENUMS[group]) {
          expect(typeof catalog.enums[group][value], `${code} enums.${group}.${value}`).toBe('string');
          expect(catalog.tips.enums[group][value].length, `${code} tips.enums.${group}.${value}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it('translates the reasons a group ends', () => {
    expect(translateServerText(t, 'A member succeeded.')).toBe('A member succeeded.');
    expect(translateServerText(t, '2 members succeeded, meeting the quorum of 2.')).toBe('2 members succeeded, meeting the quorum of 2.');
    expect(translateServerText(t, "The group's timeout of 60 seconds passed with 1 members still running.")).toBe("The group's timeout of 60 seconds passed with 1 members still running.");
    const de = i18n.getFixedT('de');
    expect(translateServerText(de, 'The members spent 0.62 USD, over the budget of 0.5 USD.')).toBe('Die Mitglieder haben 0.62 USD ausgegeben, mehr als das Budget von 0.5 USD.');
    expect(translateServerText(de, 'Cancelled by admin@garrison.')).toBe('Abgebrochen von admin@garrison.');
    expect(translateServerText(de, 'Too many members failed for the quorum of 3 to be met.')).toBe('Zu viele Mitglieder sind gescheitert, um das Quorum von 3 noch zu erreichen.');
  });
});
