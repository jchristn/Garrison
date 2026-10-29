import ResourceView from '../components/ResourceView';
import { capabilitiesConfig } from './resourceConfigs';

/** Capability catalog (AD4.8): agents, MCP tools, and harness built-ins an orchestrating agent can use. */
export default function CapabilitiesView() {
  return <ResourceView config={capabilitiesConfig} />;
}
