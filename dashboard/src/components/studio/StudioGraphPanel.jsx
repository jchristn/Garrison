import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';

// React Flow, the YAML editor, and the panels load only when the Graph tab opens (their own `canvas` chunk).
const StudioCanvas = lazy(() => import('./canvas/StudioCanvas'));

/**
 * The draft's Graph tab (AD8.2): the interactive canvas, loaded on first use. Props pass through to StudioCanvas:
 * draft, graph, diff, blocked (the reason editing is off, '' when allowed), deployments (the tenant's), onGraph(graph)
 * after a graph operation, and onDraft(draft) after an item save or a fresh read.
 */
export default function StudioGraphPanel(props) {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <section className="panel studio-graph" aria-label={t('components.studio.canvas.title')} data-testid="studio-graph-loading">
          <div className="text-muted">{t('common.generic.loading')}</div>
        </section>
      }
    >
      <StudioCanvas {...props} />
    </Suspense>
  );
}
