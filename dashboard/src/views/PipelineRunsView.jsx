import ResourceView from '../components/ResourceView';
import { pipelineRunsConfig } from './runConfigs';

/** Pipeline runs (P12.9): every execution of a pipeline, filtered by status, pipeline, and time. */
export default function PipelineRunsView() {
  return <ResourceView config={pipelineRunsConfig} />;
}
