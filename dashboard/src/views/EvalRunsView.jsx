import ResourceView from '../components/ResourceView';
import { evalRunsConfig } from './resourceConfigs';

/** Eval runs (AA9.15): each run of an eval set against a deployment or an agent revision, under Autonomy. */
export default function EvalRunsView() {
  return <ResourceView config={evalRunsConfig} />;
}
