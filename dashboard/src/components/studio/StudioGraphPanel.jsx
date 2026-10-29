import { useTranslation } from 'react-i18next';
import AgenticAppGraph from '../AgenticAppGraph';
import { Badge } from '../StatusBadge';
import { tip } from '../Tooltip';
import { agentNodes, graphApps } from '../../utils/studio';

/**
 * The draft as a read-only graph (AD7.10, from GET .../graph): one picture per app with its members laid out from the
 * entry agent, each call labelled with the delegation depth it needs (dashed when it allows one call at a time instead
 * of fan-out), and the capabilities each drafted agent names under its name. Agents in no app are listed below. The
 * interactive canvas is AD8.
 */
export default function StudioGraphPanel({ graph }) {
  const { t } = useTranslation();
  const { apps, loose } = graphApps(graph);
  const nodes = agentNodes(graph);
  const note = (name) => (nodes.get(name)?.capabilities || []).join(', ');
  const cls = (name) => {
    const n = nodes.get(name);
    if (!n) return '';
    if (n.deleted) return 'is-deleted';
    return n.inDraft ? 'is-drafted' : '';
  };
  const depth = (edge) => (edge.depth ? t('components.studio.graph.depth', { depth: edge.depth }) : null);

  return (
    <section className="panel studio-graph" aria-label={t('components.studio.graph.title')} data-testid="studio-graph">
      <h3 className="section-title" {...tip(t('tips.studio.graph.title'))}>
        {t('components.studio.graph.title')}
      </h3>
      {!graph ? (
        <div className="text-muted">{t('common.generic.loading')}</div>
      ) : apps.length === 0 && loose.length === 0 ? (
        <div className="text-muted" data-testid="studio-graph-empty">
          {t('components.studio.graph.empty')}
        </div>
      ) : (
        <>
          {apps.map((app) => (
            <div key={app.name} className="studio-graph-app" data-app={app.name}>
              <div className="inline-meta">
                <strong {...tip(t('tips.studio.graph.app'))}>{app.name}</strong>
                {app.deleted && (
                  <Badge tone="warning" tip={t('tips.studio.graph.deletedApp')}>
                    {t('components.studio.graph.deleted')}
                  </Badge>
                )}
                {!app.deleted && app.inDraft && (
                  <Badge tone="info" tip={t('tips.studio.graph.draftedApp')}>
                    {t('components.studio.graph.inDraft')}
                  </Badge>
                )}
                <span className="text-muted">{t('components.studio.graph.entryAgent', { name: app.entryAgentId || '-' })}</span>
              </div>
              <AgenticAppGraph app={app} edgeLabel={depth} nodeNote={note} nodeClass={cls} testId={`studio-graph-${app.name}`} />
            </div>
          ))}
          {loose.length > 0 && (
            <div className="studio-graph-loose">
              <div className="form-section-title" {...tip(t('tips.studio.graph.loose'))}>
                {t('components.studio.graph.loose')}
              </div>
              <ul className="studio-list">
                {loose.map((n) => (
                  <li key={n.key || n.name} data-loose={n.name}>
                    <strong>{n.name}</strong>
                    {n.deleted && (
                      <>
                        {' '}
                        <Badge tone="warning" tip={t('tips.studio.graph.deletedAgent')}>
                          {t('components.studio.graph.deleted')}
                        </Badge>
                      </>
                    )}
                    {(n.capabilities || []).length > 0 && <span className="text-muted"> {t('components.studio.graph.capabilities', { list: n.capabilities.join(', ') })}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="app-graph-legend text-muted">
            <span {...tip(t('tips.studio.graph.legend'))}>{t('components.studio.graph.legend')}</span>
          </div>
        </>
      )}
    </section>
  );
}
