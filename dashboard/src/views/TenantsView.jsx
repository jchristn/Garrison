import ResourceView from '../components/ResourceView';
import { tenantsConfig } from './resourceConfigs';

/** Tenants page. */
export default function TenantsView() {
  return <ResourceView config={tenantsConfig} />;
}
