// ResourceView configurations for triggers (P12.5, Agents > Triggers) and notification endpoints (P12.14,
// Configuration > Notifications). Re-exported by resourceConfigs.jsx so the configuration-wide tests (tooltips, i18n
// keys, enum labels) cover them.

import CopyableId from '../components/CopyableId';
import CopyButton from '../components/CopyButton';
import ConfirmModal from '../components/ConfirmModal';
import SigningSecretModal from '../components/SigningSecretModal';
import TriggerFireModal from '../components/TriggerFireModal';
import TriggerFiresModal from '../components/TriggerFiresModal';
import NotificationDeliveriesModal from '../components/NotificationDeliveriesModal';
import NotificationTestModal from '../components/NotificationTestModal';
import { TriggerFireOutcomeBadge } from '../components/TriggerBadges';
import { ActiveBadge } from '../components/StatusBadge';
import { tip } from '../components/Tooltip';
import { ENUMS, SUBSCRIBABLE_NOTIFICATION_EVENTS, TRIGGER_LIMITS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip, enumTip, optionalText } from '../utils/tips';
import { enumLabel, enumList } from '../utils/enums';
import {
  blankTrigger,
  triggerToForm,
  triggerToBody,
  triggerDuplicate,
  triggerErrors,
  webhookUrl,
  blankEndpoint,
  endpointToForm,
  endpointToBody,
  endpointDuplicate,
  endpointErrors,
  SIGNATURE_FORMAT,
  WEBHOOK_HEADERS
} from '../utils/triggers';

function col(id, t, key, render, extra = {}) {
  return { key, label: t(`resources.${id}.columns.${key}`), tip: resourceTip(t, id, key), render, ...extra };
}

function field(id, t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${id}.hints.${name}`, extra.hintValues);
  return { name, type, label: t(`resources.${id}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, id, name), ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');
const enumOpts = (t, group, values) => values.map((v) => ({ value: v, label: enumLabel(t, group, v) }));

/** Ask before replacing a signing secret, then show the new one once. */
function openRotate(ctx, record, kind) {
  const { t } = ctx;
  const id = kind === 'triggers' ? 'triggers' : 'notifications';
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <ConfirmModal
      open
      danger
      title={t(`resources.${id}.confirmRotateTitle`)}
      message={t(`resources.${id}.confirmRotate`, { name: record.name })}
      confirmLabel={t(`resources.${id}.actions.rotateSecret`)}
      confirmTip={t(`tips.resources.${id}.actions.rotateSecret`)}
      onCancel={close}
      onConfirm={async () => {
        try {
          const result = kind === 'triggers' ? await ctx.apiClient.rotateTriggerSecret(ctx.tenantId, record.id) : await ctx.apiClient.rotateNotificationEndpointSecret(ctx.tenantId, record.id);
          ctx.reload?.();
          const url = kind === 'triggers' ? webhookUrl(ctx.apiClient?.baseUrl, ctx.tenantId, record.id) : null;
          ctx.setExtraModal(<SigningSecretModal secret={result?.signingSecret} name={record.name} url={url} onClose={close} />);
        } catch (e) {
          close();
          ctx.addToast({ type: 'error', message: errorMessage(t, e) });
        }
      }}
    />
  );
}

/** The webhook URL and signature scheme of a saved webhook trigger, shown in its form. */
function WebhookInfo({ data, t, ctx }) {
  if (!data?.id) return <div className="field-hint" data-testid="trigger-webhook-pending">{t('resources.triggers.hints.webhookNew')}</div>;
  const url = webhookUrl(ctx.apiClient?.baseUrl, ctx.tenantId, data.id);
  return (
    <div data-testid="trigger-webhook-info">
      <label {...tip(t('tips.resources.triggers.webhook'))}>{t('resources.triggers.fields.webhook')}</label>
      <div className="secret-row">
        <code data-testid="trigger-webhook-url">{url}</code>
        <CopyButton value={url} tipText={t('tips.signingSecret.copyUrl')} />
      </div>
      <div className="field-hint">
        {t('components.signingSecret.scheme', { header: WEBHOOK_HEADERS.signature, format: SIGNATURE_FORMAT, delivery: WEBHOOK_HEADERS.delivery })}
        {data.signingSecretLast4 ? ` ${t('resources.triggers.secretEnding', { last4: data.signingSecretLast4 })}` : ''}
      </div>
    </div>
  );
}

/**
 * Triggers (P12.5): a cron schedule or a signed webhook that starts an agent run or a pipeline run. Row actions fire it
 * now, show its fire history, list the runs it started, and rotate a webhook trigger's signing secret.
 */
export const triggersConfig = {
  id: 'triggers',
  explainer: 'triggers',
  formSize: 'large',
  autoRefresh: 30,
  urlFilters: ['type'],
  api: {
    list: (c, tenant, p) => c.listTriggers(tenant, p),
    create: (c, tenant, b) => c.createTrigger(tenant, b),
    update: (c, tenant, id, b) => c.updateTrigger(tenant, id, b),
    remove: (c, tenant, id) => c.deleteTrigger(tenant, id)
  },
  filters: [{ name: 'type', label: (t) => t('resources.triggers.columns.type'), options: ENUMS.triggerType, enumGroup: 'triggerType' }],
  // Agent and pipeline names for the target column.
  loadLookups: async ({ apiClient, tenantId }) => {
    const [agents, pipelines] = await Promise.all([safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })), safeList(apiClient.listPipelines(tenantId, { pageNumber: 1, pageSize: 1000 }))]);
    return { agents: Object.fromEntries(agents.map((a) => [a.id, a.displayName || a.name])), pipelines: Object.fromEntries(pipelines.map((p) => [p.id, p.name])) };
  },
  // Pick lists: agents, deployments (filtered by the chosen agent), pipelines, and Task templates for the input.
  loadOptions: async ({ apiClient, tenantId }) => {
    const [agents, deployments, pipelines, templates] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listPipelines(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listPromptTemplates(tenantId, { pageNumber: 1, pageSize: 1000, kind: 'Task' }))
    ]);
    return { agents, deployments, pipelines, templates };
  },
  blank: () => blankTrigger(),
  toForm: (r) => triggerToForm(r),
  toDuplicate: (r) => triggerDuplicate(r),
  toBody: (d) => triggerToBody(d),
  validate: (d, t) => triggerErrors(d, t),
  afterCreate: (result, ctx) => {
    if (result?.signingSecret) {
      ctx.setExtraModal(<SigningSecretModal secret={result.signingSecret} name={result.name} url={webhookUrl(ctx.apiClient?.baseUrl, ctx.tenantId, result.id)} onClose={() => ctx.setExtraModal(null)} />);
    }
  },
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const target = (r) => (r.targetType === 'Pipeline' ? lookups?.pipelines?.[r.pipelineId] || r.pipelineId : lookups?.agents?.[r.agentId] || r.agentId);
    return [
      col('triggers', t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col('triggers', t, 'type', (r) => <span {...tip(enumTip(t, 'triggerType', r.type))}>{enumLabel(t, 'triggerType', r.type)}</span>, { csv: (r) => r.type || '' }),
      col('triggers', t, 'target', (r) => (
        <span {...tip(enumTip(t, 'triggerTargetType', r.targetType))}>
          {enumLabel(t, 'triggerTargetType', r.targetType)}: <strong>{target(r) || '-'}</strong>
        </span>
      ), { csv: (r) => `${r.targetType}:${target(r) || ''}` }),
      col('triggers', t, 'schedule', (r) =>
        r.type === 'Webhook' ? (
          <span className="text-muted">{t('resources.triggers.webhookSchedule')}</span>
        ) : (
          <span className="inline-meta">
            <code>{r.cronExpression || '-'}</code> <span className="text-muted">{r.timeZone || 'UTC'}</span>
          </span>
        ),
      { csv: (r) => (r.type === 'Webhook' ? 'webhook' : `${r.cronExpression || ''} ${r.timeZone || 'UTC'}`) }),
      col('triggers', t, 'active', (r) => <ActiveBadge active={r.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(r.active ? 'tips.badges.active' : 'tips.badges.inactive')} />),
      col('triggers', t, 'lastFire', (r) =>
        r.lastFireUtc ? (
          <span className="inline-meta">
            {when(r.lastFireUtc, lng)} <TriggerFireOutcomeBadge outcome={r.lastFireOutcome} t={t} />
          </span>
        ) : (
          <span className="text-muted">{t('resources.triggers.neverFired')}</span>
        ),
      { cellClass: 'nowrap', csv: (r) => `${r.lastFireUtc || ''} ${r.lastFireOutcome || ''}`.trim() }),
      col('triggers', t, 'nextFireUtc', (r) => (r.type === 'Cron' && r.active && r.nextFireUtc ? when(r.nextFireUtc, lng) : '-'), { cellClass: 'nowrap', csv: (r) => r.nextFireUtc || '' }),
      col('triggers', t, 'fireCount', (r) => formatNumber(r.fireCount ?? 0, {}, lng), { cellClass: 'right', defaultHidden: true, csv: (r) => r.fireCount ?? 0 }),
      col('triggers', t, 'runAs', (r) => (r.runAsName || r.runAsId ? `${r.runAsName || r.runAsId} (${enumLabel(t, 'principalType', r.runAsType)})` : '-'), { defaultHidden: true, csv: (r) => r.runAsName || r.runAsId || '' }),
      col('triggers', t, 'signingSecretLast4', (r) => (r.signingSecretLast4 ? <code>{`****${r.signingSecretLast4}`}</code> : '-'), { defaultHidden: true, csv: (r) => r.signingSecretLast4 || '' }),
      col('triggers', t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col('triggers', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true }),
      col('triggers', t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' })
    ];
  },
  fields: (d, ctx) => {
    const { t, options, mode } = ctx;
    const id = 'triggers';
    const agents = options?.agents || [];
    const deployments = (options?.deployments || []).filter((x) => !d?.agentId || x.agentId === d.agentId);
    return [
      field(id, t, 'name', 'text', { required: true }),
      field(id, t, 'type', 'select', { required: true, options: enumOpts(t, 'triggerType', ENUMS.triggerType), readOnly: mode !== 'create' }),
      field(id, t, 'description', 'textarea', { rows: 2 }),
      field(id, t, 'targetType', 'select', { required: true, options: enumOpts(t, 'triggerTargetType', ENUMS.triggerTargetType) }),
      field(id, t, 'agentId', 'select', { required: true, options: agents.map((a) => ({ value: a.id, label: a.displayName || a.name })), showIf: (x) => x?.targetType !== 'Pipeline' }),
      field(id, t, 'deploymentId', 'select', { options: deployments.map((x) => ({ value: x.id, label: x.name })), noneLabel: t('resources.triggers.anyDeployment'), showIf: (x) => x?.targetType !== 'Pipeline' }),
      field(id, t, 'pipelineId', 'select', { required: true, options: (options?.pipelines || []).map((p) => ({ value: p.id, label: p.name })), showIf: (x) => x?.targetType === 'Pipeline' }),
      field(id, t, 'inputTemplateId', 'select', { options: (options?.templates || []).map((p) => ({ value: p.id, label: p.name })), noneLabel: t('resources.triggers.builtinTemplate') }),
      field(id, t, 'priority', 'number', { min: TRIGGER_LIMITS.priority.min, max: TRIGGER_LIMITS.priority.max, hintValues: TRIGGER_LIMITS.priority }),
      field(id, t, 'cronExpression', 'text', { required: true, placeholder: '0 9 * * 1-5', showIf: (x) => x?.type !== 'Webhook' }),
      field(id, t, 'timeZone', 'text', { placeholder: 'UTC', showIf: (x) => x?.type !== 'Webhook' }),
      field(id, t, 'active', 'checkbox'),
      {
        ...field(id, t, 'webhook', 'custom'),
        showIf: (x) => x?.type === 'Webhook',
        render: (data) => <WebhookInfo data={data} t={t} ctx={ctx} />
      }
    ];
  },
  formNotice: (d, { t }) =>
    d?.runAsName || d?.runAsId ? (
      <div className="info-banner" role="status" data-testid="trigger-run-as-notice">
        {t('resources.triggers.runAsNotice', { name: d.runAsName || d.runAsId })}
      </div>
    ) : null,
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.triggers.actions.fire'), tip: ctx.t('tips.resources.triggers.actions.fire'), onClick: () => ctx.setExtraModal(<TriggerFireModal trigger={r} onClose={() => ctx.setExtraModal(null)} onFired={() => ctx.reload?.()} />) },
    { label: ctx.t('resources.triggers.actions.fires'), tip: ctx.t('tips.resources.triggers.actions.fires'), onClick: () => ctx.setExtraModal(<TriggerFiresModal triggerId={r.id} triggerName={r.name} onClose={() => ctx.setExtraModal(null)} />) },
    { label: ctx.t('resources.triggers.actions.runs'), tip: ctx.t('tips.resources.triggers.actions.runs'), onClick: () => ctx.navigate(pathFor('runs', null, { triggerId: r.id })) },
    { label: ctx.t('resources.triggers.actions.rotateSecret'), tip: ctx.t('tips.resources.triggers.actions.rotateSecret'), hidden: r.type !== 'Webhook', onClick: () => openRotate(ctx, r, 'triggers') }
  ]
};

/**
 * Notification endpoints (P12.14): webhook URLs that receive signed notifications about runs, pipeline runs, and
 * approvals. Row actions send a test notification, open the delivery log, and rotate the signing secret.
 */
export const notificationEndpointsConfig = {
  id: 'notifications',
  explainer: 'notifications',
  formSize: 'large',
  api: {
    list: (c, tenant, p) => c.listNotificationEndpoints(tenant, p),
    create: (c, tenant, b) => c.createNotificationEndpoint(tenant, b),
    update: (c, tenant, id, b) => c.updateNotificationEndpoint(tenant, id, b),
    remove: (c, tenant, id) => c.deleteNotificationEndpoint(tenant, id)
  },
  loadLookups: async ({ apiClient, tenantId }) => {
    const [agents, deployments] = await Promise.all([safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })), safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 }))]);
    return { agents: Object.fromEntries(agents.map((a) => [a.id, a.displayName || a.name])), deployments: Object.fromEntries(deployments.map((x) => [x.id, x.name])) };
  },
  loadOptions: async ({ apiClient, tenantId }) => {
    const [agents, deployments] = await Promise.all([safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })), safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 }))]);
    return { agents, deployments };
  },
  blank: () => blankEndpoint(),
  toForm: (r) => endpointToForm(r),
  toDuplicate: (r) => endpointDuplicate(r),
  toBody: (d) => endpointToBody(d),
  validate: (d, t) => endpointErrors(d, t),
  afterCreate: (result, ctx) => {
    if (result?.signingSecret) ctx.setExtraModal(<SigningSecretModal secret={result.signingSecret} name={result.name} onClose={() => ctx.setExtraModal(null)} />);
  },
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const filterText = (r) =>
      [r.agentId ? `${t('resources.notifications.columns.agent')}: ${lookups?.agents?.[r.agentId] || r.agentId}` : null, r.deploymentId ? `${t('resources.notifications.columns.deployment')}: ${lookups?.deployments?.[r.deploymentId] || r.deploymentId}` : null].filter(Boolean).join(', ');
    return [
      col('notifications', t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col('notifications', t, 'url', (r) => <span className="cell-id" {...tip(r.url)}>{truncate(r.url, 60)}</span>, { csv: (r) => r.url || '' }),
      col('notifications', t, 'events', (r) => <span {...tip(enumList(t, 'notificationEvent', r.events || []))}>{t('resources.notifications.eventCount', { count: (r.events || []).length })}</span>, { csv: (r) => (r.events || []).join(' ') }),
      col('notifications', t, 'filters', (r) => filterText(r) || <span className="text-muted">{t('resources.notifications.noFilter')}</span>, { csv: (r) => filterText(r) }),
      col('notifications', t, 'active', (r) => <ActiveBadge active={r.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(r.active ? 'tips.badges.active' : 'tips.badges.inactive')} />),
      col('notifications', t, 'signingSecretLast4', (r) => (r.signingSecretLast4 ? <code>{`****${r.signingSecretLast4}`}</code> : '-'), { csv: (r) => r.signingSecretLast4 || '' }),
      col('notifications', t, 'includeResultText', (r) => (r.includeResultText ? t('resources.notifications.resultTextUpTo', { count: r.resultTextMaxChars ?? 0 }) : t('common.boolean.no')), { defaultHidden: true, csv: (r) => (r.includeResultText ? r.resultTextMaxChars : 0) }),
      col('notifications', t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col('notifications', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true }),
      col('notifications', t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' })
    ];
  },
  fields: (d, { t, options }) => {
    const id = 'notifications';
    const deployments = (options?.deployments || []).filter((x) => !d?.agentId || x.agentId === d.agentId);
    return [
      field(id, t, 'name', 'text', { required: true }),
      field(id, t, 'url', 'text', { required: true, placeholder: 'https://hooks.example.com/garrison' }),
      field(id, t, 'description', 'textarea', { rows: 2 }),
      field(id, t, 'events', 'multiselect', { required: true, options: enumOpts(t, 'notificationEvent', SUBSCRIBABLE_NOTIFICATION_EVENTS) }),
      field(id, t, 'agentId', 'select', { options: (options?.agents || []).map((a) => ({ value: a.id, label: a.displayName || a.name })), noneLabel: t('resources.notifications.anyAgent') }),
      field(id, t, 'deploymentId', 'select', { options: deployments.map((x) => ({ value: x.id, label: x.name })), noneLabel: t('resources.notifications.anyDeployment') }),
      field(id, t, 'includeResultText', 'checkbox'),
      field(id, t, 'resultTextMaxChars', 'number', { min: TRIGGER_LIMITS.resultTextMaxChars.min, max: TRIGGER_LIMITS.resultTextMaxChars.max, hintValues: TRIGGER_LIMITS.resultTextMaxChars, showIf: (x) => !!x?.includeResultText }),
      field(id, t, 'active', 'checkbox')
    ];
  },
  formNotice: (d, { t, i18n }) =>
    d?.signingSecretLast4 ? (
      <div className="info-banner" role="status" data-testid="notification-secret-notice">
        {t('resources.notifications.secretNotice', { last4: d.signingSecretLast4, time: d.signingSecretRotatedUtc ? formatDateTime(d.signingSecretRotatedUtc, i18n.language) : '-' })}
      </div>
    ) : null,
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.notifications.actions.test'), tip: ctx.t('tips.resources.notifications.actions.test'), onClick: () => ctx.setExtraModal(<NotificationTestModal endpoint={r} onClose={() => ctx.setExtraModal(null)} />) },
    { label: ctx.t('resources.notifications.actions.deliveries'), tip: ctx.t('tips.resources.notifications.actions.deliveries'), onClick: () => ctx.setExtraModal(<NotificationDeliveriesModal endpoint={r} onClose={() => ctx.setExtraModal(null)} />) },
    { label: ctx.t('resources.notifications.actions.rotateSecret'), tip: ctx.t('tips.resources.notifications.actions.rotateSecret'), onClick: () => openRotate(ctx, r, 'notifications') }
  ]
};
