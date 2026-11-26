import ResourceView from '../components/ResourceView';
import { canaryReleasesConfig } from './resourceConfigs';

/** Canary releases (AA9.15): a candidate deployment takes a rising share of traffic in steps, under Autonomy. */
export default function CanaryReleasesView() {
  return <ResourceView config={canaryReleasesConfig} />;
}
