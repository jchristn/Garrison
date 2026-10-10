import ResourceView from '../components/ResourceView';
import { auditConfig } from './runConfigs';

/** Audit page. */
export default function AuditView() {
  return <ResourceView config={auditConfig} />;
}
