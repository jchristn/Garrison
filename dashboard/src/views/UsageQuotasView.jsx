import ResourceView from '../components/ResourceView';
import { usageQuotasConfig } from './resourceConfigs';

/** Daily usage quotas and accounting coverage. */
export default function UsageQuotasView() {
  return <ResourceView config={usageQuotasConfig} />;
}
