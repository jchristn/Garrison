import { useSearchParams } from 'react-router-dom';
import ResourceView from '../components/ResourceView';
import TriggerFiresModal from '../components/TriggerFiresModal';
import { triggersConfig } from './resourceConfigs';

/**
 * Triggers (P12.5): cron schedules and signed webhooks. `?fires=<triggerId>` opens that trigger's fire history, so a
 * run started by a trigger can link back to it.
 */
export default function TriggersView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fires = searchParams.get('fires');
  const close = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('fires');
    setSearchParams(next, { replace: true });
  };
  return (
    <>
      <ResourceView config={triggersConfig} />
      {fires && <TriggerFiresModal triggerId={fires} onClose={close} />}
    </>
  );
}
