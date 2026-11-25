import ResourceView from '../components/ResourceView';
import { keepersConfig } from './resourceConfigs';

/** Keepers (AA1.16): mandates an agent keeps on a wake schedule, under Autonomy. Rows open the keeper's page. */
export default function KeepersView() {
  return <ResourceView config={keepersConfig} />;
}
