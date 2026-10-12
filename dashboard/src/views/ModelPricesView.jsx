import ResourceView from '../components/ResourceView';
import { modelPricesConfig } from './resourceConfigs';

/** Tenant-owned rates used when harnesses omit cost. */
export default function ModelPricesView() {
  return <ResourceView config={modelPricesConfig} />;
}
