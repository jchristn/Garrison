import { useTranslation } from 'react-i18next';
import { tip } from '../../Tooltip';
import { edgeSentence, graphSummary } from '../../../utils/studioCanvas';

/**
 * The canvas in words (AD8.6), under the drawing: the counts and the entry agent, then each call as a button, which
 * is how calls are reached by keyboard (Enter selects the call, Delete disconnects it, F toggles fan-out). Agents of
 * the draft that belong to no app follow, each with a button that adds it to the app. The overview is the canvas's
 * description for screen readers.
 */
export default function CanvasOutline({ summaryId, flow, selection, blocked, onSelectEdge, onDisconnect, onToggleFanOut, onAddLoose }) {
  const { t } = useTranslation();
  const summary = graphSummary(t, flow);
  const onKeyDown = (event, edge) => {
    if (blocked) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onDisconnect(edge.id);
    } else if ((event.key === 'f' || event.key === 'F') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      onToggleFanOut(edge);
    }
  };
  return (
    <div className="studio-canvas-outline" data-testid="studio-canvas-outline">
      <p id={summaryId} className="studio-canvas-summary" data-testid="studio-canvas-summary">
        {summary.overview}
      </p>
      <div className="form-section-title" id={`${summaryId}-calls`} {...tip(t('tips.studio.canvas.calls'))}>
        {t('components.studio.canvas.calls', { total: flow.edges.length })}
      </div>
      {flow.edges.length === 0 ? (
        <div className="text-muted">{t('components.studio.canvas.noCalls')}</div>
      ) : (
        <ul className="studio-list" aria-labelledby={`${summaryId}-calls`}>
          {flow.edges.map((edge, i) => {
            const selected = selection?.type === 'edge' && selection.id === edge.id;
            return (
              <li key={edge.id}>
                <button
                  type="button"
                  className={`button-ghost button-sm studio-canvas-call${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => onSelectEdge(edge.id)}
                  onKeyDown={(e) => onKeyDown(e, edge)}
                  data-call={edge.id}
                  {...tip(blocked ? t('tips.studio.canvas.callReadOnly') : t('tips.studio.canvas.call'))}
                >
                  {summary.calls[i] || edgeSentence(t, edge)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {flow.loose.length > 0 && (
        <div className="studio-graph-loose">
          <div className="form-section-title" {...tip(t('tips.studio.graph.loose'))}>
            {t('components.studio.graph.loose')}
          </div>
          <ul className="studio-list">
            {flow.loose.map((name) => (
              <li key={name} data-loose={name} className="flex gap-sm items-center">
                <strong>{name}</strong>
                <button
                  type="button"
                  className="button-ghost button-sm"
                  onClick={() => !blocked && onAddLoose(name)}
                  aria-disabled={blocked ? 'true' : undefined}
                  data-testid={`studio-canvas-add-loose-${name}`}
                  {...tip(blocked || t('tips.studio.canvas.addLoose', { name, app: flow.app }))}
                >
                  {t('components.studio.canvas.addLoose')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
