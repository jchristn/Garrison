import ResourceView from '../components/ResourceView';
import { mcpServersConfig } from './resourceConfigs';

/** McpServers page. */
export default function McpServersView() {
  return <ResourceView config={mcpServersConfig} />;
}
