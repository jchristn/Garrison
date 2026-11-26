import ResourceView from '../components/ResourceView';
import { changeRulesConfig } from './resourceConfigs';

/** Change rules (AA8.12): what people pre-approve for an organization's executives, under Autonomy. */
export default function ChangeRulesView() {
  return <ResourceView config={changeRulesConfig} />;
}
