import ResourceView from '../components/ResourceView';
import { artifactStoresConfig } from './resourceConfigs';

/** ArtifactStores page. */
export default function ArtifactStoresView() {
  return <ResourceView config={artifactStoresConfig} />;
}
