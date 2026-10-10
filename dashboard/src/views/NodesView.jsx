import ResourceView from '../components/ResourceView';
import { nodesConfig } from './runConfigs';

/** Nodes page. */
export default function NodesView() {
  return <ResourceView config={nodesConfig} />;
}
