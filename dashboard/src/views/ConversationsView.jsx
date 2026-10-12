import ResourceView from '../components/ResourceView';
import { conversationsConfig } from './runConfigs';

/** Conversations page: multi-turn exchanges with an agent, each turn a run (P12.1). */
export default function ConversationsView() {
  return <ResourceView config={conversationsConfig} />;
}
