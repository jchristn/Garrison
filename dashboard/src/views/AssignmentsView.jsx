import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResourceView from '../components/ResourceView';
import Tabs from '../components/Tabs';
import { userAssignmentsConfig, credentialAssignmentsConfig } from './resourceConfigs';

/** Assignments page with tabs. */
export default function AssignmentsView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('userAssignments');
  return (
    <div>
      <Tabs
        label={t('nav.items.assignments.label')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'userAssignments', label: t('resources.userAssignments.title') },
          { id: 'credentialAssignments', label: t('resources.credentialAssignments.title') }
        ]}
      />
      {tab === 'userAssignments' ? <ResourceView key="userAssignments" config={userAssignmentsConfig} /> : <ResourceView key="credentialAssignments" config={credentialAssignmentsConfig} />}
    </div>
  );
}
