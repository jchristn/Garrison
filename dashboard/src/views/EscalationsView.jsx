import ResourceView from '../components/ResourceView';
import { escalationsConfig } from './resourceConfigs';

/** Escalations (AA2.13): questions runs raised for a person, a role, or another agent, under Autonomy. */
export default function EscalationsView() {
  return <ResourceView config={escalationsConfig} />;
}
