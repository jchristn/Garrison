import ResourceView from '../components/ResourceView';
import { pipelinesConfig } from './resourceConfigs';

/** Pipeline definitions (P12.9): ordered agent stages with optional review gates. */
export default function PipelinesView() {
  return <ResourceView config={pipelinesConfig} />;
}
