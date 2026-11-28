import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Tabs from '../Tabs';
import OrgUnitPanel from '../studio/canvas/OrgUnitPanel';

/**
 * The side panel of the organization designer (LP3.2 to LP3.6): for a selected unit, tabs for People (lead, members,
 * peer lines, and the unit actions of OrgUnitPanel, with `structure` above them), and the tabs the host adds (Keepers,
 * Budget, Rules) as [{ id, label, tip, content }]. A peer line or no selection shows OrgUnitPanel alone. The other
 * props pass through to OrgUnitPanel. initialTab opens a tab by id, and opens it again when it changes (the Design
 * tab's `?panel=`, which the Build a team tour uses to show the Keepers and Budget tabs it describes, UXP1-S026).
 */
export default function OrgDesignPanel({ unit, extraTabs = [], structure = null, initialTab = '', ...panelProps }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(initialTab || 'people');
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);
  const people = <OrgUnitPanel unit={unit} {...panelProps} />;
  if (!unit || !extraTabs.length) {
    return (
      <>
        {unit ? structure : null}
        {people}
      </>
    );
  }
  const tabs = [{ id: 'people', label: t('components.orgDesigner.tabs.people'), tip: t('tips.orgDesigner.tabs.people'), tour: 'org-unit-people' }, ...extraTabs.map(({ id, label, tip }) => ({ id, label, tip, tour: `org-unit-${id}` }))];
  const active = tabs.some((x) => x.id === tab) ? tab : 'people';
  return (
    <div className="org-design-panel" data-testid="org-design-panel" data-panel-tab={active}>
      <Tabs label={t('components.orgDesigner.tabs.label', { name: unit.name })} tabs={tabs} active={active} onChange={setTab} />
      {active === 'people' ? (
        <>
          {structure}
          {people}
        </>
      ) : (
        extraTabs.find((x) => x.id === active)?.content || null
      )}
    </div>
  );
}
