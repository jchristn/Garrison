import ResourceView from '../components/ResourceView';
import { promptTemplatesConfig } from './resourceConfigs';

/** Prompt template list; rows open the editor. */
export default function PromptTemplatesView() {
  return <ResourceView config={promptTemplatesConfig} />;
}
