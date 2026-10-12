import ResourceView from '../components/ResourceView';
import { approvalsConfig } from './runConfigs';

/** Approvals inbox (P12.3): tool calls waiting for a person, and the history of every decision. */
export default function ApprovalsView() {
  return <ResourceView config={approvalsConfig} />;
}
