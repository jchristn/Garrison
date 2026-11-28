// Organization templates (LP3.8): the embedded manifests match the examples, each template names what it creates,
// and the picker previews with a dry run, applies through the manifest apply route, and opens the result on Design.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import OrgTemplateModal from '../components/orgDesigner/OrgTemplateModal';
import { GERBIL_MANIFEST, SITE_RELIABILITY_MANIFEST } from '../utils/orgTemplateManifests';
import { ORG_TEMPLATES, appliedOrganizationId, orgTemplate, templateContents } from '../utils/orgTemplates';
import { TEMPLATE_FILES, joined } from '../../scripts/sync-org-templates.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
  document.body.innerHTML = '';
});

function Where() {
  const location = useLocation();
  return <div data-testid="where">{`${location.pathname}${location.search}`}</div>;
}

function mount(element, apiClient) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={['/dashboard/organizations']}>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default' }}>
            <ToastContext.Provider value={{ addToast: vi.fn() }}>
              {element}
              <Routes>
                <Route path="*" element={<Where />} />
              </Routes>
            </ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    )
  );
  mounted.push({ root, container });
  return container;
}

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const where = () => document.querySelector('[data-testid="where"]').textContent;

describe('template manifests', () => {
  it('match the example files (run scripts/sync-org-templates.mjs after changing an example)', () => {
    expect(GERBIL_MANIFEST).toBe(joined(TEMPLATE_FILES.GERBIL_MANIFEST));
    expect(SITE_RELIABILITY_MANIFEST).toBe(joined(TEMPLATE_FILES.SITE_RELIABILITY_MANIFEST));
  });

  it('name everything they create, with the organization last', () => {
    expect(ORG_TEMPLATES.map((x) => x.id)).toEqual(['blank', 'gerbil', 'siteReliability']);
    expect(templateContents(orgTemplate('gerbil').manifest).map((c) => `${c.kind}/${c.name}`)).toEqual(['PromptTemplate/gerbil-system', 'Agent/gerbil', 'Mandate/gerbil-keeper', 'HarnessProfile/autonomy-script', 'Deployment/gerbil', 'Organization/gerbil-org']);
    const sre = templateContents(orgTemplate('siteReliability').manifest);
    expect(sre.filter((c) => c.kind === 'Organization')).toEqual([{ kind: 'Organization', name: 'site-reliability-org' }]);
    expect(sre.filter((c) => c.kind === 'Mandate').length).toBe(5);
    expect(templateContents(null)).toEqual([]);
    expect(appliedOrganizationId({ items: [{ kind: 'Agent', name: 'gerbil', resourceId: 'agt_1' }, { kind: 'Organization', name: 'gerbil-org', resourceId: 'org_9' }] }, 'gerbil-org')).toBe('org_9');
    expect(appliedOrganizationId({ items: [] }, 'x')).toBeNull();
  });
});

describe('template picker', () => {
  it('previews a template with a dry run, applies it, and opens the organization on Design', async () => {
    const items = [{ kind: 'Organization', name: 'gerbil-org', result: 'Validated', resourceId: 'org_9', message: 'Would be created.' }];
    const apiClient = {
      applyManifest: vi.fn((_t, _text, dryRun) => Promise.resolve(dryRun ? { failedCount: 0, items } : { failedCount: 0, items: [{ ...items[0], result: 'Created' }] }))
    };
    const onClose = vi.fn();
    const c = mount(<OrgTemplateModal onClose={onClose} />, apiClient);
    act(() => document.querySelector('[data-testid="org-template-gerbil"]').click());
    const apply = document.querySelector('[data-testid="org-template-apply"]');
    expect(apply.getAttribute('aria-disabled')).toBe('true');
    expect(document.querySelector('[data-template-item="Organization/gerbil-org"]')).not.toBeNull();
    await act(async () => document.querySelector('[data-testid="org-template-preview"]').click());
    expect(apiClient.applyManifest).toHaveBeenLastCalledWith('default', orgTemplate('gerbil').manifest, true);
    expect(document.querySelector('[data-template-item="Organization/gerbil-org"]').textContent).toContain('Would be created.');
    await act(async () => document.querySelector('[data-testid="org-template-apply"]').click());
    await flush();
    expect(apiClient.applyManifest).toHaveBeenLastCalledWith('default', orgTemplate('gerbil').manifest, false);
    expect(onClose).toHaveBeenCalled();
    expect(where()).toBe('/dashboard/organizations/org_9?tab=design');
    expect(c).toBeTruthy();
  });

  it('keeps Apply off when the dry run finds a failure, and shows it', async () => {
    const apiClient = { applyManifest: vi.fn(() => Promise.resolve({ failedCount: 1, items: [{ kind: 'Organization', name: 'site-reliability-org', result: 'Failed', message: 'OrganizationRetired' }] })) };
    mount(<OrgTemplateModal onClose={vi.fn()} />, apiClient);
    act(() => document.querySelector('[data-testid="org-template-siteReliability"]').click());
    await act(async () => document.querySelector('[data-testid="org-template-preview"]').click());
    expect(document.querySelector('[data-testid="org-template-apply"]').getAttribute('aria-disabled')).toBe('true');
    await act(async () => document.querySelector('[data-testid="org-template-apply"]').click());
    expect(apiClient.applyManifest).toHaveBeenCalledTimes(1);
  });

  it('creates a blank organization by name and opens it on Design', async () => {
    const apiClient = { createOrganization: vi.fn(() => Promise.resolve({ id: 'org_7', name: 'refunds' })) };
    mount(<OrgTemplateModal onClose={vi.fn()} />, apiClient);
    const name = document.querySelector('#org-template-blank-name');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(name, 'refunds');
      name.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => document.querySelector('[data-testid="org-template-apply"]').click());
    await flush();
    expect(apiClient.createOrganization).toHaveBeenCalledWith('default', expect.objectContaining({ name: 'refunds' }));
    expect(where()).toBe('/dashboard/organizations/org_7?tab=design');
  });
});
