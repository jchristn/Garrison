import ResourceView from '../components/ResourceView';
import { freezesConfig } from './resourceConfigs';

/** Freezes (AA3.8): brakes on agents, deployments, keepers, and apps, and the kill switch, under Autonomy. */
export default function FreezesView() {
  return <ResourceView config={freezesConfig} />;
}
