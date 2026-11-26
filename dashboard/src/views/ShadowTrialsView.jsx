import ResourceView from '../components/ResourceView';
import { shadowTrialsConfig } from './resourceConfigs';

/** Shadow trials (AA9.15): a candidate deployment replays a share of a deployment's runs without acting, under Autonomy. */
export default function ShadowTrialsView() {
  return <ResourceView config={shadowTrialsConfig} />;
}
