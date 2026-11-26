import ResourceView from '../components/ResourceView';
import { evalSetsConfig } from './resourceConfigs';

/** Eval sets (AA9.15): versioned sets of cases that grade agents, under Autonomy. */
export default function EvalSetsView() {
  return <ResourceView config={evalSetsConfig} />;
}
