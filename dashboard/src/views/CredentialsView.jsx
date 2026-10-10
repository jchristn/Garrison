import ResourceView from '../components/ResourceView';
import { credentialsConfig } from './resourceConfigs';

/** Credentials page. */
export default function CredentialsView() {
  return <ResourceView config={credentialsConfig} />;
}
