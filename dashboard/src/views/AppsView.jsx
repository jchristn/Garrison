import ResourceView from '../components/ResourceView';
import { appsConfig } from './appConfigs';

/** Agentic apps (AD6.11): groups of agents behind one end-user chat UI, with their graph, delegation, and revisions. */
export default function AppsView() {
  return <ResourceView config={appsConfig} />;
}
