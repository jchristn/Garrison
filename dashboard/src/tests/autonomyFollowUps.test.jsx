// AA12.8 follow-ups after the server fixes: keeper and escalation audit event types, the board's "and n earlier"
// count of unhealthy reports, 409 RevisionUnchanged on keeper publish and board direction, typed field errors
// (InvalidType, InvalidValue), and the harness profile MCP tool name prefix.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import BoardView from '../views/BoardView';
import KeeperDetailView from '../views/KeeperDetailView';
import KeeperRevisionModal from '../components/KeeperRevisionModal';
import { harnessProfilesConfig, mcpToolNamePrefixError } from '../views/resourceConfigs';
import { ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { errorMessage, fieldCodeText, fieldErrorMessages } from '../utils/errors';
import { revisionToForm, sameRevisionContent } from '../utils/keepers';
import { board, keeper, keeperRevision, keeperTick } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const page = (items) => ({ items, totalCount: items.length, pageNumber: 1, pageSize: 25 });

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
  return { addToast };
}

const unchanged = (extra = {}) => Object.assign(new Error('unchanged'), { status: 409, code: 'RevisionUnchanged', body: { code: 'RevisionUnchanged', message: 'Revision 3 is the same as the current revision 2.' }, ...extra });

describe('audit event types', () => {
  it('lists the keeper and escalation events with a label and a tooltip', () => {
    for (const v of ['MandatePaused', 'MandateResumed', 'MandateWoken', 'MandateDeleted', 'EscalationAnswered', 'EscalationCancelled', 'FreezeApplied', 'FreezeLifted', 'KillSwitchChanged', 'BoardDirectionGiven', 'UnitCascadeCancelled', 'OrgBudgetFrozen']) {
      expect(ENUMS.auditEventType).toContain(v);
      expect(enumLabel(t, 'auditEventType', v)).not.toBe(v);
      expect(enumTip(t, 'auditEventType', v)).toBeTruthy();
    }
    expect(enumLabel(t, 'auditEventType', 'MandateWoken')).toBe('Keeper woken');
  });
});

describe('board unhealthy reports', () => {
  it('says how many earlier reports the author filed and links to them', async () => {
    const b = board(1);
    const first = b.unhealthyReports[0];
    const apiClient = { getBoard: vi.fn(async () => ({ ...b, unhealthyEarlierCounts: { [first.id]: 3 } })), listOrgProposals: vi.fn(async () => page([])), listFreezes: vi.fn(async () => page([])) };
    mount(<BoardView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    const earlier = q(`[data-testid="board-unhealthy-earlier-${first.id}"]`);
    expect(earlier.textContent).toBe('and 3 earlier');
    if (first.authorAgentId) expect(earlier.getAttribute('href')).toBe(pathFor('reports', null, { author: first.authorAgentId }));
    expect(earlier.getAttribute('data-tip')).toContain('3 earlier');
    expect(q(`[data-testid="board-unhealthy-earlier-${b.unhealthyReports[1].id}"]`)).toBeNull();
  });

  it('explains a direction the CEO already has instead of showing an error', async () => {
    const b = board(1);
    const apiClient = {
      getBoard: vi.fn(async () => b),
      listOrgProposals: vi.fn(async () => page([])),
      listFreezes: vi.fn(async () => page([])),
      giveBoardDirection: vi.fn(async () => {
        throw unchanged();
      })
    };
    mount(<BoardView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    const text = q('[data-testid="board-direction-text"]');
    expect(text).not.toBeNull();
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(text, 'Keep refunds under 2 percent.');
      text.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => q('[data-testid="board-direction-submit"]').click());
    await flush();
    expect(apiClient.giveBoardDirection).toHaveBeenCalled();
    expect(q('[data-testid="board-direction-unchanged"]').textContent).toContain('already has this direction');
  });
});

describe('RevisionUnchanged', () => {
  it('compares revision content the way the server does', () => {
    const current = keeperRevision(1);
    expect(sameRevisionContent({ ...current, id: 'mdr_9', number: 9, state: 'Draft', changeNote: 'retry' }, current)).toBe(true);
    expect(sameRevisionContent({ ...current, objective: `  ${current.objective}  ` }, current)).toBe(true);
    expect(sameRevisionContent({ ...current, objective: 'Something else' }, current)).toBe(false);
    expect(sameRevisionContent({ ...current, briefIntervalHours: 24 }, current)).toBe(false);
    expect(sameRevisionContent(revisionToForm(current), current, { isForm: true })).toBe(true);
    expect(sameRevisionContent({ ...revisionToForm(current), direction: 'New' }, current, { isForm: true })).toBe(false);
    expect(sameRevisionContent(current, null)).toBe(false);
  });

  it('disables Publish on a draft that matches the current revision', async () => {
    const m = keeper(1);
    const draft = { ...m.currentRevision, id: 'mdr_0009', number: 9, state: 'Draft', publishedUtc: undefined };
    const apiClient = {
      getMandate: vi.fn(async () => m),
      listMandateTicks: vi.fn(async () => page([keeperTick(1)])),
      listMandateRevisions: vi.fn(async () => page([draft, m.currentRevision])),
      getAgent: vi.fn(async () => ({ id: 'agt_0001', name: 'echo-agent' })),
      getDeployment: vi.fn(async () => ({ id: 'dep_0001', name: 'deployment-1' })),
      publishMandateRevision: vi.fn(async () => m)
    };
    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient });
    await flush();
    await flush();
    const publish = q('[data-testid="keeper-revision-publish-9"]');
    expect(publish.getAttribute('aria-disabled')).toBe('true');
    expect(publish.getAttribute('data-tip')).toContain('says the same as the current one');
    await act(async () => publish.click());
    expect(apiClient.publishMandateRevision).not.toHaveBeenCalled();
  });

  it('disables Publish in New revision until something changes, and explains a 409', async () => {
    const m = keeper(1);
    const apiClient = {
      createMandateRevision: vi.fn(async (_t, _id, body) => ({ ...body, id: 'mdr_0099', number: 4, state: 'Draft' })),
      publishMandateRevision: vi.fn(async () => {
        throw unchanged();
      })
    };
    const onSaved = vi.fn();
    const onClose = vi.fn();
    const { addToast } = mount(<KeeperRevisionModal mandate={m} onClose={onClose} onSaved={onSaved} />, { apiClient });
    const publish = q('[data-testid="keeper-revision-publish"]');
    expect(publish.getAttribute('aria-disabled')).toBe('true');
    await act(async () => publish.click());
    expect(apiClient.createMandateRevision).not.toHaveBeenCalled();
    const objective = q('#keeper-revision-objective');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(objective, 'A different objective.');
      objective.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(q('[data-testid="keeper-revision-publish"]').getAttribute('aria-disabled')).toBeNull();
    await act(async () => q('[data-testid="keeper-revision-publish"]').click());
    await flush();
    expect(addToast).toHaveBeenCalledWith({ type: 'warning', message: 'Saved revision 4 as a draft, but did not publish it: it says the same as the current revision.' });
    expect(onClose).toHaveBeenCalled();
    expect(errorMessage(t, unchanged())).toContain('Nothing changed');
  });
});

describe('typed field errors', () => {
  it('translates InvalidType and InvalidValue and keeps them on their fields', () => {
    expect(fieldCodeText(t, 'InvalidType', 'minIntervalSeconds must be a whole number.')).toBe('Enter a whole number.');
    expect(fieldCodeText(t, 'InvalidType', 'wakeMode must be one of Fixed, Backoff.')).toBe('Choose one of: Fixed, Backoff.');
    expect(fieldCodeText(t, 'InvalidType', 'x must be something odd.')).toBe('This value has the wrong type.');
    expect(fieldCodeText(t, 'InvalidValue', 'status must be one of Active, Paused.')).toBe('Choose one of: Active, Paused.');
    expect(fieldCodeText(t, 'InvalidValue', 'Enter an amount from 0 to 1000000.')).toBe('Enter a value from 0 to 1000000.');
    expect(fieldCodeText(t, 'Other', 'x')).toBeNull();
    const body = { code: 'InvalidBody', fields: { minIntervalSeconds: 'minIntervalSeconds must be a whole number.' }, fieldCodes: { minIntervalSeconds: 'InvalidType' } };
    expect(fieldErrorMessages(t, body)).toEqual({ minIntervalSeconds: 'Enter a whole number.' });
    expect(errorMessage(t, body)).toBe('minIntervalSeconds: Enter a whole number.');
    const budget = { code: 'ValidationFailed', fields: { budgetPerTickUsd: 'Enter an amount from 0 to 1000000.' }, fieldCodes: { budgetPerTickUsd: 'InvalidValue' } };
    expect(fieldErrorMessages(t, budget)).toEqual({ budgetPerTickUsd: 'Enter a value from 0 to 1000000.' });
  });
});

describe('harness profile MCP tool name prefix', () => {
  it('shows the field, round-trips the value, and validates it like the server', () => {
    const fields = harnessProfilesConfig.fields(harnessProfilesConfig.blank(), { t, mode: 'create', options: {} });
    const field = fields.find((f) => f.name === 'mcpToolNamePrefix');
    expect(field.label).toBe('MCP tool name prefix');
    expect(field.tip).toContain('{server}');
    expect(harnessProfilesConfig.blank().mcpToolNamePrefix).toBe('');
    const stored = { name: 'mux-custom', executable: 'mux', mcpToolNamePrefix: '{server}.', successExitCodes: [0], toolProbes: [] };
    expect(harnessProfilesConfig.toBody(harnessProfilesConfig.toForm(stored)).mcpToolNamePrefix).toBe('{server}.');
    expect(harnessProfilesConfig.toBody({ ...harnessProfilesConfig.blank(), name: 'x', executable: 'x' }).mcpToolNamePrefix).toBeNull();
    expect(mcpToolNamePrefixError('mcp__{server}__', t)).toBe('');
    expect(mcpToolNamePrefixError('', t)).toBe('');
    expect(mcpToolNamePrefixError('bad prefix!', t)).toContain('Use only letters');
    expect(mcpToolNamePrefixError('a'.repeat(129), t)).toContain('128');
    expect(harnessProfilesConfig.validate({ name: 'x', executable: 'x', mcpToolNamePrefix: 'x y' }, t).mcpToolNamePrefix).toBeTruthy();
  });
});
