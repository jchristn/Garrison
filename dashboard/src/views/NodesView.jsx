import { useMemo } from 'react';
import ResourceView from '../components/ResourceView';
import { nodesConfig } from './runConfigs';
import { useGrafana } from '../hooks/useServerInfo';
import { nodeDashboardUrl } from '../utils/grafana';

/** Nodes page. With Grafana configured, each node's action menu opens the Workers dashboard filtered to it (P13.15). */
export default function NodesView() {
  const grafana = useGrafana();
  const config = useMemo(() => {
    if (!grafana) return nodesConfig;
    return {
      ...nodesConfig,
      rowActions: (r, ctx) => {
        const href = nodeDashboardUrl(grafana, r.name);
        return [
          ...nodesConfig.rowActions(r, ctx),
          {
            label: ctx.t('resources.nodes.actions.grafana'),
            tip: ctx.t('tips.resources.nodes.actions.grafana', { node: r.name }),
            hidden: !href,
            onClick: () => window.open(href, '_blank', 'noopener,noreferrer')
          }
        ];
      }
    };
  }, [grafana]);
  return <ResourceView config={config} />;
}
