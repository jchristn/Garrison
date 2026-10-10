import { useMemo } from 'react';
import ResourceView from '../components/ResourceView';
import { controlNodesConfig } from './runConfigs';
import { useGrafana } from '../hooks/useServerInfo';
import { controlNodeDashboardUrl } from '../utils/grafana';

/**
 * Fleet > Control plane (P10.19): the control-plane replicas, read-only. With Grafana configured, each replica's
 * action menu opens the Garrison overview dashboard filtered to it (`var-node`).
 */
export default function ControlNodesView() {
  const grafana = useGrafana();
  const config = useMemo(() => {
    if (!grafana) return controlNodesConfig;
    return {
      ...controlNodesConfig,
      rowActions: (r, ctx) => {
        const href = controlNodeDashboardUrl(grafana, r.name);
        return [
          {
            label: ctx.t('resources.controlNodes.actions.grafana'),
            tip: ctx.t('tips.resources.controlNodes.actions.grafana', { node: r.name }),
            hidden: !href,
            onClick: () => window.open(href, '_blank', 'noopener,noreferrer')
          }
        ];
      }
    };
  }, [grafana]);
  return <ResourceView config={config} />;
}
