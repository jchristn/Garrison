import ResourceView from '../components/ResourceView';
import { notificationEndpointsConfig } from './resourceConfigs';

/** Notification endpoints (P12.14): signed webhooks about runs, pipeline runs, and approvals. */
export default function NotificationsView() {
  return <ResourceView config={notificationEndpointsConfig} />;
}
