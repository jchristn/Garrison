import ResourceView from '../components/ResourceView';
import { secretsConfig } from './resourceConfigs';

/** Secrets page. */
export default function SecretsView() {
  return <ResourceView config={secretsConfig} />;
}
