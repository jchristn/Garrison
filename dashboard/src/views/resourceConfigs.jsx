// Declarative configurations for record pages rendered by ResourceView.
// Field labels come from resources.<id>.fields.<name>; hints from resources.<id>.hints.<name>.

import CopyableId from '../components/CopyableId';
import { Badge, ActiveBadge } from '../components/StatusBadge';
import SecretOnceModal from '../components/SecretOnceModal';
import ValuePromptModal from '../components/ValuePromptModal';
import EffectivePermissionsModal from '../components/EffectivePermissionsModal';
import McpTestModal from '../components/McpTestModal';
import CompilePreviewModal from '../components/CompilePreviewModal';
import { ENUMS, APPROVAL_TIMEOUT } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip, enumTip, optionalText } from '../utils/tips';
import { enumLabel, enumOptions, enumList } from '../utils/enums';
import { AgentRelationDiagram } from '../components/Explainer';
import { tip } from '../components/Tooltip';
import NamedId from '../components/NamedId';
import CloneTemplateModal from '../components/CloneTemplateModal';
import { PROMPT_ROLES, defaultTemplateFor, templatesForRole, profileSecretNeeds } from '../utils/deployments';
import { formatList, formatNumber } from '../i18n/formatters';
import { loadRuntimeLimits } from '../utils/settings';
import UsageQuotaUsageModal from '../components/UsageQuotaUsageModal';
import ApprovalCheckPanel from '../components/ApprovalCheckPanel';
import { approvalFormDefaults, approvalRulesToBody, approvalErrors } from '../utils/approvals';
import { EGRESS_PROTOCOLS, egressErrors, egressRulesToBody, egressRulesToForm, hasEgressRules } from '../utils/egressRules';
import { EXECUTOR_REQUIREMENT_FLAGS, capabilityField, requirementsToForm, POD_RESOURCE_KEYS, POD_RESOURCE_EXAMPLES, podField, podResourceErrors, podResourcesToForm, deploymentToForm, deploymentToBody } from '../utils/podResources';

// Pipeline definitions (P12.9) live in their own module; re-exported so configuration-wide tests cover them.
export { pipelinesConfig } from './pipelineConfigs';
// Triggers (P12.5) and notification endpoints (P12.14) live in their own module too.
export { triggersConfig, notificationEndpointsConfig } from './triggerConfigs';

// ---------------------------------------------------------------- helpers
//
// Every field and column carries a tooltip from tips.resources.<id>.<name> (falling back to
// tips.common.fields.<name>). Sub-fields of list editors use tips.resources.<id>.<parent>Items.<name>.

function field(id, t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${id}.hints.${name}`);
  const out = { name, type, label: t(`resources.${id}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, id, name), ...extra };
  if (Array.isArray(out.fields)) out.fields = out.fields.map((f) => ({ ...f, tip: f.tip || resourceTip(t, id, `${name}Items.${f.name}`) }));
  return out;
}

function section(id, t, name, step) {
  return { name: `section_${name}`, type: 'section', label: t(`resources.${id}.sections.${name}`), tip: resourceTip(t, id, `sections.${name}`), step };
}

function col(id, t, key, render, extra = {}) {
  return { key, label: t(`resources.${id}.columns.${key}`), tip: resourceTip(t, id, key), render, ...extra };
}

const idCol = (id, t) => col(id, t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true });
const nameCol = (id, t) => col(id, t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true });
const createdCol = (id, t, i18n) =>
  col(id, t, 'createdUtc', (r) => <span {...tip(formatDateTime(r.createdUtc, i18n.language))}>{formatRelativeTime(r.createdUtc, i18n.language)}</span>, { sortable: true });
const activeCol = (id, t) =>
  col(id, t, 'active', (r) => <ActiveBadge active={r.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(r.active ? 'tips.badges.active' : 'tips.badges.inactive')} />);
const builtInCol = (id, t) =>
  col(id, t, 'isBuiltIn', (r) =>
    r.isBuiltIn ? <Badge tone="info" tip={t('tips.badges.builtIn')}>{t('common.generic.builtIn')}</Badge> : <Badge tip={t('tips.badges.custom')}>{t('common.generic.custom')}</Badge>
  );
const enumBadge = (t, group, value, tone = 'neutral') => (value ? <Badge tone={tone} tip={enumTip(t, group, value)}>{enumLabel(t, group, value)}</Badge> : '-');
const actionTip = (t, id, name) => t(`tips.resources.${id}.actions.${name}`);

const notBuiltIn = (r) => !r?.isBuiltIn;

function safeList(promise) {
  return promise.then((r) => r.items || []).catch(() => []);
}

/** Wrap API methods that take (tenantId, ...) into the ResourceView api signature. */
function tenantApi(list, create, update, remove) {
  return {
    list: (c, tenant, params) => c[list](tenant, params),
    create: create ? (c, tenant, body) => c[create](tenant, body) : null,
    update: update ? (c, tenant, id, body) => c[update](tenant, id, body) : null,
    remove: remove ? (c, tenant, id) => c[remove](tenant, id) : null
  };
}

/** Names of records a delete affects, shown under the confirmation message. */
function affectedList(names) {
  return (
    <ul className="plain-list confirm-list" data-testid="delete-affected">
      {names.map((n) => (
        <li key={n}>
          <code>{n}</code>
        </li>
      ))}
    </ul>
  );
}

/** Deployments that bind a prompt template, by name (M1-21). */
export async function deploymentsBindingTemplate(apiClient, tenantId, templateId) {
  const list = await safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 }));
  return list.filter((d) => (d.promptBindings || []).some((b) => b.templateId === templateId)).map((d) => d.name);
}

/** Delete confirmation text for a prompt template: bound templates cannot be deleted, so list who binds them. */
export async function templateDeletePreview(t, apiClient, tenantId, template) {
  const names = await deploymentsBindingTemplate(apiClient, tenantId, template.id);
  if (!names.length) return { message: t('resources.promptTemplates.deleteUnbound', { name: template.name }), names };
  return { message: t('resources.promptTemplates.deleteBound', { name: template.name, count: names.length }), details: affectedList(names), names };
}

/** Which secrets the chosen harness profile reads, as one translated sentence or two (M1-04). */
function secretNeedsHint(t, i18n, profile) {
  if (!profile) return t('resources.deployments.hints.resourceBindings');
  const { aliases, kinds } = profileSecretNeeds(profile);
  const lng = i18n?.language;
  if (!aliases.length && !kinds.length) return t('resources.deployments.hints.secretsNone', { profile: profile.name });
  const parts = [];
  if (aliases.length) parts.push(t('resources.deployments.hints.secretsAliases', { profile: profile.name, aliases: formatList(aliases, lng) }));
  if (kinds.length) parts.push(t('resources.deployments.hints.secretsKinds', { profile: profile.name, kinds: formatList(kinds.map((k) => enumLabel(t, 'secretKind', k)), lng, { style: 'long', type: 'disjunction' }) }));
  return parts.join(' ');
}

// ---------------------------------------------------------------- administration

export const tenantsConfig = {
  id: 'tenants',
  explainer: 'tenants',
  api: {
    list: (c, _t, p) => c.listTenants(p),
    create: (c, _t, b) => c.createTenant(b),
    update: (c, _t, id, b) => c.updateTenant(id, b),
    remove: (c, _t, id) => c.deleteTenant(id)
  },
  blank: () => ({ name: '', description: '', active: true, requireUntrustedDeployments: false }),
  columns: ({ t, i18n }) => [
    nameCol('tenants', t),
    idCol('tenants', t),
    col('tenants', t, 'description', (r) => r.description || '-'),
    col('tenants', t, 'requireUntrustedDeployments', (r) => (r.requireUntrustedDeployments ? enumBadge(t, 'trustLevel', 'Untrusted', 'info') : '-'), { csv: (r) => (r.requireUntrustedDeployments ? 'true' : 'false'), defaultHidden: true }),
    activeCol('tenants', t),
    createdCol('tenants', t, i18n)
  ],
  fields: (_d, { t }) => [
    field('tenants', t, 'name', 'text', { required: true }),
    field('tenants', t, 'description', 'textarea'),
    // P11.14: when on, Trusted deployments are rejected on create and update; existing ones keep running until edited.
    field('tenants', t, 'requireUntrustedDeployments', 'checkbox'),
    field('tenants', t, 'active', 'checkbox')
  ],
  validate: (d, t) => (!d.name ? { name: t('common.errors.required') } : null),
  toBody: (d) => ({ name: d.name, description: d.description, active: !!d.active, requireUntrustedDeployments: !!d.requireUntrustedDeployments })
};

export const usersConfig = {
  id: 'users',
  explainer: 'users',
  api: tenantApi('listUsers', 'createUser', 'updateUser', 'deleteUser'),
  blank: () => ({ email: '', password: '', firstName: '', lastName: '', isAdmin: false, isTenantAdmin: false, active: true }),
  toForm: (r) => ({ ...r, password: '' }),
  columns: ({ t, i18n }) => [
    col('users', t, 'email', (r) => <strong>{r.email}</strong>, { pinned: true }),
    col('users', t, 'name', (r) => [r.firstName, r.lastName].filter(Boolean).join(' ') || '-', { csv: (r) => [r.firstName, r.lastName].filter(Boolean).join(' ') }),
    idCol('users', t),
    col('users', t, 'role', (r) => <Badge tone={r.isAdmin || r.isTenantAdmin ? 'info' : 'neutral'} tip={t(r.isAdmin ? 'tips.badges.systemAdmin' : r.isTenantAdmin ? 'tips.badges.tenantAdmin' : 'tips.badges.user')}>{t(r.isAdmin ? 'roles.systemAdmin' : r.isTenantAdmin ? 'roles.tenantAdmin' : 'roles.user')}</Badge>),
    activeCol('users', t),
    createdCol('users', t, i18n)
  ],
  fields: (_d, { t, mode }) => [
    field('users', t, 'email', 'text', { required: true }),
    field('users', t, 'password', 'password', { required: mode === 'create' }),
    field('users', t, 'firstName', 'text'),
    field('users', t, 'lastName', 'text'),
    field('users', t, 'isTenantAdmin', 'checkbox'),
    field('users', t, 'isAdmin', 'checkbox'),
    field('users', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const e = {};
    if (!d.email || !/^\S+@\S+$/.test(d.email)) e.email = t('common.errors.invalidEmail');
    if (!d.id && !d.password) e.password = t('common.errors.required');
    return e;
  },
  toBody: (d) => {
    const body = { email: d.email, firstName: d.firstName, lastName: d.lastName, isAdmin: !!d.isAdmin, isTenantAdmin: !!d.isTenantAdmin, active: !!d.active };
    if (d.password) body.password = d.password;
    return body;
  },
  rowActions: (r, ctx) => [
    {
      label: ctx.t('resources.users.actions.permissions'),
      tip: actionTip(ctx.t, 'users', 'permissions'),
      onClick: () => ctx.setExtraModal(<EffectivePermissionsModal load={() => ctx.apiClient.getUserPermissions(ctx.tenantId, r.id)} title={r.email} onClose={() => ctx.setExtraModal(null)} />)
    }
  ]
};

export const credentialsConfig = {
  id: 'credentials',
  explainer: 'credentials',
  api: tenantApi('listCredentials', 'createCredential', 'updateCredential', 'deleteCredential'),
  loadOptions: async ({ apiClient, tenantId }) => ({ users: await safeList(apiClient.listUsers(tenantId, { pageNumber: 1, pageSize: 1000 })) }),
  loadLookups: async ({ apiClient, tenantId }) => ({ users: Object.fromEntries((await safeList(apiClient.listUsers(tenantId, { pageNumber: 1, pageSize: 1000 }))).map((u) => [u.id, u.email])) }),
  blank: () => ({ name: '', userId: '', authMode: 'Hybrid', expiresUtc: null, active: true }),
  columns: ({ t, i18n, lookups }) => [
    nameCol('credentials', t),
    col('credentials', t, 'accessKey', (r) => <CopyableId value={r.accessKey} max={28} />, { cellClass: 'cell-id' }),
    col('credentials', t, 'secretKeyLast4', (r) => (r.secretKeyLast4 ? <code>****{r.secretKeyLast4}</code> : '-')),
    col('credentials', t, 'userId', (r) => <NamedId id={r.userId} name={lookups?.users?.[r.userId]} />, { defaultHidden: true, csv: (r) => lookups?.users?.[r.userId] || r.userId }),
    col('credentials', t, 'lastUsedUtc', (r) => (r.lastUsedUtc ? formatRelativeTime(r.lastUsedUtc, i18n.language) : t('common.generic.never'))),
    col('credentials', t, 'expiresUtc', (r) => (r.expiresUtc ? formatDateTime(r.expiresUtc, i18n.language) : t('common.generic.never'))),
    activeCol('credentials', t),
    idCol('credentials', t)
  ],
  fields: (_d, { t, options, mode }) => [
    field('credentials', t, 'name', 'text', { required: true }),
    field('credentials', t, 'userId', 'select', {
      required: true,
      readOnly: mode === 'edit',
      options: (options.users || []).map((u) => ({ value: u.id, label: u.email }))
    }),
    field('credentials', t, 'authMode', 'select', { required: true, options: enumOptions(t, 'credentialAuthMode') }),
    field('credentials', t, 'expiresUtc', 'datetime'),
    field('credentials', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (!d.userId) e.userId = t('common.errors.required');
    return e;
  },
  toBody: (d) => ({ name: d.name, userId: d.userId, authMode: d.authMode, expiresUtc: d.expiresUtc || null, active: !!d.active }),
  afterCreate: (result, ctx) => {
    if (result?.secretKey) {
      ctx.setExtraModal(<SecretOnceModal accessKey={result.accessKey || result.credential?.accessKey} secretKey={result.secretKey} onClose={() => ctx.setExtraModal(null)} />);
    }
  },
  rowActions: (r, ctx) => [
    {
      label: ctx.t('resources.credentials.actions.rotate'),
      tip: actionTip(ctx.t, 'credentials', 'rotate'),
      onClick: async () => {
        try {
          const result = await ctx.apiClient.rotateCredential(ctx.tenantId, r.id);
          ctx.setExtraModal(<SecretOnceModal accessKey={result?.accessKey || r.accessKey} secretKey={result?.secretKey} onClose={() => ctx.setExtraModal(null)} />);
          ctx.reload();
        } catch (e) {
          ctx.addToast({ type: 'error', message: errorMessage(ctx.t, e) });
        }
      }
    },
    {
      label: ctx.t('resources.users.actions.permissions'),
      tip: actionTip(ctx.t, 'credentials', 'permissions'),
      onClick: () => ctx.setExtraModal(<EffectivePermissionsModal load={() => ctx.apiClient.getCredentialPermissions(ctx.tenantId, r.id)} title={r.name} onClose={() => ctx.setExtraModal(null)} />)
    }
  ]
};

export const rolesConfig = {
  id: 'roles',
  explainer: 'roles',
  api: tenantApi('listRoles', 'createRole', 'updateRole', 'deleteRole'),
  isEditable: notBuiltIn,
  blank: () => ({ name: '', description: '', active: true }),
  columns: ({ t, i18n }) => [nameCol('roles', t), col('roles', t, 'description', (r) => r.description || '-'), builtInCol('roles', t), activeCol('roles', t), idCol('roles', t), createdCol('roles', t, i18n)],
  fields: (_d, { t }) => [field('roles', t, 'name', 'text', { required: true }), field('roles', t, 'description', 'textarea'), field('roles', t, 'active', 'checkbox')],
  validate: (d, t) => (!d.name ? { name: t('common.errors.required') } : null),
  toBody: (d) => ({ name: d.name, description: d.description, active: !!d.active }),
  rowActions: (r, ctx) => [
    {
      label: ctx.t('common.actions.clone'),
      tip: actionTip(ctx.t, 'roles', 'clone'),
      hidden: !r.isBuiltIn,
      onClick: async () => {
        try {
          await ctx.apiClient.cloneRole(ctx.tenantId, r.id, { name: `${r.name}-custom` });
          ctx.addToast({ type: 'success', message: ctx.t('common.toasts.cloned') });
          ctx.reload();
        } catch (e) {
          ctx.addToast({ type: 'error', message: errorMessage(ctx.t, e) });
        }
      }
    }
  ]
};

export const permissionsConfig = {
  id: 'permissions',
  explainer: 'roles',
  api: tenantApi('listPermissions', 'createPermission', 'updatePermission', 'deletePermission'),
  isEditable: notBuiltIn,
  blank: () => ({ name: '', permissionType: 'Permit', resourceTypes: [], operationTypes: [], active: true }),
  columns: ({ t }) => [
    nameCol('permissions', t),
    col('permissions', t, 'permissionType', (r) => enumBadge(t, 'permissionType', r.permissionType, r.permissionType === 'Deny' ? 'danger' : 'success')),
    col('permissions', t, 'resourceTypes', (r) => enumList(t, 'resourceType', r.resourceTypes) || '-', { csv: (r) => (r.resourceTypes || []).join(' ') }),
    col('permissions', t, 'operationTypes', (r) => enumList(t, 'operationType', r.operationTypes) || '-', { csv: (r) => (r.operationTypes || []).join(' ') }),
    builtInCol('permissions', t),
    idCol('permissions', t)
  ],
  fields: (_d, { t }) => [
    field('permissions', t, 'name', 'text', { required: true }),
    field('permissions', t, 'permissionType', 'select', { required: true, options: enumOptions(t, 'permissionType') }),
    field('permissions', t, 'resourceTypes', 'multiselect', { options: enumOptions(t, 'resourceType') }),
    field('permissions', t, 'operationTypes', 'multiselect', { options: enumOptions(t, 'operationType') }),
    field('permissions', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (!d.resourceTypes?.length) e.resourceTypes = t('common.errors.chooseOne');
    if (!d.operationTypes?.length) e.operationTypes = t('common.errors.chooseOne');
    return e;
  }
};

function assignmentConfig(id, principalKey, api, loadPrincipals, principalLabel) {
  return {
    id,
    explainer: 'assignments',
    api,
    loadOptions: async (ctx) => ({
      principals: await loadPrincipals(ctx),
      roles: await safeList(ctx.apiClient.listRoles(ctx.tenantId, { pageNumber: 1, pageSize: 1000 }))
    }),
    // Show who holds the role by name, with the ID on hover (M1-20).
    loadLookups: async (ctx) => ({ principals: Object.fromEntries((await loadPrincipals(ctx)).map((p) => [p.id, principalLabel(p)])) }),
    blank: () => ({ [principalKey]: '', roleId: '', resourceScope: 'Tenant', resourceId: '', inheritsToChildren: true, active: true }),
    columns: ({ t, i18n, lookups }) => [
      col(id, t, principalKey, (r) => <NamedId id={r[principalKey]} name={lookups?.principals?.[r[principalKey]]} />, { pinned: true, csv: (r) => lookups?.principals?.[r[principalKey]] || r[principalKey] }),
      col(id, t, 'roleName', (r) => <Badge tone="info" tip={t('tips.badges.role', { role: r.roleName || r.roleId || '-' })}>{r.roleName || r.roleId || '-'}</Badge>),
      col(id, t, 'resourceScope', (r) => enumLabel(t, 'resourceScope', r.resourceScope)),
      col(id, t, 'resourceId', (r) => (r.resourceId ? <CopyableId value={r.resourceId} /> : '-')),
      activeCol(id, t),
      createdCol(id, t, i18n),
      idCol(id, t)
    ],
    fields: (d, { t, options }) => [
      field(id, t, principalKey, 'select', { required: true, options: (options.principals || []).map((p) => ({ value: p.id, label: principalLabel(p) })) }),
      field(id, t, 'roleId', 'select', { required: true, options: (options.roles || []).map((r) => ({ value: r.id, label: r.name })) }),
      field(id, t, 'resourceScope', 'select', { required: true, options: enumOptions(t, 'resourceScope') }),
      field(id, t, 'resourceId', 'text', { showIf: (x) => x.resourceScope === 'Resource' }),
      field(id, t, 'inheritsToChildren', 'checkbox', { showIf: (x) => x.resourceScope === 'Tenant' }),
      field(id, t, 'active', 'checkbox')
    ],
    validate: (d, t) => {
      const e = {};
      if (!d[principalKey]) e[principalKey] = t('common.errors.required');
      if (!d.roleId) e.roleId = t('common.errors.required');
      if (d.resourceScope === 'Resource' && !d.resourceId) e.resourceId = t('common.errors.required');
      return e;
    }
  };
}

export const userAssignmentsConfig = assignmentConfig(
  'userAssignments',
  'userId',
  tenantApi('listUserRoleAssignments', 'createUserRoleAssignment', 'updateUserRoleAssignment', 'deleteUserRoleAssignment'),
  (ctx) => safeList(ctx.apiClient.listUsers(ctx.tenantId, { pageNumber: 1, pageSize: 1000 })),
  (u) => u.email
);

export const credentialAssignmentsConfig = assignmentConfig(
  'credentialAssignments',
  'credentialId',
  tenantApi('listCredentialScopeAssignments', 'createCredentialScopeAssignment', 'updateCredentialScopeAssignment', 'deleteCredentialScopeAssignment'),
  (ctx) => safeList(ctx.apiClient.listCredentials(ctx.tenantId, { pageNumber: 1, pageSize: 1000 })),
  (c) => `${c.name} (${c.accessKey || c.id})`
);

// ---------------------------------------------------------------- configuration

export const harnessProfilesConfig = {
  id: 'harnessProfiles',
  explainer: 'harnessProfiles',
  api: tenantApi('listHarnessProfiles', 'createHarnessProfile', 'updateHarnessProfile', 'deleteHarnessProfile'),
  isEditable: notBuiltIn,
  filters: [{ name: 'harnessType', label: (t) => t('resources.harnessProfiles.fields.harnessType'), options: ENUMS.harnessType, enumGroup: 'harnessType' }],
  steps: ['basics', 'invocation', 'output', 'limits'],
  blank: () => ({
    name: '',
    description: '',
    harnessType: 'Generic',
    executable: '',
    promptDelivery: 'Stdin',
    systemPromptDelivery: 'File',
    mcpConfigFormat: 'None',
    outputParser: 'PlainText',
    resultSource: 'ParserFinalEvent',
    successPolicy: 'FinalEvent',
    defaultTimeoutSeconds: 1800,
    killGraceSeconds: 5,
    maxOutputBytes: 67108864,
    stderrTailBytes: 8000,
    isolateHome: true,
    supportsResume: false,
    arguments: [],
    environment: [],
    files: [],
    successExitCodes: [0],
    probeArguments: ['--version'],
    credentialEnvironmentAllowlist: [],
    active: true
  }),
  columns: ({ t, i18n }) => [
    nameCol('harnessProfiles', t),
    col('harnessProfiles', t, 'harnessType', (r) => enumBadge(t, 'harnessType', r.harnessType, 'info')),
    col('harnessProfiles', t, 'executable', (r) => <code>{r.executable}</code>),
    col('harnessProfiles', t, 'outputParser', (r) => enumLabel(t, 'outputParser', r.outputParser), { csv: (r) => r.outputParser }),
    builtInCol('harnessProfiles', t),
    idCol('harnessProfiles', t),
    createdCol('harnessProfiles', t, i18n)
  ],
  fields: (d, { t }) => {
    const id = 'harnessProfiles';
    return [
      field(id, t, 'name', 'text', { required: true, step: 0 }),
      field(id, t, 'description', 'textarea', { step: 0 }),
      field(id, t, 'harnessType', 'select', { required: true, options: enumOptions(t, 'harnessType'), step: 0 }),
      field(id, t, 'executable', 'text', { required: true, step: 0 }),
      field(id, t, 'probeArguments', 'stringList', { step: 0 }),
      field(id, t, 'active', 'checkbox', { step: 0 }),
      field(id, t, 'arguments', 'objectList', {
        step: 1,
        ordered: true,
        fields: [
          { name: 'template', type: 'text', label: t('resources.harnessProfiles.fields.argTemplate'), required: true },
          { name: 'condition', type: 'text', label: t('resources.harnessProfiles.fields.argCondition') },
          { name: 'repeatOver', type: 'text', label: t('resources.harnessProfiles.fields.argRepeatOver') }
        ]
      }),
      field(id, t, 'promptDelivery', 'select', { required: true, options: enumOptions(t, 'promptDelivery'), step: 1 }),
      field(id, t, 'promptArgumentTemplate', 'text', { step: 1, showIf: (x) => x.promptDelivery !== 'Stdin' && x.promptDelivery !== 'CodexAppServer' }),
      field(id, t, 'systemPromptDelivery', 'select', { required: true, options: enumOptions(t, 'systemPromptDelivery'), step: 1 }),
      field(id, t, 'systemPromptTarget', 'text', { step: 1, showIf: (x) => x.systemPromptDelivery !== 'None' && x.systemPromptDelivery !== 'PrependToPrompt' }),
      field(id, t, 'mcpConfigFormat', 'select', { required: true, options: enumOptions(t, 'mcpConfigFormat'), step: 1 }),
      field(id, t, 'mcpConfigFileName', 'text', { step: 1, showIf: (x) => x.mcpConfigFormat && x.mcpConfigFormat !== 'None' }),
      field(id, t, 'environment', 'objectList', {
        step: 1,
        fields: [
          { name: 'name', type: 'text', label: t('resources.harnessProfiles.fields.envName'), required: true },
          { name: 'valueTemplate', type: 'text', label: t('resources.harnessProfiles.fields.envValue') },
          { name: 'condition', type: 'text', label: t('resources.harnessProfiles.fields.argCondition') },
          { name: 'isSecret', type: 'checkbox', label: t('resources.harnessProfiles.fields.isSecret') }
        ]
      }),
      field(id, t, 'files', 'objectList', {
        step: 1,
        fields: [
          { name: 'baseDirectory', type: 'select', label: t('resources.harnessProfiles.fields.fileBase'), options: enumOptions(t, 'fileBaseDirectory'), required: true },
          { name: 'pathTemplate', type: 'text', label: t('resources.harnessProfiles.fields.filePath'), required: true },
          { name: 'contentTemplate', type: 'code', rows: 5, label: t('resources.harnessProfiles.fields.fileContent') },
          { name: 'condition', type: 'text', label: t('resources.harnessProfiles.fields.argCondition') },
          { name: 'mode', type: 'text', label: t('resources.harnessProfiles.fields.fileMode') },
          { name: 'isSecret', type: 'checkbox', label: t('resources.harnessProfiles.fields.isSecret') }
        ]
      }),
      field(id, t, 'credentialEnvironmentAllowlist', 'stringList', { step: 1 }),
      field(id, t, 'outputParser', 'select', { required: true, options: enumOptions(t, 'outputParser'), step: 2 }),
      field(id, t, 'genericTextField', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'genericFinalField', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'genericSuccessField', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'genericSuccessValue', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'resultSource', 'select', { required: true, options: enumOptions(t, 'resultSource'), step: 2 }),
      field(id, t, 'resultFileName', 'text', { step: 2, showIf: (x) => x.resultSource === 'LastMessageFile' }),
      field(id, t, 'successPolicy', 'select', { required: true, options: enumOptions(t, 'successPolicy'), step: 2 }),
      field(id, t, 'successExitCodes', 'stringList', { step: 2 }),
      field(id, t, 'defaultTimeoutSeconds', 'number', { min: 5, max: 86400, step: 3 }),
      field(id, t, 'killGraceSeconds', 'number', { min: 0, max: 60, step: 3 }),
      field(id, t, 'maxOutputBytes', 'number', { min: 1024, max: 1073741824, step: 3 }),
      field(id, t, 'stderrTailBytes', 'number', { min: 0, max: 1048576, step: 3 }),
      field(id, t, 'isolateHome', 'checkbox', { step: 3 }),
      field(id, t, 'supportsResume', 'checkbox', { step: 3 })
    ];
  },
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (!d.executable) e.executable = t('common.errors.required');
    if (d.name && d.name.startsWith('builtin/')) e.name = t('resources.harnessProfiles.errors.reservedPrefix');
    return e;
  },
  toBody: (d) => ({ ...d, successExitCodes: (d.successExitCodes || []).map((x) => Number(x)).filter((x) => !Number.isNaN(x)) }),
  rowActions: (r, ctx) => [
    {
      label: ctx.t('common.actions.clone'),
      tip: actionTip(ctx.t, 'harnessProfiles', 'clone'),
      onClick: async () => {
        try {
          await ctx.apiClient.cloneHarnessProfile(ctx.tenantId, r.id, { name: `${r.name.replace(/^builtin\//, '')}-custom` });
          ctx.addToast({ type: 'success', message: ctx.t('common.toasts.cloned') });
          ctx.reload();
        } catch (e) {
          ctx.addToast({ type: 'error', message: errorMessage(ctx.t, e) });
        }
      }
    }
  ]
};

export const mcpServersConfig = {
  id: 'mcpServers',
  explainer: 'mcpServers',
  api: tenantApi('listMcpServers', 'createMcpServer', 'updateMcpServer', 'deleteMcpServer'),
  blank: () => ({ name: '', description: '', transport: 'Http', url: '', path: '/mcp', command: '', arguments: [], environment: [], headers: [], requiredTools: [], toolTimeoutSeconds: 600, required: true, active: true }),
  columns: ({ t, i18n }) => [
    nameCol('mcpServers', t),
    col('mcpServers', t, 'transport', (r) => enumBadge(t, 'mcpTransport', r.transport)),
    col('mcpServers', t, 'endpoint', (r) => <code>{r.transport === 'Stdio' ? r.command : `${r.url || ''}${r.path || ''}`}</code>, { csv: (r) => (r.transport === 'Stdio' ? r.command : `${r.url || ''}${r.path || ''}`) }),
    col('mcpServers', t, 'required', (r) => (r.required ? t('common.boolean.yes') : t('common.boolean.no'))),
    activeCol('mcpServers', t),
    idCol('mcpServers', t),
    createdCol('mcpServers', t, i18n)
  ],
  fields: (_d, { t }) => {
    const id = 'mcpServers';
    const header = [
      { name: 'name', type: 'text', label: t('resources.mcpServers.fields.headerName'), required: true },
      { name: 'valueTemplate', type: 'text', label: t('resources.mcpServers.fields.headerValue') }
    ];
    return [
      field(id, t, 'name', 'text', { required: true }),
      field(id, t, 'transport', 'select', { required: true, options: enumOptions(t, 'mcpTransport') }),
      field(id, t, 'description', 'textarea'),
      field(id, t, 'url', 'text', { showIf: (x) => x.transport !== 'Stdio' }),
      field(id, t, 'path', 'text', { showIf: (x) => x.transport !== 'Stdio' }),
      field(id, t, 'headers', 'objectList', { fields: header, showIf: (x) => x.transport !== 'Stdio' }),
      field(id, t, 'command', 'text', { showIf: (x) => x.transport === 'Stdio' }),
      field(id, t, 'arguments', 'stringList', { showIf: (x) => x.transport === 'Stdio' }),
      field(id, t, 'environment', 'objectList', { fields: header, showIf: (x) => x.transport === 'Stdio' }),
      field(id, t, 'requiredTools', 'stringList'),
      field(id, t, 'toolTimeoutSeconds', 'number', { min: 1, max: 3600 }),
      field(id, t, 'required', 'checkbox'),
      field(id, t, 'active', 'checkbox')
    ];
  },
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (d.transport !== 'Stdio' && !d.url) e.url = t('common.errors.required');
    if (d.transport === 'Stdio' && !d.command) e.command = t('common.errors.required');
    return e;
  },
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.mcpServers.actions.test'), tip: actionTip(ctx.t, 'mcpServers', 'test'), onClick: () => ctx.setExtraModal(<McpTestModal load={(nodeId) => ctx.apiClient.testMcpServer(ctx.tenantId, r.id, nodeId)} loadNodes={r.transport === 'Stdio' ? () => ctx.apiClient.listNodes({ pageSize: 1000 }) : null} name={r.name} onClose={() => ctx.setExtraModal(null)} />) }
  ]
};

/**
 * Credential state of a secret in its view and edit forms (G-22): a warning when the stored login needs
 * reauthentication, and for Codex logins when Garrison last refreshed it and when its access token expires.
 */
function secretCredentialNotice(r, t, i18n) {
  if (!r) return null;
  const parts = [];
  if (r.status === 'NeedsReauthentication') {
    parts.push(
      <div key="reauth" className="warning-banner" role="alert" data-testid="secret-reauth-warning" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <strong {...tip(enumTip(t, 'secretStatus', 'NeedsReauthentication'))}>{t('resources.secrets.reauth.title')}</strong>
        {r.statusMessage && <span {...tip(resourceTip(t, 'secrets', 'statusMessage'))}>{r.statusMessage}</span>}
        {r.statusUtc && <span className="text-muted" {...tip(resourceTip(t, 'secrets', 'statusUtc'))}>{t('resources.secrets.reauth.since', { time: formatDateTime(r.statusUtc, i18n.language) })}</span>}
        <span>{t('resources.secrets.reauth.action')}</span>
      </div>
    );
  }
  if (r.kind === 'CodexAuthJson' && (r.refreshedUtc || r.accessTokenExpiresUtc)) {
    parts.push(
      <div key="codex" className="info-banner" data-testid="secret-codex-login">
        <span {...tip(resourceTip(t, 'secrets', 'refreshedUtc'))}>
          {t('resources.secrets.fields.refreshedUtc')}: {r.refreshedUtc ? formatDateTime(r.refreshedUtc, i18n.language) : t('resources.secrets.neverRefreshed')}
        </span>
        {r.accessTokenExpiresUtc && (
          <span {...tip(resourceTip(t, 'secrets', 'accessTokenExpiresUtc'))}>
            {t('resources.secrets.fields.accessTokenExpiresUtc')}: {formatDateTime(r.accessTokenExpiresUtc, i18n.language)}
          </span>
        )}
      </div>
    );
  }
  return parts.length ? <>{parts}</> : null;
}

export const secretsConfig = {
  id: 'secrets',
  explainer: 'secrets',
  api: tenantApi('listSecrets', 'createSecret', 'updateSecret', 'deleteSecret'),
  filters: [{ name: 'kind', label: (t) => t('resources.secrets.fields.kind'), options: ENUMS.secretKind, enumGroup: 'secretKind' }],
  blank: () => ({ name: '', description: '', kind: 'GenericEnv', value: '', expiresUtc: null, active: true }),
  toForm: (r) => ({ ...r, value: '' }),
  columns: ({ t, i18n }) => [
    nameCol('secrets', t),
    col('secrets', t, 'kind', (r) => enumBadge(t, 'secretKind', r.kind, 'info')),
    col('secrets', t, 'status', (r) => enumBadge(t, 'secretStatus', r.status || 'Ok', r.status === 'NeedsReauthentication' ? 'danger' : 'success')),
    col('secrets', t, 'valueLast4', (r) => (r.valueLast4 ? <code>****{r.valueLast4}</code> : <span className="text-muted">{t('resources.secrets.notSet')}</span>)),
    col('secrets', t, 'rotatedUtc', (r) => (r.rotatedUtc ? formatRelativeTime(r.rotatedUtc, i18n.language) : '-')),
    col('secrets', t, 'expiresUtc', (r) => (r.expiresUtc ? formatDateTime(r.expiresUtc, i18n.language) : t('common.generic.never'))),
    col('secrets', t, 'accessTokenExpiresUtc', (r) => (r.accessTokenExpiresUtc ? formatDateTime(r.accessTokenExpiresUtc, i18n.language) : '-'), { defaultHidden: true }),
    activeCol('secrets', t),
    idCol('secrets', t)
  ],
  fields: (_d, { t, mode }) => [
    field('secrets', t, 'name', 'text', { required: true }),
    field('secrets', t, 'kind', 'select', { required: true, options: enumOptions(t, 'secretKind') }),
    field('secrets', t, 'description', 'textarea'),
    field('secrets', t, 'value', 'password', { required: mode === 'create', showIf: () => mode === 'create' }),
    field('secrets', t, 'expiresUtc', 'datetime', { futureOnly: true }),
    field('secrets', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (!d.id && !d.value) e.value = t('common.errors.required');
    // The server rejects an expiry in the past with 400 (M1-27); say so before saving.
    if (d.expiresUtc && new Date(d.expiresUtc).getTime() <= Date.now()) e.expiresUtc = t('resources.secrets.errors.expiryPast');
    return e;
  },
  toBody: (d, mode) => {
    const body = { name: d.name, description: d.description, kind: d.kind, expiresUtc: d.expiresUtc || null, active: !!d.active };
    if (mode !== 'edit' && d.value) body.value = d.value;
    return body;
  },
  canDuplicate: false,
  formNotice: (r, { t, i18n }) => secretCredentialNotice(r, t, i18n),
  rowActions: (r, ctx) => [
    {
      label: ctx.t('resources.secrets.actions.setValue'),
      tip: actionTip(ctx.t, 'secrets', 'setValue'),
      onClick: () =>
        ctx.setExtraModal(
          <ValuePromptModal
            title={ctx.t('resources.secrets.actions.setValue')}
            label={ctx.t('resources.secrets.fields.value')}
            tip={resourceTip(ctx.t, 'secrets', 'value')}
            saveTip={ctx.t('tips.resources.secrets.saveValue')}
            secret
            onSubmit={async (value) => {
              await ctx.apiClient.setSecretValue(ctx.tenantId, r.id, value);
              ctx.addToast({ type: 'success', message: ctx.t('common.toasts.saved') });
              ctx.reload();
            }}
            onClose={() => ctx.setExtraModal(null)}
          />
        )
    },
    {
      label: ctx.t('resources.secrets.actions.rotate'),
      tip: actionTip(ctx.t, 'secrets', 'rotate'),
      onClick: () =>
        ctx.setExtraModal(
          <ValuePromptModal
            title={ctx.t('resources.secrets.actions.rotate')}
            label={ctx.t('resources.secrets.fields.newValue')}
            tip={resourceTip(ctx.t, 'secrets', 'newValue')}
            saveTip={ctx.t('tips.resources.secrets.saveValue')}
            secret
            onSubmit={async (value) => {
              await ctx.apiClient.rotateSecret(ctx.tenantId, r.id, value);
              ctx.addToast({ type: 'success', message: ctx.t('common.toasts.saved') });
              ctx.reload();
            }}
            onClose={() => ctx.setExtraModal(null)}
          />
        )
    }
  ]
};

export const workspacesConfig = {
  id: 'workspaces',
  explainer: 'workspaces',
  api: tenantApi('listWorkspaceTemplates', 'createWorkspaceTemplate', 'updateWorkspaceTemplate', 'deleteWorkspaceTemplate'),
  loadOptions: async ({ apiClient, tenantId }) => ({ secrets: await safeList(apiClient.listSecrets(tenantId, { pageNumber: 1, pageSize: 1000 })) }),
  blank: () => ({ name: '', description: '', kind: 'Empty', gitUrl: '', gitRef: '', gitDepth: 1, gitCredentialSecretId: null, persistentVolumeClaim: '', retention: 'Delete', files: [], active: true }),
  columns: ({ t, i18n }) => [
    nameCol('workspaces', t),
    col('workspaces', t, 'kind', (r) => enumBadge(t, 'workspaceKind', r.kind)),
    col('workspaces', t, 'gitUrl', (r) => (r.gitUrl ? <code>{r.gitUrl}</code> : '-')),
    col('workspaces', t, 'retention', (r) => enumLabel(t, 'workspaceRetention', r.retention)),
    activeCol('workspaces', t),
    idCol('workspaces', t),
    createdCol('workspaces', t, i18n)
  ],
  fields: (_d, { t, options }) => [
    field('workspaces', t, 'name', 'text', { required: true }),
    field('workspaces', t, 'kind', 'select', { required: true, options: enumOptions(t, 'workspaceKind') }),
    field('workspaces', t, 'description', 'textarea'),
    field('workspaces', t, 'gitUrl', 'text', { showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'gitRef', 'text', { showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'gitDepth', 'number', { min: 0, max: 10000, showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'gitCredentialSecretId', 'select', { options: (options.secrets || []).map((s) => ({ value: s.id, label: s.name })), showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'persistentVolumeClaim', 'text', { required: true, placeholder: 'shared-repo', showIf: (x) => x.kind === 'PersistentVolume' }),
    field('workspaces', t, 'files', 'objectList', {
      showIf: (x) => x.kind === 'Seeded',
      fields: [
        { name: 'path', type: 'text', label: t('resources.workspaces.fields.filePath'), required: true },
        { name: 'content', type: 'code', rows: 5, label: t('resources.workspaces.fields.fileContent') }
      ]
    }),
    field('workspaces', t, 'retention', 'select', { required: true, options: enumOptions(t, 'workspaceRetention') }),
    field('workspaces', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (d.kind === 'GitRepository' && !d.gitUrl) e.gitUrl = t('common.errors.required');
    if (d.kind === 'PersistentVolume') {
      if (!d.persistentVolumeClaim) e.persistentVolumeClaim = t('common.errors.required');
      else if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(d.persistentVolumeClaim)) e.persistentVolumeClaim = t('resources.workspaces.errors.claimName');
    }
    return e;
  }
};

export const artifactStoresConfig = {
  id: 'artifactStores',
  explainer: 'artifactStores',
  api: tenantApi('listArtifactStores', 'createArtifactStore', 'updateArtifactStore', 'deleteArtifactStore'),
  loadOptions: async ({ apiClient, tenantId }) => ({ secrets: await safeList(apiClient.listSecrets(tenantId, { pageNumber: 1, pageSize: 1000 })) }),
  blank: () => ({ name: '', description: '', kind: 'Database', pathPrefix: '', bucket: '', endpoint: '', region: 'us-east-1', secretId: null, forcePathStyle: true, active: true }),
  columns: ({ t, i18n }) => [nameCol('artifactStores', t), col('artifactStores', t, 'kind', (r) => enumBadge(t, 'artifactStoreKind', r.kind)), col('artifactStores', t, 'description', (r) => r.description || '-'), activeCol('artifactStores', t), idCol('artifactStores', t), createdCol('artifactStores', t, i18n)],
  fields: (_d, { t, options }) => [
    field('artifactStores', t, 'name', 'text', { required: true }),
    field('artifactStores', t, 'kind', 'select', { required: true, options: enumOptions(t, 'artifactStoreKind') }),
    field('artifactStores', t, 'description', 'textarea'),
    field('artifactStores', t, 'pathPrefix', 'text', { showIf: (d) => d.kind !== 'Database' }),
    field('artifactStores', t, 'bucket', 'text', { required: true, showIf: (d) => d.kind === 'S3' }),
    field('artifactStores', t, 'endpoint', 'text', { placeholder: 'http://127.0.0.1:8000', showIf: (d) => d.kind === 'S3' }),
    field('artifactStores', t, 'region', 'text', { required: true, showIf: (d) => d.kind === 'S3' }),
    field('artifactStores', t, 'secretId', 'select', { options: (options.secrets || []).filter((s) => s.kind === 'GenericEnv').map((s) => ({ value: s.id, label: s.name })), showIf: (d) => d.kind === 'S3' }),
    field('artifactStores', t, 'forcePathStyle', 'checkbox', { showIf: (d) => d.kind === 'S3' }),
    field('artifactStores', t, 'active', 'checkbox')
  ],
  validate: (d, t) => (!d.name ? { name: t('common.errors.required') } : null)
};

export const modelPricesConfig = {
  id: 'modelPrices',
  explainer: 'modelPrices',
  api: tenantApi('listModelPrices', 'createModelPrice', 'updateModelPrice', 'deleteModelPrice'),
  blank: () => ({ name: '', description: '', model: '', harnessType: 'Generic', inputUsdPerMillion: 0, outputUsdPerMillion: 0, cachedInputUsdPerMillion: null, reasoningUsdPerMillion: null, inputIncludesCachedTokens: true, outputIncludesReasoningTokens: true, active: true }),
  columns: ({ t, i18n }) => [nameCol('modelPrices', t), col('modelPrices', t, 'model', (r) => r.model), col('modelPrices', t, 'harnessType', (r) => enumBadge(t, 'harnessType', r.harnessType)),
    ...['inputUsdPerMillion', 'outputUsdPerMillion'].map((key) => col('modelPrices', t, key, (r) => formatNumber(r[key], i18n.language, { maximumFractionDigits: 8 }))), activeCol('modelPrices', t), idCol('modelPrices', t), createdCol('modelPrices', t, i18n)],
  fields: (_d, { t }) => [
    field('modelPrices', t, 'name', 'text', { required: true }),
    field('modelPrices', t, 'model', 'text', { required: true }),
    field('modelPrices', t, 'harnessType', 'select', { required: true, span: 'full', options: enumOptions(t, 'harnessType') }),
    ...['inputUsdPerMillion', 'outputUsdPerMillion', 'cachedInputUsdPerMillion', 'reasoningUsdPerMillion'].map((key) => field('modelPrices', t, key, 'number', { min: 0, max: 1000000000, step: 'any', required: key === 'inputUsdPerMillion' || key === 'outputUsdPerMillion' })),
    field('modelPrices', t, 'inputIncludesCachedTokens', 'checkbox', { span: 'full' }),
    field('modelPrices', t, 'outputIncludesReasoningTokens', 'checkbox', { span: 'full' }),
    field('modelPrices', t, 'description', 'textarea'),
    field('modelPrices', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const errors = {};
    if (!d.name?.trim()) errors.name = t('common.errors.required');
    if (!d.model?.trim() || d.model.trim().length > 256 || [...d.model].some((c) => c.charCodeAt(0) < 32 || (c.charCodeAt(0) >= 127 && c.charCodeAt(0) <= 159))) errors.model = t('resources.modelPrices.errors.model');
    for (const key of ['inputUsdPerMillion', 'outputUsdPerMillion', 'cachedInputUsdPerMillion', 'reasoningUsdPerMillion']) {
      const optional = key === 'cachedInputUsdPerMillion' || key === 'reasoningUsdPerMillion';
      if (optional && (d[key] === null || d[key] === undefined || d[key] === '')) continue;
      if (d[key] === null || d[key] === undefined || d[key] === '' || !Number.isFinite(Number(d[key])) || Number(d[key]) < 0 || Number(d[key]) > 1000000000) errors[key] = t('resources.modelPrices.errors.rate');
    }
    return errors;
  },
  toBody: (d) => ({ ...d, model: d.model.trim(), ...Object.fromEntries(['inputUsdPerMillion', 'outputUsdPerMillion', 'cachedInputUsdPerMillion', 'reasoningUsdPerMillion'].map((key) => [key, d[key] === '' || d[key] === null || d[key] === undefined ? null : Number(d[key])])) })
};

export const usageQuotasConfig = {
  id: 'usageQuotas',
  explainer: 'usageQuotas',
  api: tenantApi('listUsageQuotas', 'createUsageQuota', 'updateUsageQuota', 'deleteUsageQuota'),
  canManage: ({ principal }) => !!(principal?.isAdmin || principal?.isTenantAdmin),
  blank: () => ({ name: '', description: '', scope: 'Tenant', resourceId: '', dailyRunLimit: null, dailyTokenLimit: null, dailyCostUsdLimit: null, maxConcurrentRuns: null, enforcementEnabled: false, active: true }),
  loadOptions: async ({ apiClient, tenantId }) => ({ agents: await safeList(apiClient.listAgents(tenantId, { pageSize: 1000 })), deployments: await safeList(apiClient.listDeployments(tenantId, { pageSize: 1000 })) }),
  columns: ({ t, i18n }) => [nameCol('usageQuotas', t), col('usageQuotas', t, 'enforcementEnabled', (r) => t(r.enforcementEnabled ? 'common.boolean.yes' : 'common.boolean.no')), col('usageQuotas', t, 'scope', (r) => enumBadge(t, 'usageQuotaScope', r.scope)), col('usageQuotas', t, 'resourceId', (r) => <CopyableId value={r.resourceId} />),
    ...['dailyRunLimit', 'dailyTokenLimit', 'dailyCostUsdLimit', 'maxConcurrentRuns'].map((key) => col('usageQuotas', t, key, (r) => r[key] == null ? t('common.generic.none') : formatNumber(r[key], i18n.language, { maximumFractionDigits: 6 }))), activeCol('usageQuotas', t), idCol('usageQuotas', t), createdCol('usageQuotas', t, i18n)],
  fields: (d, { t, options = {} }) => [
    field('usageQuotas', t, 'name', 'text', { required: true }),
    field('usageQuotas', t, 'scope', 'select', { required: true, options: enumOptions(t, 'usageQuotaScope') }),
    field('usageQuotas', t, 'resourceId', d.scope === 'Tenant' ? 'text' : 'select', { required: d.scope !== 'Tenant', readOnly: d.scope === 'Tenant', span: 'full', options: (d.scope === 'Agent' ? options.agents : options.deployments)?.map((r) => ({ value: r.id, label: `${r.name} (${r.id})` })) || [] }),
    ...['dailyRunLimit', 'dailyTokenLimit', 'dailyCostUsdLimit', 'maxConcurrentRuns'].map((key) => field('usageQuotas', t, key, 'number', { min: 0, max: key === 'dailyCostUsdLimit' ? 1000000000000 : key === 'maxConcurrentRuns' ? 2147483647 : Number.MAX_SAFE_INTEGER, step: key === 'dailyCostUsdLimit' ? 'any' : 1 })),
    field('usageQuotas', t, 'enforcementEnabled', 'checkbox'),
    field('usageQuotas', t, 'description', 'textarea'),
    field('usageQuotas', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const errors = {};
    if (!d.name?.trim()) errors.name = t('common.errors.required');
    if (d.scope !== 'Tenant' && !d.resourceId) errors.resourceId = t('common.errors.required');
    for (const key of ['dailyRunLimit', 'dailyTokenLimit', 'dailyCostUsdLimit', 'maxConcurrentRuns']) {
      if (d[key] == null || d[key] === '') continue;
      const value = Number(d[key]);
      const max = key === 'dailyCostUsdLimit' ? 1000000000000 : key === 'maxConcurrentRuns' ? 2147483647 : Number.MAX_SAFE_INTEGER;
      if (!Number.isFinite(value) || value < 0 || value > max || (key !== 'dailyCostUsdLimit' && !Number.isInteger(value))) errors[key] = t('resources.usageQuotas.errors.limit');
    }
    return errors;
  },
  toBody: (d) => ({ ...d, resourceId: d.scope === 'Tenant' ? d.tenantId || '' : d.resourceId, ...Object.fromEntries(['dailyRunLimit', 'dailyTokenLimit', 'dailyCostUsdLimit', 'maxConcurrentRuns'].map((key) => [key, d[key] == null || d[key] === '' ? null : Number(d[key])])) }),
  canDuplicate: false,
  rowActions: (r, ctx) => [{ label: ctx.t('resources.usageQuotas.actions.usage'), tip: actionTip(ctx.t, 'usageQuotas', 'usage'), onClick: () => ctx.setExtraModal(<UsageQuotaUsageModal quota={r} tenantId={ctx.tenantId} onClose={() => ctx.setExtraModal(null)} />) }]
};

export const agentsConfig = {
  id: 'agents',
  explainer: 'agents',
  explainerDiagram: () => <AgentRelationDiagram />,
  api: tenantApi('listAgents', 'createAgent', 'updateAgent', 'deleteAgent'),
  filters: [{ name: 'kind', label: (t) => t('resources.agents.fields.kind'), options: ENUMS.agentKind, enumGroup: 'agentKind' }],
  loadOptions: async ({ apiClient, tenantId }) => ({ agents: await safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })) }),
  blank: () => ({
    name: '',
    displayName: '',
    description: '',
    kind: 'Hosted',
    agentVersion: '1.0.0',
    exposeA2A: true,
    exposeMcpTool: false,
    mcpToolName: '',
    inputMode: 'Text',
    inputSchemaJson: '',
    outputSchemaJson: '',
    delegationMode: 'None',
    delegationMaxDepth: 2,
    delegationAllowRecursion: false,
    delegationAllowList: [],
    skills: [],
    tags: [],
    active: true
  }),
  columns: ({ t, i18n }) => [
    nameCol('agents', t),
    col('agents', t, 'displayName', (r) => r.displayName || '-'),
    col('agents', t, 'kind', (r) => enumBadge(t, 'agentKind', r.kind, r.kind === 'Remote' ? 'warning' : 'info')),
    col('agents', t, 'exposure', (r) => [r.exposeA2A ? 'A2A' : null, r.exposeMcpTool ? 'MCP' : null].filter(Boolean).join(', ') || '-', { csv: (r) => [r.exposeA2A ? 'A2A' : null, r.exposeMcpTool ? 'MCP' : null].filter(Boolean).join(' ') }),
    col('agents', t, 'delegationMode', (r) => enumLabel(t, 'delegationMode', r.delegationMode)),
    col('agents', t, 'tags', (r) => (r.tags || []).join(', ') || '-', { defaultHidden: true }),
    activeCol('agents', t),
    idCol('agents', t),
    createdCol('agents', t, i18n)
  ],
  fields: (_d, { t, options }) => {
    const id = 'agents';
    return [
      section(id, t, 'identity'),
      field(id, t, 'name', 'text', { required: true }),
      field(id, t, 'displayName', 'text'),
      field(id, t, 'description', 'textarea'),
      field(id, t, 'kind', 'select', { required: true, options: enumOptions(t, 'agentKind') }),
      field(id, t, 'agentVersion', 'text'),
      field(id, t, 'tags', 'stringList'),
      field(id, t, 'remoteProtocol', 'select', { options: enumOptions(t, 'remoteProtocol'), showIf: (x) => x.kind === 'Remote' }),
      field(id, t, 'remoteEndpointUrl', 'text', { showIf: (x) => x.kind === 'Remote' }),
      section(id, t, 'exposure'),
      field(id, t, 'exposeA2A', 'checkbox'),
      field(id, t, 'exposeMcpTool', 'checkbox'),
      field(id, t, 'mcpToolName', 'text', { showIf: (x) => x.exposeMcpTool }),
      field(id, t, 'skills', 'objectList', {
        fields: [
          { name: 'skillId', type: 'text', label: t('resources.agents.fields.skillId'), required: true },
          { name: 'name', type: 'text', label: t('resources.agents.fields.skillName'), required: true },
          { name: 'description', type: 'textarea', label: t('resources.agents.fields.skillDescription') }
        ]
      }),
      section(id, t, 'io'),
      field(id, t, 'inputMode', 'select', { required: true, options: enumOptions(t, 'agentInputMode') }),
      field(id, t, 'inputSchemaJson', 'json', { showIf: (x) => x.inputMode === 'Structured' }),
      field(id, t, 'outputSchemaJson', 'json'),
      section(id, t, 'delegation'),
      field(id, t, 'delegationMode', 'select', { required: true, options: enumOptions(t, 'delegationMode') }),
      field(id, t, 'delegationAllowList', 'multiselect', { options: (options.agents || []).map((a) => a.name), showIf: (x) => x.delegationMode === 'AllowList' }),
      field(id, t, 'delegationMaxDepth', 'number', { min: 0, max: 10, showIf: (x) => x.delegationMode !== 'None' }),
      field(id, t, 'delegationAllowRecursion', 'checkbox', { showIf: (x) => x.delegationMode !== 'None' }),
      field(id, t, 'active', 'checkbox')
    ];
  },
  validate: (d, t) => {
    const e = {};
    if (!d.name || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(d.name)) e.name = t('resources.agents.errors.dnsName');
    for (const key of ['inputSchemaJson', 'outputSchemaJson']) {
      if (d[key]) {
        try {
          JSON.parse(d[key]);
        } catch {
          e[key] = t('common.errors.invalidJson');
        }
      }
    }
    return e;
  },
  detailPath: (r) => pathFor('agents', r.id),
  // Deleting an agent deletes its deployments too; name them first (M1-06).
  deletePreview: async (r, { apiClient, tenantId, t }) => {
    const list = await safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 }));
    const names = list.filter((d) => d.agentId === r.id).map((d) => d.name);
    if (!names.length) return { message: t('resources.agents.deleteNoDeployments', { name: r.name }) };
    return { message: t('resources.agents.deleteWithDeployments', { name: r.name, count: names.length }), details: affectedList(names) };
  }
};

/** Cluster setting path behind each deployment run limit (P3.15). */
const RUNTIME_PATHS = { maxRunSeconds: 'Runtime.MaxRunSeconds', repetitionGuard: 'Runtime.RepetitionGuard', maxAssistantChars: 'Runtime.MaxAssistantChars', noProgressSeconds: 'Runtime.NoProgressSeconds' };

/** Placeholder and hint for a numeric run limit, showing the cluster default when settings are readable. */
function runtimeHint(t, i18n, runtime, name) {
  const setting = RUNTIME_PATHS[name];
  const raw = runtime?.[name];
  const known = raw !== null && raw !== undefined && raw !== '';
  const value = known ? formatNumber(Number(raw), {}, i18n.language) : null;
  if (name === 'maxRunSeconds') return known ? { hint: t('resources.deployments.hints.timeoutCap', { value, setting }) } : {};
  const zero = t(name === 'maxAssistantChars' ? 'resources.deployments.hints.zeroUnlimited' : 'resources.deployments.hints.zeroOff');
  return {
    placeholder: known ? t('resources.deployments.placeholders.clusterDefault', { value }) : t('resources.deployments.placeholders.clusterDefaultUnknown'),
    hint: `${known ? t('resources.deployments.hints.guardDefault', { value, setting }) : t('resources.deployments.hints.guardDefaultUnknown', { setting })} ${zero}`
  };
}

/** The repetition guard toggle: the effective value, and whether it follows the cluster default. */
function guardToggle(t, value, runtime) {
  const setting = RUNTIME_PATHS.repetitionGuard;
  const known = typeof runtime?.repetitionGuard === 'boolean';
  // Runtime.RepetitionGuard defaults to true on the server when settings are not readable.
  const clusterDefault = known ? runtime.repetitionGuard : true;
  const state = t(`resources.deployments.guardStates.${clusterDefault ? 'on' : 'off'}`);
  const own = value !== null && value !== undefined;
  let hint;
  if (own) hint = known ? t('resources.deployments.hints.guardOwn', { value: state, setting }) : t('resources.deployments.hints.guardOwnUnknown', { setting });
  else hint = known ? t('resources.deployments.hints.guardFollowing', { value: state, setting }) : t('resources.deployments.hints.guardDefaultUnknown', { setting });
  return { defaultValue: clusterDefault, hint, resetLabel: t('resources.deployments.actions.useClusterDefault'), resetTip: t('tips.resources.deployments.useClusterDefault') };
}

/**
 * The current tenant record (for its requireUntrustedDeployments policy, P11.14), or null when it cannot be read. Uses
 * the tenant list, which every signed-in caller may read for their own tenant.
 */
async function loadTenant(apiClient, tenantId) {
  try {
    const page = await apiClient.listTenants({ pageNumber: 1, pageSize: 1000 });
    return (page?.items || page?.objects || []).find((x) => x.id === tenantId) || null;
  } catch {
    return null;
  }
}

/**
 * The executor a deployment's runs resolve to: its own, else the pool default, else Process. An Untrusted deployment
 * (P11.14) or one with egress rules (P11.15) with no executor never resolves to Process; the server picks KubernetesJob.
 */
export function resolvedExecutor(d, pools) {
  const pool = (pools || []).find((p) => p.id === d?.nodePoolId);
  const inherited = pool?.defaultExecutor || 'Process';
  if (d?.executor) return d.executor;
  return (d?.trustLevel === 'Untrusted' || hasEgressRules(d)) && inherited === 'Process' ? 'KubernetesJob' : inherited;
}

/** Hint under the executor select: what an empty choice resolves to, and where pod resources apply. */
function executorHint(t, d, pools) {
  const resolved = resolvedExecutor(d, pools);
  const hint = d.executor ? t('resources.deployments.hints.executorSet') : t('resources.deployments.hints.executorInherit', { executor: enumLabel(t, 'runExecutor', resolved) });
  return resolved === 'Process' ? `${hint} ${t('processSecurity.trustedOnly')}` : hint;
}

/**
 * Deployment form notices (P11.14, P11.16): an Untrusted deployment pinned to Process can never run; a tenant that
 * requires Untrusted rejects saving a Trusted deployment; a Trusted deployment on Process is trusted only.
 */
function deploymentNotice(d, { t, options }) {
  const notices = [];
  if (d.trustLevel === 'Untrusted' && d.executor === 'Process') {
    notices.push(<div key="untrusted" className="error-banner" role="alert" data-testid="untrusted-process">{t('resources.deployments.trust.untrustedProcess')}</div>);
  }
  if (hasEgressRules(d) && d.executor === 'Process') {
    notices.push(<div key="egressProcess" className="error-banner" role="alert" data-testid="egress-process">{t('common.fieldCodes.EgressRulesNeedKubernetesJob')}</div>);
  } else if (hasEgressRules(d)) {
    notices.push(<div key="egress" className="info-banner" role="status" data-testid="egress-note">{t('resources.deployments.egress.note', { count: d.egressRules.length })}</div>);
  }
  if (d.trustLevel !== 'Untrusted' && options?.tenant?.requireUntrustedDeployments) {
    notices.push(<div key="tenant" className="warning-banner" role="status" data-testid="tenant-requires-untrusted">{t('resources.deployments.trust.tenantRequiresUntrusted')}</div>);
  }
  if (d.trustLevel !== 'Untrusted' && !hasEgressRules(d) && resolvedExecutor(d, options?.pools) === 'Process') {
    notices.push(<div key="process" className="warning-banner" role="status" data-testid="process-trusted-only">{t('processSecurity.trustedOnly')}</div>);
  }
  if (notices.length === 0) return null;
  return notices.length === 1 ? notices[0] : <>{notices}</>;
}

/** One egress rule as text, for example 203.0.113.0/24:443/TCP (no port means every port). */
export function egressRuleText(rule) {
  return `${rule?.cidr || ''}${rule?.port ? `:${rule.port}` : ''}/${rule?.protocol || 'TCP'}`;
}

/** Egress allowlist cell: the rule count with every rule in the tooltip, or the default egress. */
function egressBadge(t, r) {
  const rules = r?.egressRules || [];
  if (rules.length === 0) return <Badge tip={t('tips.resources.deployments.egressDefault')}>{t('resources.deployments.egress.default')}</Badge>;
  return (
    <span data-testid="egress-rules-cell">
      <Badge tone="info" tip={rules.map((x) => egressRuleText(x)).join(', ')}>{t('resources.deployments.egress.count', { count: rules.length })}</Badge>
    </span>
  );
}

/** A deployment's effect policy (P12.29); records from before the field derive it from the deprecated retryOnNodeLoss. */
export function effectPolicyOf(r) {
  if (r?.effectPolicy) return r.effectPolicy;
  return r?.retryOnNodeLoss ? 'AtLeastOnce' : 'AtMostOnce';
}

/** Trust level badge for a deployment row; flags a Trusted deployment in a tenant that requires Untrusted. */
function trustBadge(t, r, tenant) {
  const level = r.trustLevel || 'Trusted';
  if (level === 'Trusted' && tenant?.requireUntrustedDeployments) {
    return (
      <span data-testid="trust-flagged">
        <Badge tone="warning" tip={t('tips.resources.deployments.trustFlagged')}>{'⚠'} {t('resources.deployments.trust.flagged')}</Badge>
      </span>
    );
  }
  return enumBadge(t, 'trustLevel', level, level === 'Untrusted' ? 'info' : 'neutral');
}

export const deploymentsConfig = {
  id: 'deployments',
  explainer: 'deployments',
  explainerDiagram: () => <AgentRelationDiagram />,
  api: tenantApi('listDeployments', 'createDeployment', 'updateDeployment', 'deleteDeployment'),
  steps: ['basics', 'harness', 'prompts', 'resources', 'overrides', 'placement', 'approvals'],
  formNotice: deploymentNotice,
  loadOptions: async ({ apiClient, tenantId }) => {
    const [agents, profiles, templates, secrets, mcpServers, workspaces, stores, pools, runtime, tenant] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listHarnessProfiles(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })),
      safeList(apiClient.listPromptTemplates(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })),
      safeList(apiClient.listSecrets(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listMcpServers(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listWorkspaceTemplates(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listArtifactStores(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listNodePools({ pageNumber: 1, pageSize: 1000 })),
      // Cluster defaults for the run limits (P3.15); null when the caller may not read settings.
      loadRuntimeLimits(apiClient),
      // The tenant's requireUntrustedDeployments policy (P11.14); null when it cannot be read.
      loadTenant(apiClient, tenantId)
    ]);
    return { agents, profiles, templates, secrets, mcpServers, workspaces, stores, pools, runtime, tenant };
  },
  // Names for the Agent and Harness profile columns (M1-20).
  loadLookups: async ({ apiClient, tenantId }) => {
    const [agents, profiles, tenant] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listHarnessProfiles(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })),
      loadTenant(apiClient, tenantId)
    ]);
    return { agents: Object.fromEntries(agents.map((a) => [a.id, a.name])), profiles: Object.fromEntries(profiles.map((p) => [p.id, p.name])), tenant };
  },
  // Once the pick lists load, start each prompt role on the built-in template of its kind (M1-03).
  withOptions: (d, options) => ({
    ...d,
    promptBindings: (d.promptBindings || []).map((b) => (b.templateId ? b : { ...b, templateId: defaultTemplateFor(b.role, options.templates) }))
  }),
  blank: () => ({
    name: '',
    description: '',
    agentId: '',
    harnessProfileId: '',
    model: '',
    fallbackModel: '',
    effort: '',
    maxTurns: null,
    maxBudgetUsd: null,
    maxConcurrentRuns: 0,
    timeoutSeconds: null,
    maxAttempts: 1,
    effectPolicy: 'AtMostOnce',
    repetitionGuard: null,
    maxAssistantChars: null,
    noProgressSeconds: null,
    executor: null,
    trustLevel: 'Trusted',
    ...podResourcesToForm(null),
    ...requirementsToForm(null),
    weight: 100,
    nodePoolId: null,
    workspaceTemplateId: null,
    artifactStoreId: null,
    artifactGlobs: [],
    egressRules: [],
    promptBindings: [
      { role: 'System', templateId: '', pinnedVersion: null },
      { role: 'Task', templateId: '', pinnedVersion: null }
    ],
    resourceBindings: [],
    argumentOverrides: [],
    environmentOverrides: [],
    fileOverrides: [],
    nodeSelector: [],
    parameters: [],
    allowedRunOverrides: [],
    ...approvalFormDefaults(null),
    active: true
  }),
  columns: ({ t, i18n, lookups }) => [
    nameCol('deployments', t),
    col('deployments', t, 'agentId', (r) => <NamedId id={r.agentId} name={r.agentName || lookups?.agents?.[r.agentId]} />, { csv: (r) => r.agentName || lookups?.agents?.[r.agentId] || r.agentId }),
    col('deployments', t, 'harnessProfileId', (r) => <NamedId id={r.harnessProfileId} name={lookups?.profiles?.[r.harnessProfileId]} />, { csv: (r) => lookups?.profiles?.[r.harnessProfileId] || r.harnessProfileId }),
    col('deployments', t, 'model', (r) => r.model || '-'),
    col('deployments', t, 'executor', (r) => (r.executor ? enumBadge(t, 'runExecutor', r.executor, r.executor === 'KubernetesJob' ? 'info' : 'neutral') : t('resources.deployments.executorInheritShort')), { csv: (r) => r.executor || '', defaultHidden: true }),
    col('deployments', t, 'trustLevel', (r) => trustBadge(t, r, lookups?.tenant), { csv: (r) => r.trustLevel || 'Trusted' }),
    col('deployments', t, 'egressRules', (r) => egressBadge(t, r), { csv: (r) => (r.egressRules || []).map((x) => egressRuleText(x)).join(' ') }),
    col('deployments', t, 'effectPolicy', (r) => enumBadge(t, 'effectPolicy', effectPolicyOf(r), effectPolicyOf(r) === 'AtLeastOnce' ? 'warning' : 'neutral'), { csv: (r) => effectPolicyOf(r) }),
    col('deployments', t, 'weight', (r) => r.weight, { cellClass: 'right' }),
    col('deployments', t, 'configVersion', (r) => r.configVersion, { cellClass: 'right', defaultHidden: true }),
    col('deployments', t, 'approvalsEnabled', (r) =>
      r.approvalsEnabled ? (
        <Badge tone="info" tip={t('tips.badges.approvalsOn', { count: (r.approvalRules || []).length })}>{t('resources.deployments.approvalsOn', { count: (r.approvalRules || []).length })}</Badge>
      ) : (
        <Badge tip={t('tips.badges.approvalsOff')}>{t('resources.deployments.approvalsOff')}</Badge>
      ),
    { defaultHidden: true, csv: (r) => (r.approvalsEnabled ? 'true' : 'false') }),
    activeCol('deployments', t),
    idCol('deployments', t),
    createdCol('deployments', t, i18n)
  ],
  fields: (d, { t, i18n, options }) => {
    const id = 'deployments';
    const sel = (list, label = (x) => x.name) => (list || []).map((x) => ({ value: x.id, label: label(x) }));
    return [
      field(id, t, 'name', 'text', { required: true, step: 0 }),
      field(id, t, 'agentId', 'select', { required: true, options: sel(options.agents), step: 0 }),
      field(id, t, 'description', 'textarea', { step: 0 }),
      field(id, t, 'weight', 'number', { min: 0, max: 1000, step: 0 }),
      field(id, t, 'active', 'checkbox', { step: 0 }),
      field(id, t, 'harnessProfileId', 'select', { required: true, options: sel(options.profiles), step: 1 }),
      field(id, t, 'model', 'text', { step: 1 }),
      field(id, t, 'fallbackModel', 'text', { step: 1 }),
      field(id, t, 'effort', 'text', { step: 1 }),
      field(id, t, 'maxTurns', 'number', { min: 1, step: 1 }),
      field(id, t, 'maxBudgetUsd', 'number', { min: 0, step: 1 }),
      field(id, t, 'parameters', 'objectList', {
        step: 1,
        fields: [
          { name: 'name', type: 'text', label: t('resources.deployments.fields.paramName'), required: true },
          { name: 'value', type: 'text', label: t('resources.deployments.fields.paramValue') }
        ]
      }),
      field(id, t, 'promptBindings', 'objectList', {
        step: 2,
        // When the role changes and the template was the old role's default (or empty), follow the new role (M1-03).
        rowAdjust: (next, prev) => {
          if (!prev || next.role === prev.role) return next.templateId ? next : { ...next, templateId: defaultTemplateFor(next.role, options.templates) };
          const wasDefault = !prev.templateId || prev.templateId === defaultTemplateFor(prev.role, options.templates);
          return wasDefault ? { ...next, templateId: defaultTemplateFor(next.role, options.templates) } : next;
        },
        fields: [
          {
            name: 'role',
            type: 'select',
            label: t('resources.deployments.fields.promptRole'),
            required: true,
            options: (row) => [...PROMPT_ROLES, ...(row?.role && !PROMPT_ROLES.includes(row.role) ? [row.role] : [])].map((r) => ({ value: r, label: t(`resources.deployments.promptRoles.${r}`, { defaultValue: r }) }))
          },
          {
            name: 'templateId',
            type: 'select',
            label: t('resources.deployments.fields.template'),
            required: true,
            options: (row) => templatesForRole(row?.role, options.templates, row?.templateId).map((x) => ({ value: x.id, label: x.isBuiltIn ? `${x.name} (${t('common.generic.builtIn')})` : x.name }))
          },
          { name: 'pinnedVersion', type: 'number', label: t('resources.deployments.fields.pinnedVersion'), min: 1 }
        ]
      }),
      field(id, t, 'resourceBindings', 'objectList', {
        step: 3,
        hint: secretNeedsHint(t, i18n, (options.profiles || []).find((p) => p.id === d.harnessProfileId)),
        // Kind always matches the resource the user picked; switching Kind clears a resource of the other kind (M1-04).
        rowAdjust: (next, prev) => {
          const secret = (options.secrets || []).some((x) => x.id === next.resourceId);
          const mcp = (options.mcpServers || []).some((x) => x.id === next.resourceId);
          if (!prev) {
            const resourceId = (options.secrets || [])[0]?.id || (options.mcpServers || [])[0]?.id || '';
            const kind = (options.secrets || []).some((x) => x.id === resourceId) ? 'Secret' : 'McpServer';
            return { ...next, kind, resourceId };
          }
          if (next.resourceId !== prev.resourceId && (secret || mcp)) return { ...next, kind: secret ? 'Secret' : 'McpServer' };
          if (next.kind !== prev.kind) {
            const list = next.kind === 'Secret' ? options.secrets : options.mcpServers;
            return (list || []).some((x) => x.id === next.resourceId) ? next : { ...next, resourceId: (list || [])[0]?.id || '' };
          }
          return next;
        },
        fields: [
          { name: 'kind', type: 'select', label: t('resources.deployments.fields.bindingKind'), required: true, options: enumOptions(t, 'resourceBindingKind') },
          { name: 'alias', type: 'text', label: t('resources.deployments.fields.alias'), required: true },
          {
            name: 'resourceId',
            type: 'select',
            label: t('resources.deployments.fields.resource'),
            required: true,
            options: (row) => {
              const secrets = sel(options.secrets, (x) => `${t('enums.resourceBindingKind.Secret')}: ${x.name}`);
              const servers = sel(options.mcpServers, (m) => `${t('enums.resourceBindingKind.McpServer')}: ${m.name}`);
              return row?.kind === 'McpServer' ? [...servers, ...secrets] : [...secrets, ...servers];
            }
          }
        ]
      }),
      field(id, t, 'workspaceTemplateId', 'select', { options: sel(options.workspaces), step: 3 }),
      field(id, t, 'artifactStoreId', 'select', { options: sel(options.stores), step: 3 }),
      field(id, t, 'artifactGlobs', 'stringList', { step: 3, placeholder: 'reports/**/*.json' }),
      field(id, t, 'argumentOverrides', 'objectList', {
        step: 4,
        ordered: true,
        fields: [
          { name: 'operation', type: 'select', label: t('resources.deployments.fields.operation'), required: true, options: enumOptions(t, 'argumentOverrideOperation') },
          { name: 'match', type: 'text', label: t('resources.deployments.fields.match') },
          { name: 'template', type: 'text', label: t('resources.deployments.fields.argTemplate') },
          { name: 'condition', type: 'text', label: t('resources.deployments.fields.condition') }
        ]
      }),
      field(id, t, 'environmentOverrides', 'objectList', {
        step: 4,
        fields: [
          { name: 'name', type: 'text', label: t('resources.deployments.fields.envName'), required: true },
          { name: 'valueTemplate', type: 'text', label: t('resources.deployments.fields.envValue') },
          { name: 'isSecret', type: 'checkbox', label: t('resources.deployments.fields.isSecret') }
        ]
      }),
      field(id, t, 'fileOverrides', 'objectList', {
        step: 4,
        fields: [
          { name: 'baseDirectory', type: 'select', label: t('resources.harnessProfiles.fields.fileBase'), options: enumOptions(t, 'fileBaseDirectory'), required: true },
          { name: 'pathTemplate', type: 'text', label: t('resources.harnessProfiles.fields.filePath'), required: true },
          { name: 'contentTemplate', type: 'code', rows: 4, label: t('resources.harnessProfiles.fields.fileContent') },
          { name: 'mode', type: 'text', label: t('resources.harnessProfiles.fields.fileMode') },
          { name: 'isSecret', type: 'checkbox', label: t('resources.deployments.fields.isSecret') }
        ]
      }),
      field(id, t, 'allowedRunOverrides', 'objectList', {
        step: 4,
        fields: [
          { name: 'name', type: 'text', label: t('resources.deployments.fields.paramName'), required: true },
          { name: 'validation', type: 'select', label: t('resources.deployments.fields.validation'), required: true, options: enumOptions(t, 'runOverrideValidation') },
          { name: 'pattern', type: 'text', label: t('resources.deployments.fields.pattern') }
        ]
      }),
      field(id, t, 'nodePoolId', 'select', { options: sel(options.pools), step: 5 }),
      field(id, t, 'nodeSelector', 'objectList', {
        step: 5,
        fields: [
          { name: 'key', type: 'text', label: t('components.form.key'), required: true },
          { name: 'value', type: 'text', label: t('components.form.value'), required: true }
        ]
      }),
      field(id, t, 'maxConcurrentRuns', 'number', { min: 0, max: 100000, step: 5 }),
      field(id, t, 'timeoutSeconds', 'number', { min: 5, max: 86400, step: 5, ...runtimeHint(t, i18n, options.runtime, 'maxRunSeconds') }),
      field(id, t, 'maxAttempts', 'number', { min: 1, max: 10, step: 5 }),
      // P12.29: what happens to a started run whose worker is lost.
      field(id, t, 'effectPolicy', 'select', { step: 5, required: true, options: enumOptions(t, 'effectPolicy'), hint: t('resources.deployments.hints.effectPolicy') }),
      // Run guards (P3.15): empty follows the cluster default from Settings (Runtime.*).
      section(id, t, 'guards', 5),
      field(id, t, 'repetitionGuard', 'nullableToggle', { step: 5, ...guardToggle(t, d.repetitionGuard, options.runtime) }),
      field(id, t, 'maxAssistantChars', 'number', { min: 0, max: 100000000, step: 5, ...runtimeHint(t, i18n, options.runtime, 'maxAssistantChars') }),
      field(id, t, 'noProgressSeconds', 'number', { min: 0, max: 86400, step: 5, ...runtimeHint(t, i18n, options.runtime, 'noProgressSeconds') }),
      // Executor and run pod resources (Phase 11): empty executor inherits the node pool default, then Process.
      section(id, t, 'execution', 5),
      field(id, t, 'trustLevel', 'select', { step: 5, required: true, options: enumOptions(t, 'trustLevel') }),
      field(id, t, 'executor', 'select', { step: 5, options: enumOptions(t, 'runExecutor'), noneLabel: t('resources.deployments.executorInherit'), hint: executorHint(t, d, options.pools) }),
      field(id, t, 'capIsolation', 'select', { step: 5, required: true, options: ['Process', 'Container', 'SandboxedRuntime'].map((value) => ({ value, label: enumLabel(t, 'executorIsolation', value) })), hint: t('resources.deployments.hints.capabilities') }),
      field(id, t, 'capColdStartClass', 'select', { step: 5, options: ['Immediate', 'Cold', 'Warm'].map((value) => ({ value, label: enumLabel(t, 'executorColdStart', value) })) }),
      ...EXECUTOR_REQUIREMENT_FLAGS.map((key) => field(id, t, capabilityField(key), 'checkbox', { step: 5 })),
      // Egress allowlist (P11.15): with rules, run pods reach only DNS, the Garrison MCP port, and these blocks.
      field(id, t, 'egressRules', 'objectList', {
        step: 5,
        addLabel: t('resources.deployments.egress.add'),
        fields: [
          { name: 'cidr', type: 'text', label: t('resources.deployments.fields.egressCidr'), required: true, placeholder: '203.0.113.0/24' },
          { name: 'port', type: 'number', label: t('resources.deployments.fields.egressPort'), min: 1, max: 65535, placeholder: t('resources.deployments.egress.allPorts') },
          { name: 'protocol', type: 'select', label: t('resources.deployments.fields.egressProtocol'), required: true, default: 'TCP', options: EGRESS_PROTOCOLS.map((value) => ({ value, label: value })) }
        ]
      }),
      ...POD_RESOURCE_KEYS.map((key) =>
        field(id, t, podField(key), 'text', { step: 5, placeholder: POD_RESOURCE_EXAMPLES[key], showIf: (x) => x.executor !== 'Process' })
      ),
      // Permission approvals (P12.3): which tool calls the harness may make, which it may not, and which wait for a person.
      field(id, t, 'approvalsEnabled', 'checkbox', { step: 6 }),
      field(id, t, 'approvalDefaultAction', 'select', { step: 6, required: true, options: enumOptions(t, 'approvalRuleAction') }),
      field(id, t, 'approvalTimeoutSeconds', 'number', { step: 6, min: APPROVAL_TIMEOUT.min, max: APPROVAL_TIMEOUT.max, placeholder: String(APPROVAL_TIMEOUT.default) }),
      field(id, t, 'approvalTimeoutDecision', 'select', { step: 6, required: true, options: enumOptions(t, 'approvalDecision') }),
      field(id, t, 'approvalRules', 'objectList', {
        step: 6,
        ordered: true,
        addLabel: t('resources.deployments.actions.addRule'),
        fields: [
          { name: 'action', type: 'select', label: t('resources.deployments.fields.ruleAction'), required: true, default: 'Ask', options: enumOptions(t, 'approvalRuleAction') },
          { name: 'pattern', type: 'text', label: t('resources.deployments.fields.rulePattern'), required: true, placeholder: 'Bash(npm test)' },
          { name: 'inputPattern', type: 'text', label: t('resources.deployments.fields.ruleInputPattern'), placeholder: t('resources.deployments.placeholders.ruleInputPattern') },
          { name: 'description', type: 'text', label: t('resources.deployments.fields.ruleDescription') }
        ]
      }),
      field(id, t, 'approvalTest', 'custom', { step: 6, render: (data) => <ApprovalCheckPanel deploymentId={data?.id || null} /> })
    ];
  },
  toForm: (r) => {
    const form = { ...deploymentToForm(r), ...approvalFormDefaults(r), egressRules: egressRulesToForm(r?.egressRules) };
    form.effectPolicy = effectPolicyOf(r);
    delete form.retryOnNodeLoss;
    return form;
  },
  toBody: (d) => {
    const body = deploymentToBody(d);
    // P12.29: send only effectPolicy. The deprecated retryOnNodeLoss is derived by the server, and a stale copy that
    // disagrees with an edited policy would be rejected (EffectPolicyConflict).
    delete body.retryOnNodeLoss;
    body.effectPolicy = d.effectPolicy || 'AtMostOnce';
    body.approvalsEnabled = !!d.approvalsEnabled;
    body.approvalDefaultAction = d.approvalDefaultAction || 'Ask';
    body.approvalTimeoutSeconds = d.approvalTimeoutSeconds ?? APPROVAL_TIMEOUT.default;
    body.approvalTimeoutDecision = d.approvalTimeoutDecision || 'Deny';
    body.approvalRules = approvalRulesToBody(d.approvalRules);
    body.egressRules = egressRulesToBody(d.egressRules);
    return body;
  },
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (!d.agentId) e.agentId = t('common.errors.required');
    if (!d.harnessProfileId) e.harnessProfileId = t('common.errors.required');
    if (d.trustLevel === 'Untrusted' && d.executor === 'Process') e.executor = t('common.fieldCodes.UntrustedNeedsIsolation');
    Object.assign(e, podResourceErrors(d, t('resources.deployments.errors.quantity')));
    Object.assign(e, approvalErrors(d, t));
    const egress = egressErrors(d, t);
    if (egress.executor && e.executor) delete egress.executor;
    Object.assign(e, egress);
    return e;
  },
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.deployments.actions.compilePreview'), tip: actionTip(ctx.t, 'deployments', 'compilePreview'), onClick: () => ctx.setExtraModal(<CompilePreviewModal tenantId={ctx.tenantId} deployment={r} onClose={() => ctx.setExtraModal(null)} />) },
    { label: ctx.t('resources.deployments.actions.test'), tip: actionTip(ctx.t, 'deployments', 'test'), onClick: () => ctx.navigate(pathFor('invoke', null, { agentId: r.agentId, deploymentId: r.id })) }
  ]
};

export const nodePoolsConfig = {
  id: 'nodePools',
  explainer: 'nodePools',
  api: {
    list: (c, _t, p) => c.listNodePools(p),
    create: (c, _t, b) => c.createNodePool(b),
    update: (c, _t, id, b) => c.updateNodePool(id, b),
    remove: (c, _t, id) => c.deleteNodePool(id)
  },
  blank: () => ({ name: '', description: '', defaultExecutor: null, tenants: [], active: true }),
  columns: ({ t, i18n }) => [
    nameCol('nodePools', t),
    col('nodePools', t, 'description', (r) => r.description || '-'),
    col('nodePools', t, 'tenants', (r) => ((r.tenants || []).length ? (r.tenants || []).join(', ') : t('resources.nodePools.allTenants'))),
    col('nodePools', t, 'defaultExecutor', (r) => enumBadge(t, 'runExecutor', r.defaultExecutor || 'Process'), { csv: (r) => r.defaultExecutor || 'Process' }),
    activeCol('nodePools', t),
    idCol('nodePools', t),
    createdCol('nodePools', t, i18n)
  ],
  fields: (_d, { t }) => [
    field('nodePools', t, 'name', 'text', { required: true }),
    field('nodePools', t, 'description', 'textarea'),
    field('nodePools', t, 'defaultExecutor', 'select', { options: enumOptions(t, 'runExecutor'), noneLabel: enumLabel(t, 'runExecutor', 'Process') }),
    field('nodePools', t, 'tenants', 'stringList'),
    field('nodePools', t, 'active', 'checkbox')
  ],
  validate: (d, t) => (!d.name ? { name: t('common.errors.required') } : null)
};


export const promptTemplatesConfig = {
  id: 'promptTemplates',
  explainer: 'promptTemplates',
  api: {
    list: (c, tenant, p) => c.listPromptTemplates(tenant, p),
    create: null,
    update: null,
    remove: (c, tenant, id) => c.deletePromptTemplate(tenant, id)
  },
  filters: [{ name: 'kind', label: (t) => t('resources.promptTemplates.fields.kind'), options: ENUMS.promptTemplateKind, enumGroup: 'promptTemplateKind' }],
  canDuplicate: false,
  isEditable: notBuiltIn,
  columns: ({ t, i18n }) => [
    nameCol('promptTemplates', t),
    col('promptTemplates', t, 'kind', (r) => enumBadge(t, 'promptTemplateKind', r.kind)),
    col('promptTemplates', t, 'currentVersion', (r) => `v${r.currentVersion ?? 1}`, { cellClass: 'right' }),
    col('promptTemplates', t, 'description', (r) => r.description || '-', { defaultHidden: true }),
    builtInCol('promptTemplates', t),
    idCol('promptTemplates', t),
    col('promptTemplates', t, 'lastUpdateUtc', (r) => formatRelativeTime(r.lastUpdateUtc, i18n.language))
  ],
  fields: () => [],
  headerActions: ({ t, navigate }) => (
    <button type="button" className="button-primary" onClick={() => navigate(pathFor('promptTemplates', 'new'))} data-testid="add-template" {...tip(t('tips.resources.promptTemplates.add'))}>
      {t('resources.promptTemplates.add')}
    </button>
  ),
  detailPath: (r) => pathFor('promptTemplates', r.id),
  deletePreview: (r, { apiClient, tenantId, t }) => templateDeletePreview(t, apiClient, tenantId, r),
  rowActions: (r, ctx) => [
    {
      label: ctx.t('common.actions.clone'),
      tip: actionTip(ctx.t, 'promptTemplates', 'clone'),
      onClick: () =>
        ctx.setExtraModal(
          <CloneTemplateModal
            template={r}
            onClose={() => ctx.setExtraModal(null)}
            onCloned={(created) => {
              ctx.setExtraModal(null);
              ctx.addToast({ type: 'success', message: ctx.t('common.toasts.cloned') });
              if (created?.id) ctx.navigate(pathFor('promptTemplates', created.id));
              else ctx.reload();
            }}
          />
        )
    }
  ]
};
