import ResourceView from '../components/ResourceView';
import { reportsConfig } from './resourceConfigs';

/** Reports (AA5.10): what runs and people filed upward, with health, kind, author, and period, under Autonomy. */
export default function ReportsView() {
  return <ResourceView config={reportsConfig} />;
}
