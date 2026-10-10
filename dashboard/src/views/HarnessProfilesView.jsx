import ResourceView from '../components/ResourceView';
import { harnessProfilesConfig } from './resourceConfigs';

/** HarnessProfiles page. */
export default function HarnessProfilesView() {
  return <ResourceView config={harnessProfilesConfig} />;
}
