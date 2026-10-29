import ResourceView from '../components/ResourceView';
import { architectsConfig } from './architectConfigs';

/** Agent architects: reusable deployments of agent-architect that any studio draft can use, with their prompts. */
export default function ArchitectsView() {
  return <ResourceView config={architectsConfig} />;
}
