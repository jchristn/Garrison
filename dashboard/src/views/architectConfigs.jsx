// ResourceView configuration for agent architects: Agents > Architects. Re-exported by resourceConfigs.jsx so the
// configuration-wide tests (tooltips, i18n keys, enum labels) cover it.

import { Suspense, lazy } from 'react';
import CopyableId from '../components/CopyableId';
import Modal from '../components/Modal';
import NamedId from '../components/NamedId';
import { ActiveBadge, Badge } from '../components/StatusBadge';
import { tip } from '../components/Tooltip';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime, truncate } from '../i18n/formatters';
import { resourceTip, optionalText } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { holds, loadCallerPermissions } from '../utils/apps';
import { studioPermissions } from '../utils/studio';

// The prompt manager comes with the studio chunk, loaded only when someone opens it.
const ArchitectPromptPanel = lazy(() => import('../components/studio/ArchitectPromptPanel'));

const ID = 'architects';
const DEFAULT_PROMPT = 'builtin/agent-architect';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

function field(t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${ID}.hints.${name}`);
  return { name, type, label: t(`resources.${ID}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, ID, name), ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

/** The prompt an architect uses, with "pinned to version n" or "follows the current version". */
export function architectPromptLabel(t, r) {
  const name = r?.architectPromptName || r?.architectPromptTemplateId || '-';
  return r?.architectPromptVersion ? t('resources.architects.promptPinned', { name, version: r.architectPromptVersion }) : name;
}

/** A blank architect form: the default name, active, and the default prompt (chosen once the prompts load). */
export function blankArchitect() {
  return { name: 'architect', description: '', harnessProfileId: '', model: '', active: true, architectPromptTemplateId: '', architectPromptVersion: '' };
}

/** Form values from an architect. */
export function architectToForm(r) {
  return {
    id: r.id,
    name: r.name || '',
    description: r.description || '',
    harnessProfileId: r.harnessProfileId || '',
    model: r.model || '',
    active: r.active !== false,
    architectPromptTemplateId: r.architectPromptTemplateId || '',
    architectPromptVersion: r.architectPromptVersion ?? ''
  };
}

/** Body for POST and PUT /studio/architects. A blank model uses the harness profile's default; a blank version follows the current one. */
export function architectToRequest(d) {
  const body = { name: String(d.name || '').trim(), description: d.description ? d.description : null, harnessProfileId: d.harnessProfileId, active: d.active !== false };
  const model = String(d.model || '').trim();
  body.model = model || null;
  if (d.architectPromptTemplateId) body.architectPromptTemplateId = d.architectPromptTemplateId;
  const version = d.architectPromptVersion === '' || d.architectPromptVersion == null ? null : Number(d.architectPromptVersion);
  if (version != null && d.architectPromptTemplateId) body.architectPromptVersion = version;
  return body;
}

/** Client-side checks: name and harness profile are required; a pinned version is a whole number from 1. */
export function architectErrors(d, t) {
  const errors = {};
  if (!String(d.name || '').trim()) errors.name = t('common.errors.required');
  if (!d.harnessProfileId) errors.harnessProfileId = t('common.errors.required');
  const v = d.architectPromptVersion;
  if (v !== '' && v != null && (!Number.isInteger(Number(v)) || Number(v) < 1)) errors.architectPromptVersion = t('resources.architects.errors.version');
  return Object.keys(errors).length ? errors : null;
}

function denied(t, permissions, operation, resourceId = null) {
  if (holds(permissions, 'Deployment', operation, { resourceId })) return '';
  return t('tips.apps.denied', { operation: enumLabel(t, 'operationType', operation), resource: enumLabel(t, 'resourceType', 'Deployment') });
}

/** The architect prompt manager for one architect, in a dialog. */
function PromptsModal({ architect, architects, permissions, t, onClose }) {
  return (
    <Modal open size="xlarge" onClose={onClose} title={t('resources.architects.promptsTitle', { name: architect.name })}>
      <Suspense fallback={<p className="text-muted">{t('common.generic.loading')}</p>}>
        <ArchitectPromptPanel architect={architect} deployments={architects} denied={studioPermissions(t, permissions)} />
      </Suspense>
    </Modal>
  );
}

/**
 * Agent architects: tenant-wide, reusable deployments of agent-architect that design agents and apps with people in
 * studio drafts. Any draft can use any architect. The form sets the name, harness profile, model, active flag, and
 * architect prompt (optionally pinned to a version); the deployment's other settings stay on the Deployments page. Row
 * actions manage the architect prompts and open the underlying deployment.
 */
export const architectsConfig = {
  id: ID,
  api: {
    list: (c, tenant, p) => c.listArchitects(tenant, p),
    create: (c, tenant, b) => c.createArchitect(tenant, b),
    update: (c, tenant, id, b) => c.updateArchitect(tenant, id, b),
    remove: (c, tenant, id) => c.deleteArchitect(tenant, id)
  },
  defaultSort: 'name',
  defaultSortDir: 'asc',
  loadLookups: async ({ apiClient, tenantId, principal }) => {
    const [profiles, permissions] = await Promise.all([safeList(apiClient.listHarnessProfiles(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })), loadCallerPermissions(apiClient, tenantId, principal)]);
    return { profiles: Object.fromEntries(profiles.map((p) => [p.id, p.name])), permissions };
  },
  loadOptions: async ({ apiClient, tenantId }) => {
    const [profiles, prompts] = await Promise.all([
      safeList(apiClient.listHarnessProfiles(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })),
      safeList(apiClient.listArchitectPrompts(tenantId, { pageNumber: 1, pageSize: 1000 }))
    ]);
    return { profiles, prompts };
  },
  // A new architect starts on the first harness profile and the default architect prompt.
  withOptions: (d, options) => ({
    ...d,
    harnessProfileId: d.harnessProfileId || options.profiles?.[0]?.id || '',
    architectPromptTemplateId: d.architectPromptTemplateId || (options.prompts || []).find((p) => p.isDefault || p.name === DEFAULT_PROMPT)?.id || ''
  }),
  blank: () => blankArchitect(),
  toForm: (r) => architectToForm(r),
  toDuplicate: (r) => ({ ...architectToForm(r), id: undefined, name: `${r.name}-copy` }),
  toBody: (d) => architectToRequest(d),
  validate: (d, t) => architectErrors(d, t),
  deniedReason: (action, row, { t, lookups }) => {
    const operation = { create: 'Create', update: 'Update', delete: 'Delete' }[action];
    return operation ? denied(t, lookups?.permissions, operation, row?.id || null) : '';
  },
  errorFields: (e, t) => {
    if (e?.code === 'NameConflict') return { name: t('resources.architects.errors.nameTaken') };
    if (e?.code === 'InvalidArchitectPrompt') return { architectPromptTemplateId: e.message };
    return null;
  },
  columns: ({ t, i18n, lookups = {} }) => {
    const lng = i18n.language;
    return [
      col(t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col(t, 'harnessProfileId', (r) => <NamedId id={r.harnessProfileId} name={lookups.profiles?.[r.harnessProfileId]} />, { csv: (r) => lookups.profiles?.[r.harnessProfileId] || r.harnessProfileId }),
      col(t, 'model', (r) => r.model || <span className="text-muted" {...tip(t('tips.resources.architects.defaultModel'))}>{t('resources.architects.defaultModel')}</span>, { csv: (r) => r.model || '' }),
      col(
        t,
        'architectPromptTemplateId',
        (r) => (
          <span>
            {architectPromptLabel(t, r)}
            {r.architectPromptTemplateId === 'tpl_builtin_agent_architect' && (
              <>
                {' '}
                <Badge tone="neutral" tip={t('tips.resources.architects.defaultBadge')}>
                  {t('resources.architects.defaultBadge')}
                </Badge>
              </>
            )}
          </span>
        ),
        { csv: (r) => architectPromptLabel(t, r) }
      ),
      col(t, 'active', (r) => <ActiveBadge active={r.active !== false} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(r.active !== false ? 'tips.resources.architects.activeBadge' : 'tips.resources.architects.inactiveBadge')} />),
      col(t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'lastUpdateUtc', (r) => when(r.lastUpdateUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.lastUpdateUtc || '' }),
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' })
    ];
  },
  fields: (d, { t, options = {} }) => {
    const profiles = (options.profiles || []).map((p) => ({ value: p.id, label: p.name }));
    const prompts = (options.prompts || []).map((p) => ({ value: p.id, label: p.isDefault ? t('components.studio.architect.defaultPrompt', { name: p.name }) : p.name }));
    const keep = (list, value, label) => (value && !list.some((o) => o.value === value) ? [...list, { value, label: label || value }] : list);
    return [
      field(t, 'name', 'text', { required: true, placeholder: 'architect' }),
      field(t, 'description', 'textarea', { rows: 2 }),
      field(t, 'harnessProfileId', 'select', { required: true, noneLabel: t('components.studio.architect.chooseProfile'), options: keep(profiles, d?.harnessProfileId) }),
      field(t, 'model', 'text', { placeholder: 'sonnet' }),
      field(t, 'architectPromptTemplateId', 'select', { required: true, options: keep(prompts, d?.architectPromptTemplateId) }),
      field(t, 'architectPromptVersion', 'number', { min: 1 }),
      field(t, 'active', 'checkbox')
    ];
  },
  rowActions: (r, ctx) => {
    const permissions = ctx.lookups?.permissions || null;
    return [
      {
        label: ctx.t('resources.architects.actions.prompts'),
        tip: ctx.t('tips.resources.architects.actions.prompts'),
        onClick: () => ctx.setExtraModal(<PromptsModal architect={r} architects={[r]} permissions={permissions} t={ctx.t} onClose={() => { ctx.setExtraModal(null); ctx.reload(); }} />)
      },
      {
        label: ctx.t('resources.architects.actions.deployment'),
        tip: ctx.t('tips.resources.architects.actions.deployment'),
        onClick: () => ctx.navigate(pathFor('deployments', null, { search: r.name }))
      }
    ];
  }
};
