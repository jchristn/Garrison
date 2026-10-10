import ResourceView from '../components/ResourceView';
import { agentsConfig } from './resourceConfigs';

/** Agents page. */
export default function AgentsView() {
  return <ResourceView config={agentsConfig} />;
}
