import ResourceView from '../components/ResourceView';
import { organizationsConfig } from './resourceConfigs';

/** Organizations (AA7.14): trees of units with leads, members, peer lines, and budgets, under Autonomy. */
export default function OrganizationsView() {
  return <ResourceView config={organizationsConfig} />;
}
