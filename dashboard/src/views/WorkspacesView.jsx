import ResourceView from '../components/ResourceView';
import { workspacesConfig } from './resourceConfigs';

/** Workspaces page. */
export default function WorkspacesView() {
  return <ResourceView config={workspacesConfig} />;
}
