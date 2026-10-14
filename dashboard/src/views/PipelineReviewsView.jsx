import ResourceView from '../components/ResourceView';
import { pipelineReviewsConfig } from './runConfigs';

/** Stage reviews (P12.9): pipeline stages waiting for a person, and every decision made on them. */
export default function PipelineReviewsView() {
  return <ResourceView config={pipelineReviewsConfig} />;
}
