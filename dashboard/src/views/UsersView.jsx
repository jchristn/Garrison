import ResourceView from '../components/ResourceView';
import { usersConfig } from './resourceConfigs';

/** Users page. */
export default function UsersView() {
  return <ResourceView config={usersConfig} />;
}
