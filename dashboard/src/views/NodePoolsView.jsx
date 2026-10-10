import ResourceView from '../components/ResourceView';
import { nodePoolsConfig } from './resourceConfigs';

/** NodePools page. */
export default function NodePoolsView() {
  return <ResourceView config={nodePoolsConfig} />;
}
