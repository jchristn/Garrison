import ResourceView from '../components/ResourceView';
import { deploymentsConfig } from './resourceConfigs';

/** Deployments page. */
export default function DeploymentsView() {
  return <ResourceView config={deploymentsConfig} />;
}
