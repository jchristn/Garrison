import ResourceView from '../components/ResourceView';
import { memoryConfig } from './resourceConfigs';

/** Memory (AA4.13): the entries agents and people saved, by scope, with their provenance and text, under Autonomy. */
export default function MemoryView() {
  return <ResourceView config={memoryConfig} />;
}
