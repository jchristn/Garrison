import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import FormFields from './FormFields';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ORGANIZATION_LIMITS } from '../utils/constants';
import { blankUnit, descendantIds, orgErrorMessage, unitFormErrors, unitFormToBody, unitToForm } from '../utils/organizations';

const label = (t, name) => t(`organizations.unit.fields.${name}`);
const tipOf = (t, name) => t(`tips.organizations.unit.fields.${name}`);

/**
 * The unit editor's fields: name and description, the parent, the lead (agent, title, and mandate), the app, the
 * members (agent, title, mandate each), peer lines to other units, and Day and Month budgets. options: { agents,
 * mandates, apps } as [{ id, name, agentId? }]. A unit cannot be its own parent or sit below one of its own children,
 * so those are left out of the parent list.
 */
export function unitFields(t, form, { units = [], options = {}, unitId = null } = {}) {
  const agents = (options.agents || []).map((a) => ({ value: a.id, label: a.displayName || a.name || a.id }));
  const mandatesOf = (agentId) => (options.mandates || []).filter((m) => !agentId || m.agentId === agentId).map((m) => ({ value: m.id, label: m.name || m.id }));
  const apps = (options.apps || []).map((a) => ({ value: a.id, label: a.displayName || a.name || a.id }));
  const below = unitId ? descendantIds(units, unitId) : new Set();
  const others = units.filter((u) => u.id !== unitId);
  const parents = others.filter((u) => !below.has(u.id)).map((u) => ({ value: u.id, label: u.name }));
  const f = (name, type, extra = {}) => ({ name, type, label: label(t, name), tip: tipOf(t, name), ...extra });
  const section = (name) => ({ name: `section_${name}`, type: 'section', label: t(`organizations.unit.sections.${name}`), tip: t(`tips.organizations.unit.sections.${name}`) });
  const hasLead = (d) => !!d?.leadAgentId;
  return [
    f('name', 'text', { required: true, placeholder: t('organizations.unit.namePlaceholder') }),
    f('parentUnitId', 'select', { options: parents, noneLabel: t('organizations.unit.noParent') }),
    f('description', 'textarea', { rows: 2 }),
    section('lead'),
    f('leadAgentId', 'select', { options: agents, noneLabel: t('organizations.unit.noLead') }),
    f('leadTitle', 'text', { showIf: hasLead, placeholder: t('organizations.unit.titlePlaceholder') }),
    f('leadMandateId', 'select', { showIf: hasLead, options: mandatesOf(form?.leadAgentId), noneLabel: t('organizations.unit.noMandate') }),
    f('appId', 'select', { options: apps, noneLabel: t('organizations.unit.noApp') }),
    section('members'),
    f('members', 'objectList', {
      addLabel: t('organizations.unit.addMember'),
      fields: [
        { name: 'agentId', type: 'select', required: true, label: label(t, 'memberAgent'), tip: tipOf(t, 'memberAgent'), options: agents },
        { name: 'title', type: 'text', label: label(t, 'memberTitle'), tip: tipOf(t, 'memberTitle'), placeholder: t('organizations.unit.titlePlaceholder') },
        { name: 'mandateId', type: 'select', label: label(t, 'memberMandate'), tip: tipOf(t, 'memberMandate'), noneLabel: t('organizations.unit.noMandate'), options: (row) => mandatesOf(row?.agentId) }
      ]
    }),
    f('peerUnitIds', 'multiselect', { options: others.map((u) => ({ value: u.id, label: u.name })), hint: others.length ? undefined : t('organizations.unit.noPeers') }),
    section('budgets'),
    f('budgetDay', 'number', { min: 0.01, step: 0.01, placeholder: t('organizations.unit.noBudget') }),
    f('budgetMonth', 'number', { min: 0.01, step: 0.01, placeholder: t('organizations.unit.noBudget') })
  ];
}

/**
 * Add or edit a unit of an organization's working tree (AA7.14). unit is null to add one (below parentUnitId when
 * given). Nothing goes live until a revision is published. A tree rule refusal (409) stays in the dialog with its
 * explanation and the server's detail. onSaved(unit) receives the stored unit.
 */
export default function OrgUnitModal({ organization, units = [], unit = null, parentUnitId = null, options = {}, onClose, onSaved }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [form, setForm] = useState(() => (unit ? unitToForm(unit) : blankUnit(parentUnitId)));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const editing = !!unit;

  const change = (next) => {
    // A new lead may hold other mandates: drop a mandate that belongs to the previous lead.
    if (next.leadAgentId !== form.leadAgentId) next = { ...next, leadMandateId: null };
    const members = (next.members || []).map((m, i) => (form.members?.[i] && m.agentId !== form.members[i].agentId ? { ...m, mandateId: '' } : m));
    setForm({ ...next, members });
    setErrors({});
  };

  const submit = async () => {
    const found = unitFormErrors(form, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const body = unitFormToBody(form);
      const saved = editing ? await apiClient.updateOrgUnit(tenantId, organization.id, unit.id, body) : await apiClient.createOrgUnit(tenantId, organization.id, body);
      addToast({ type: 'success', message: t(editing ? 'organizations.toasts.unitSaved' : 'organizations.toasts.unitAdded', { name: saved?.name || body.name }) });
      onSaved?.(saved || null);
    } catch (e) {
      setError(orgErrorMessage(t, e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose?.()}
      title={editing ? t('organizations.unit.editTitle', { name: unit.name }) : t('organizations.unit.addTitle')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="org-unit-save" {...tip(t('tips.organizations.unit.save'))}>
            {busy ? t('organizations.unit.saving') : t(editing ? 'common.actions.save' : 'organizations.unit.add')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md org-unit-form" data-testid="org-unit-form">
        <p className="text-muted">{t('organizations.unit.intro', { max: ORGANIZATION_LIMITS.nameMax })}</p>
        <FormFields idPrefix="org-unit" fields={unitFields(t, form, { units, options, unitId: unit?.id || null })} data={form} onChange={change} errors={errors} disabled={busy} />
        {error && (
          <div className="error-banner" role="alert" data-testid="org-unit-error">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
