import ResourceView from '../components/ResourceView';
import { agentAssetsConfig } from './resourceConfigs';

/** Agent assets (AD2.8): versioned files and prompts that agent revisions pin. */
export default function AgentAssetsView() {
  return <ResourceView config={agentAssetsConfig} />;
}
