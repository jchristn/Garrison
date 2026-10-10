// Declarative configurations for record pages rendered by ResourceView.
// Field labels come from resources.<id>.fields.<name>; hints from resources.<id>.hints.<name>.

import CopyableId from '../components/CopyableId';
import { Badge, ActiveBadge } from '../components/StatusBadge';
import SecretOnceModal from '../components/SecretOnceModal';
import ValuePromptModal from '../components/ValuePromptModal';
import EffectivePermissionsModal from '../components/EffectivePermissionsModal';
import McpTestModal from '../components/McpTestModal';
import CompilePreviewModal from '../components/CompilePreviewModal';
import { ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip, enumTip, optionalText } from '../utils/tips';
import { AgentRelationDiagram } from '../components/Explainer';
import { tip } from '../components/Tooltip';

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
const enumLabel = (t, group, value) => (value ? t(`enums.${group}.${value}`, { defaultValue: value }) : '-');
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
  blank: () => ({ name: '', description: '', active: true }),
  columns: ({ t, i18n }) => [nameCol('tenants', t), idCol('tenants', t), col('tenants', t, 'description', (r) => r.description || '-'), activeCol('tenants', t), createdCol('tenants', t, i18n)],
  fields: (_d, { t }) => [field('tenants', t, 'name', 'text', { required: true }), field('tenants', t, 'description', 'textarea'), field('tenants', t, 'active', 'checkbox')],
  validate: (d, t) => (!d.name ? { name: t('common.errors.required') } : null),
  toBody: (d) => ({ name: d.name, description: d.description, active: !!d.active })
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
  blank: () => ({ name: '', userId: '', authMode: 'Hybrid', expiresUtc: null, active: true }),
  columns: ({ t, i18n }) => [
    nameCol('credentials', t),
    col('credentials', t, 'accessKey', (r) => <CopyableId value={r.accessKey} max={28} />, { cellClass: 'cell-id' }),
    col('credentials', t, 'secretKeyLast4', (r) => (r.secretKeyLast4 ? <code>****{r.secretKeyLast4}</code> : '-')),
    col('credentials', t, 'userId', (r) => <CopyableId value={r.userId} />, { defaultHidden: true }),
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
    field('credentials', t, 'authMode', 'select', { required: true, options: ENUMS.credentialAuthMode }),
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
    col('permissions', t, 'resourceTypes', (r) => (r.resourceTypes || []).join(', ') || '-'),
    col('permissions', t, 'operationTypes', (r) => (r.operationTypes || []).join(', ') || '-'),
    builtInCol('permissions', t),
    idCol('permissions', t)
  ],
  fields: (_d, { t }) => [
    field('permissions', t, 'name', 'text', { required: true }),
    field('permissions', t, 'permissionType', 'select', { required: true, options: ENUMS.permissionType }),
    field('permissions', t, 'resourceTypes', 'multiselect', { options: ENUMS.resourceType }),
    field('permissions', t, 'operationTypes', 'multiselect', { options: ENUMS.operationType }),
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
    blank: () => ({ [principalKey]: '', roleId: '', resourceScope: 'Tenant', resourceId: '', inheritsToChildren: true, active: true }),
    columns: ({ t, i18n }) => [
      col(id, t, principalKey, (r) => <CopyableId value={r[principalKey]} />, { pinned: true, cellClass: 'cell-id' }),
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
      field(id, t, 'resourceScope', 'select', { required: true, options: ENUMS.resourceScope }),
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
  filters: [{ name: 'harnessType', label: (t) => t('resources.harnessProfiles.fields.harnessType'), options: ENUMS.harnessType }],
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
    col('harnessProfiles', t, 'outputParser', (r) => r.outputParser),
    builtInCol('harnessProfiles', t),
    idCol('harnessProfiles', t),
    createdCol('harnessProfiles', t, i18n)
  ],
  fields: (d, { t }) => {
    const id = 'harnessProfiles';
    return [
      field(id, t, 'name', 'text', { required: true, step: 0 }),
      field(id, t, 'description', 'textarea', { step: 0 }),
      field(id, t, 'harnessType', 'select', { required: true, options: ENUMS.harnessType, step: 0 }),
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
      field(id, t, 'promptDelivery', 'select', { required: true, options: ENUMS.promptDelivery, step: 1 }),
      field(id, t, 'promptArgumentTemplate', 'text', { step: 1, showIf: (x) => x.promptDelivery !== 'Stdin' }),
      field(id, t, 'systemPromptDelivery', 'select', { required: true, options: ENUMS.systemPromptDelivery, step: 1 }),
      field(id, t, 'systemPromptTarget', 'text', { step: 1, showIf: (x) => x.systemPromptDelivery !== 'None' && x.systemPromptDelivery !== 'PrependToPrompt' }),
      field(id, t, 'mcpConfigFormat', 'select', { required: true, options: ENUMS.mcpConfigFormat, step: 1 }),
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
          { name: 'baseDirectory', type: 'select', label: t('resources.harnessProfiles.fields.fileBase'), options: ENUMS.fileBaseDirectory, required: true },
          { name: 'pathTemplate', type: 'text', label: t('resources.harnessProfiles.fields.filePath'), required: true },
          { name: 'contentTemplate', type: 'code', rows: 5, label: t('resources.harnessProfiles.fields.fileContent') },
          { name: 'condition', type: 'text', label: t('resources.harnessProfiles.fields.argCondition') },
          { name: 'mode', type: 'text', label: t('resources.harnessProfiles.fields.fileMode') },
          { name: 'isSecret', type: 'checkbox', label: t('resources.harnessProfiles.fields.isSecret') }
        ]
      }),
      field(id, t, 'credentialEnvironmentAllowlist', 'stringList', { step: 1 }),
      field(id, t, 'outputParser', 'select', { required: true, options: ENUMS.outputParser, step: 2 }),
      field(id, t, 'genericTextField', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'genericFinalField', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'genericSuccessField', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'genericSuccessValue', 'text', { step: 2, showIf: (x) => x.outputParser === 'GenericJsonl' }),
      field(id, t, 'resultSource', 'select', { required: true, options: ENUMS.resultSource, step: 2 }),
      field(id, t, 'resultFileName', 'text', { step: 2, showIf: (x) => x.resultSource === 'LastMessageFile' }),
      field(id, t, 'successPolicy', 'select', { required: true, options: ENUMS.successPolicy, step: 2 }),
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
      field(id, t, 'transport', 'select', { required: true, options: ENUMS.mcpTransport, optionLabel: (v) => t(`enums.mcpTransport.${v}`, { defaultValue: v }) }),
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
    { label: ctx.t('resources.mcpServers.actions.test'), tip: actionTip(ctx.t, 'mcpServers', 'test'), onClick: () => ctx.setExtraModal(<McpTestModal load={() => ctx.apiClient.testMcpServer(ctx.tenantId, r.id)} name={r.name} onClose={() => ctx.setExtraModal(null)} />) }
  ]
};

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
    col('secrets', t, 'valueLast4', (r) => (r.valueLast4 ? <code>****{r.valueLast4}</code> : <span className="text-muted">{t('resources.secrets.notSet')}</span>)),
    col('secrets', t, 'rotatedUtc', (r) => (r.rotatedUtc ? formatRelativeTime(r.rotatedUtc, i18n.language) : '-')),
    col('secrets', t, 'expiresUtc', (r) => (r.expiresUtc ? formatDateTime(r.expiresUtc, i18n.language) : t('common.generic.never'))),
    activeCol('secrets', t),
    idCol('secrets', t)
  ],
  fields: (_d, { t, mode }) => [
    field('secrets', t, 'name', 'text', { required: true }),
    field('secrets', t, 'kind', 'select', { required: true, options: ENUMS.secretKind, optionLabel: (v) => t(`enums.secretKind.${v}`, { defaultValue: v }) }),
    field('secrets', t, 'description', 'textarea'),
    field('secrets', t, 'value', 'password', { required: mode === 'create', showIf: () => mode === 'create' }),
    field('secrets', t, 'expiresUtc', 'datetime'),
    field('secrets', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (!d.id && !d.value) e.value = t('common.errors.required');
    return e;
  },
  toBody: (d, mode) => {
    const body = { name: d.name, description: d.description, kind: d.kind, expiresUtc: d.expiresUtc || null, active: !!d.active };
    if (mode !== 'edit' && d.value) body.value = d.value;
    return body;
  },
  canDuplicate: false,
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
  blank: () => ({ name: '', description: '', kind: 'Empty', gitUrl: '', gitRef: '', gitDepth: 1, gitCredentialSecretId: null, retention: 'Delete', files: [], active: true }),
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
    field('workspaces', t, 'kind', 'select', { required: true, options: ENUMS.workspaceKind }),
    field('workspaces', t, 'description', 'textarea'),
    field('workspaces', t, 'gitUrl', 'text', { showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'gitRef', 'text', { showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'gitDepth', 'number', { min: 0, max: 10000, showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'gitCredentialSecretId', 'select', { options: (options.secrets || []).map((s) => ({ value: s.id, label: s.name })), showIf: (x) => x.kind === 'GitRepository' }),
    field('workspaces', t, 'files', 'objectList', {
      showIf: (x) => x.kind === 'Seeded',
      fields: [
        { name: 'path', type: 'text', label: t('resources.workspaces.fields.filePath'), required: true },
        { name: 'content', type: 'code', rows: 5, label: t('resources.workspaces.fields.fileContent') }
      ]
    }),
    field('workspaces', t, 'retention', 'select', { required: true, options: ENUMS.workspaceRetention }),
    field('workspaces', t, 'active', 'checkbox')
  ],
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (d.kind === 'GitRepository' && !d.gitUrl) e.gitUrl = t('common.errors.required');
    return e;
  }
};

export const artifactStoresConfig = {
  id: 'artifactStores',
  explainer: 'artifactStores',
  api: tenantApi('listArtifactStores', 'createArtifactStore', 'updateArtifactStore', 'deleteArtifactStore'),
  blank: () => ({ name: '', description: '', kind: 'Database', active: true }),
  columns: ({ t, i18n }) => [nameCol('artifactStores', t), col('artifactStores', t, 'kind', (r) => enumBadge(t, 'artifactStoreKind', r.kind)), col('artifactStores', t, 'description', (r) => r.description || '-'), activeCol('artifactStores', t), idCol('artifactStores', t), createdCol('artifactStores', t, i18n)],
  fields: (_d, { t }) => [
    field('artifactStores', t, 'name', 'text', { required: true }),
    field('artifactStores', t, 'kind', 'select', { required: true, options: ENUMS.artifactStoreKind }),
    field('artifactStores', t, 'description', 'textarea'),
    field('artifactStores', t, 'active', 'checkbox')
  ],
  validate: (d, t) => (!d.name ? { name: t('common.errors.required') } : null)
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
      field(id, t, 'kind', 'select', { required: true, options: ENUMS.agentKind }),
      field(id, t, 'agentVersion', 'text'),
      field(id, t, 'tags', 'stringList'),
      field(id, t, 'remoteProtocol', 'select', { options: ENUMS.remoteProtocol, optionLabel: (v) => t(`enums.remoteProtocol.${v}`, { defaultValue: v }), showIf: (x) => x.kind === 'Remote' }),
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
      field(id, t, 'inputMode', 'select', { required: true, options: ENUMS.agentInputMode }),
      field(id, t, 'inputSchemaJson', 'json', { showIf: (x) => x.inputMode === 'Structured' }),
      field(id, t, 'outputSchemaJson', 'json'),
      section(id, t, 'delegation'),
      field(id, t, 'delegationMode', 'select', { required: true, options: ENUMS.delegationMode }),
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
  detailPath: (r) => pathFor('agents', r.id)
};

export const deploymentsConfig = {
  id: 'deployments',
  explainer: 'deployments',
  explainerDiagram: () => <AgentRelationDiagram />,
  api: tenantApi('listDeployments', 'createDeployment', 'updateDeployment', 'deleteDeployment'),
  steps: ['basics', 'harness', 'prompts', 'resources', 'overrides', 'placement'],
  loadOptions: async ({ apiClient, tenantId }) => {
    const [agents, profiles, templates, secrets, mcpServers, workspaces, stores, pools] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listHarnessProfiles(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })),
      safeList(apiClient.listPromptTemplates(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })),
      safeList(apiClient.listSecrets(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listMcpServers(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listWorkspaceTemplates(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listArtifactStores(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listNodePools({ pageNumber: 1, pageSize: 1000 }))
    ]);
    return { agents, profiles, templates, secrets, mcpServers, workspaces, stores, pools };
  },
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
    retryOnNodeLoss: false,
    weight: 100,
    nodePoolId: null,
    workspaceTemplateId: null,
    artifactStoreId: null,
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
    active: true
  }),
  columns: ({ t, i18n }) => [
    nameCol('deployments', t),
    col('deployments', t, 'agentId', (r) => (r.agentName ? <span {...tip(r.agentId)}>{r.agentName}</span> : <CopyableId value={r.agentId} />), { cellClass: 'cell-id' }),
    col('deployments', t, 'harnessProfileId', (r) => <CopyableId value={r.harnessProfileId} />, { cellClass: 'cell-id' }),
    col('deployments', t, 'model', (r) => r.model || '-'),
    col('deployments', t, 'weight', (r) => r.weight, { cellClass: 'right' }),
    col('deployments', t, 'configVersion', (r) => r.configVersion, { cellClass: 'right', defaultHidden: true }),
    activeCol('deployments', t),
    idCol('deployments', t),
    createdCol('deployments', t, i18n)
  ],
  fields: (_d, { t, options }) => {
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
        fields: [
          { name: 'role', type: 'text', label: t('resources.deployments.fields.promptRole'), required: true },
          { name: 'templateId', type: 'select', label: t('resources.deployments.fields.template'), required: true, options: sel(options.templates) },
          { name: 'pinnedVersion', type: 'number', label: t('resources.deployments.fields.pinnedVersion'), min: 1 }
        ]
      }),
      field(id, t, 'resourceBindings', 'objectList', {
        step: 3,
        fields: [
          { name: 'kind', type: 'select', label: t('resources.deployments.fields.bindingKind'), required: true, options: ENUMS.resourceBindingKind },
          { name: 'alias', type: 'text', label: t('resources.deployments.fields.alias'), required: true },
          {
            name: 'resourceId',
            type: 'select',
            label: t('resources.deployments.fields.resource'),
            required: true,
            options: [...sel(options.secrets, (s) => `${t('enums.resourceBindingKind.Secret')}: ${s.name}`), ...sel(options.mcpServers, (m) => `${t('enums.resourceBindingKind.McpServer')}: ${m.name}`)]
          }
        ]
      }),
      field(id, t, 'workspaceTemplateId', 'select', { options: sel(options.workspaces), step: 3 }),
      field(id, t, 'artifactStoreId', 'select', { options: sel(options.stores), step: 3 }),
      field(id, t, 'argumentOverrides', 'objectList', {
        step: 4,
        ordered: true,
        fields: [
          { name: 'operation', type: 'select', label: t('resources.deployments.fields.operation'), required: true, options: ENUMS.argumentOverrideOperation },
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
          { name: 'baseDirectory', type: 'select', label: t('resources.harnessProfiles.fields.fileBase'), options: ENUMS.fileBaseDirectory, required: true },
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
          { name: 'validation', type: 'select', label: t('resources.deployments.fields.validation'), required: true, options: ENUMS.runOverrideValidation },
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
      field(id, t, 'timeoutSeconds', 'number', { min: 5, max: 86400, step: 5 }),
      field(id, t, 'maxAttempts', 'number', { min: 1, max: 10, step: 5 }),
      field(id, t, 'retryOnNodeLoss', 'checkbox', { step: 5 })
    ];
  },
  validate: (d, t) => {
    const e = {};
    if (!d.name) e.name = t('common.errors.required');
    if (!d.agentId) e.agentId = t('common.errors.required');
    if (!d.harnessProfileId) e.harnessProfileId = t('common.errors.required');
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
  blank: () => ({ name: '', description: '', tenants: [], active: true }),
  columns: ({ t, i18n }) => [
    nameCol('nodePools', t),
    col('nodePools', t, 'description', (r) => r.description || '-'),
    col('nodePools', t, 'tenants', (r) => ((r.tenants || []).length ? (r.tenants || []).join(', ') : t('resources.nodePools.allTenants'))),
    activeCol('nodePools', t),
    idCol('nodePools', t),
    createdCol('nodePools', t, i18n)
  ],
  fields: (_d, { t }) => [field('nodePools', t, 'name', 'text', { required: true }), field('nodePools', t, 'description', 'textarea'), field('nodePools', t, 'tenants', 'stringList'), field('nodePools', t, 'active', 'checkbox')],
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
  detailPath: (r) => pathFor('promptTemplates', r.id)
};
