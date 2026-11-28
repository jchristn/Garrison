import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import OrgCanvas from '../studio/canvas/OrgCanvas';
import OrgDesignPanel from './OrgDesignPanel';
import OrgUnitStructure from './OrgUnitStructure';
import OrgKeepersTab, { nextWakeText } from './OrgKeepersTab';
import OrgBudgetTab from './OrgBudgetTab';
import OrgRulesTab from './OrgRulesTab';
import ConfigFormModal from './ConfigFormModal';
import KeeperRevisionModal from '../KeeperRevisionModal';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { orgErrorMessage } from '../../utils/organizations';
import { changeRuleToForm } from '../../utils/changeRules';
import { permissionDenied } from '../../utils/permissions';
import { rulesForUnit, workingTreeOrgSource } from '../../utils/orgCanvasSource';

const asList = (r) => (Array.isArray(r) ? r : r?.items || []);

/**
 * The Design tab of Organization detail (LP3.2 to LP3.7): the organization canvas over the working tree, with the
 * people palette, live checks, Undo and Redo, and a unit panel with People, Keepers, Budget, and Rules tabs. Every
 * change goes through the working tree source, which uses the same unit routes and permissions as the chart editor;
 * nothing goes live until a revision is published from the page header. Change rules are only listed here and open
 * the existing rule editor (LP-007, AA-023). onReload() reads the organization again after a change.
 *
 * organization: GET /organizations/{id} (with units). options: { agents, mandates }. spend: GET /spend rows.
 * blocked: the reason editing is off (no Update permission, or a retired organization), or ''. forms: the ResourceView
 * configurations of the existing agent, keeper, and change rule forms ({ agents, keepers, changeRules }); the page
 * passes them in so this chunk does not import the views.
 */
export default function OrgDesigner({ organization, options = {}, spend = [], permissions = null, blocked = '', forms = {}, onReload }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const { apiClient, principal } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [opError, setOpError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [deployments, setDeployments] = useState(null);
  const [rules, setRules] = useState({ items: [], loading: true });
  const [modal, setModal] = useState(null);
  const queue = useRef(Promise.resolve());
  const lastError = useRef(null);

  const enqueue = useCallback((task) => {
    const next = queue.current.then(task, task);
    queue.current = next.catch(() => {});
    return next;
  }, []);

  const loadRules = useCallback(() => {
    if (!apiClient?.listChangeRules || !organization?.id) return;
    apiClient
      .listChangeRules(tenantId, { organization: organization.id, pageNumber: 1, pageSize: 1000 })
      .then((r) => setRules({ items: asList(r), loading: false }))
      .catch(() => setRules({ items: [], loading: false }));
  }, [apiClient, tenantId, organization?.id]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Deployments feed the keeper checks when the server has no validate route yet.
  useEffect(() => {
    if (!apiClient?.listDeployments) return undefined;
    let active = true;
    apiClient
      .listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => active && setDeployments(asList(r)))
      .catch(() => active && setDeployments(null));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  const agents = useMemo(() => options.agents || [], [options.agents]);
  const mandates = useMemo(() => options.mandates || [], [options.mandates]);
  const source = useMemo(
    () =>
      workingTreeOrgSource({
        apiClient,
        tenantId,
        organization,
        agents,
        mandates,
        deployments,
        enqueue,
        onChanged: () => {
          setOpError(null);
          return onReload?.();
        },
        onError: (error, operation) => {
          lastError.current = error;
          // A refused budget shows inline on the Budget tab; everything else here.
          if (operation !== 'SetBudget') setOpError({ error, operation });
        }
      }),
    [apiClient, tenantId, organization, agents, mandates, deployments, enqueue, onReload]
  );

  // A keeper badge with the next wake on each person whose position has a keeper attached (LP3.4).
  const decorations = useMemo(() => {
    const byId = new Map(mandates.map((m) => [m.id, m]));
    const out = {};
    for (const u of source.load().units) {
      const keepers = {};
      for (const p of u.people || []) if (p.mandateId) keepers[p.name] = nextWakeText(t, byId.get(p.mandateId) || { status: '' }, lng);
      out[u.name] = { keepers };
    }
    return out;
  }, [source, mandates, t, lng]);

  const ruleDenied = principal?.principalType === 'Run' ? t('components.orgDesigner.rules.runToken') : permissionDenied(t, permissions, 'ChangeRule', 'Create');
  const ruleEditDenied = principal?.principalType === 'Run' ? t('components.orgDesigner.rules.runToken') : permissionDenied(t, permissions, 'ChangeRule', 'Update');
  const mandateDenied = permissionDenied(t, permissions, 'Mandate', 'Create');
  const agentDenied = permissionDenied(t, permissions, 'Agent', 'Create');
  const rawUnits = organization?.units || [];

  const openNewAgent = (unit) => {
    if (agentDenied || blocked) return;
    setModal({ kind: 'agent', unit });
  };

  const renderPanel = ({ key, flow, organization: orgName, unit, perform, panelProps }) => {
    const structure = unit ? (
      <OrgUnitStructure
        key={`structure-${unit.name}-${unit.lead}-${unit.parent}`}
        flow={flow}
        unit={unit}
        choices={panelProps.choices}
        canLead
        canMove
        blocked={blocked}
        onSetLead={(agent, role) => perform('setLead', { organization: orgName, unit: unit.name, agent, role })}
        onMove={(parent) => perform('moveUnit', { organization: orgName, unit: unit.name, parent })}
      />
    ) : null;
    const extraTabs = unit
      ? [
          {
            id: 'keepers',
            label: t('components.orgDesigner.tabs.keepers'),
            tip: t('tips.orgDesigner.tabs.keepers'),
            content: (
              <OrgKeepersTab
                unit={unit}
                mandates={mandates}
                blocked={blocked}
                onAttach={(agent, mandateId) => perform('attachMandate', { organization: orgName, unit: unit.name, agent, mandateId })}
                onDetach={(agent) => perform('detachMandate', { organization: orgName, unit: unit.name, agent })}
                onCreate={(person) => !mandateDenied && setModal({ kind: 'keeper', unit: unit.name, person, perform, organization: orgName })}
                onEditSchedule={async (mandate) => {
                  try {
                    setModal({ kind: 'schedule', mandate: await apiClient.getMandate(tenantId, mandate.id) });
                  } catch (e) {
                    addToast({ type: 'error', message: orgErrorMessage(t, e) });
                  }
                }}
              />
            )
          },
          {
            id: 'budget',
            label: t('components.orgDesigner.tabs.budget'),
            tip: t('tips.orgDesigner.tabs.budget'),
            content: (
              <OrgBudgetTab
                key={`budget-${unit.name}-${JSON.stringify(unit.budgets || [])}`}
                unit={unit}
                units={rawUnits}
                spend={spend}
                blocked={blocked}
                onSave={async (period, amountUsd) => {
                  lastError.current = null;
                  const done = await perform('setBudget', { organization: orgName, unit: unit.name, period, amountUsd });
                  return done ? { ok: true } : { error: lastError.current };
                }}
              />
            )
          },
          {
            id: 'rules',
            label: t('components.orgDesigner.tabs.rules'),
            tip: t('tips.orgDesigner.tabs.rules'),
            content: (
              <OrgRulesTab
                unit={unit}
                rules={rulesForUnit(rules.items, rawUnits, unit.unitId)}
                loading={rules.loading}
                readOnly={ruleDenied}
                onAdd={() => setModal({ kind: 'rule', mode: 'create', initial: { organizationId: organization.id, unitId: unit.unitId } })}
                onEdit={(rule) => !ruleEditDenied && setModal({ kind: 'rule', mode: 'edit', initial: changeRuleToForm(rule) })}
              />
            )
          }
        ]
      : [];
    return <OrgDesignPanel key={key} {...panelProps} structure={structure} extraTabs={extraTabs} />;
  };

  return (
    <ReactFlowProvider>
      <div className="org-designer" data-testid="org-designer">
        <div className="sr-only" role="status" aria-live="polite" data-testid="org-designer-announce">
          {announcement}
        </div>
        {opError && (
          <div className="error-banner" role="alert" data-testid="org-designer-error">
            <div>
              <strong>{t('components.orgDesigner.failed', { change: t(`components.orgDesigner.operations.${opError.operation}`, { defaultValue: opError.operation }) })}</strong>
            </div>
            <div>{orgErrorMessage(t, opError.error)}</div>
            <button type="button" className="button-ghost button-sm" onClick={() => setOpError(null)} {...tip(t('tips.studio.canvas.dismissError'))}>
              {t('components.studio.items.conflict.dismiss')}
            </button>
          </div>
        )}
        <OrgCanvas
          source={source}
          scopeId={`org-${organization?.id || ''}`}
          blocked={blocked}
          palette
          decorations={decorations}
          renderPanel={renderPanel}
          onNewAgent={agentDenied || blocked ? null : openNewAgent}
          agents={agents}
          say={setAnnouncement}
        />
      </div>
      {modal?.kind === 'keeper' && forms.keepers && (
        <ConfigFormModal
          config={forms.keepers}
          testId="org-keeper-form"
          title={t('components.orgDesigner.keepers.createTitle', { name: modal.person.name })}
          initial={{ agentId: modal.person.agentId || '' }}
          onClose={() => setModal(null)}
          onSaved={async (created) => {
            const pending = modal;
            setModal(null);
            if (created?.id) await pending.perform('attachMandate', { organization: pending.organization, unit: pending.unit, agent: pending.person.name, mandateId: created.id });
            else onReload?.();
          }}
        />
      )}
      {modal?.kind === 'schedule' && <KeeperRevisionModal mandate={modal.mandate} onClose={() => setModal(null)} onSaved={() => onReload?.()} />}
      {modal?.kind === 'rule' && forms.changeRules && (
        <ConfigFormModal
          config={forms.changeRules}
          mode={modal.mode}
          testId="org-rule-form"
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadRules();
          }}
        />
      )}
      {modal?.kind === 'agent' && forms.agents && (
        <ConfigFormModal
          config={forms.agents}
          testId="org-agent-form"
          title={modal.unit ? t('components.orgDesigner.palette.newAgentTitle', { unit: modal.unit }) : undefined}
          onClose={() => setModal(null)}
          onSaved={async (created) => {
            const unit = modal.unit;
            setModal(null);
            await onReload?.();
            if (created?.name && unit) await source.addMember({ organization: organization.name, unit, agent: created.id || created.name, role: '' });
          }}
        />
      )}
    </ReactFlowProvider>
  );
}
