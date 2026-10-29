import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../../Tooltip';
import { formatNumber } from '../../../i18n/formatters';

/**
 * Properties of the selected call (AD8.3): caller and callee, whether the caller may fan out to it (parallel calls)
 * or call it one at a time, and the delegation depth it needs. Depth is derived (one plus the longest chain of calls
 * below the callee), so it is shown, not edited. Fan-out changes at once with a Connect operation.
 */
export default function EdgePanel({ edge, blocked, onFanOut, onDisconnect }) {
  const { t, i18n } = useTranslation();
  // The box follows the click at once; the graph that comes back from the server settles it.
  const [pending, setPending] = useState(null);
  const fanOut = pending ?? edge.fanOut;
  const toggle = async (value) => {
    setPending(value);
    try {
      await onFanOut(edge.id, value);
    } finally {
      setPending(null);
    }
  };
  return (
    <div className="studio-canvas-props" data-testid="studio-edge-panel" data-edge-panel={edge.id}>
      <h4 className="section-title" {...tip(t('tips.studio.canvas.edge.title'))}>
        {t('components.studio.canvas.edge.title', { from: edge.from, to: edge.to })}
      </h4>
      <div className="detail-grid">
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.studio.canvas.edge.from'))}>
            {t('components.studio.canvas.edge.from')}
          </div>
          <div className="detail-item-value">{edge.from}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.studio.canvas.edge.to'))}>
            {t('components.studio.canvas.edge.to')}
          </div>
          <div className="detail-item-value">{edge.to}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.studio.canvas.edge.depth'))}>
            {t('components.studio.canvas.edge.depth')}
          </div>
          <div className="detail-item-value" data-testid="studio-edge-depth">
            {formatNumber(edge.depth, {}, i18n.language)}
          </div>
        </div>
      </div>
      <p className="field-hint">{t('components.studio.canvas.edge.depthHint', { depth: edge.depth, to: edge.to })}</p>
      <label className="checkbox-label" {...tip(blocked || t('tips.studio.canvas.fanOut'))}>
        <input type="checkbox" checked={fanOut} disabled={!!blocked || pending !== null} onChange={(e) => toggle(e.target.checked)} data-testid="studio-edge-fanout" {...tip(blocked || t('tips.studio.canvas.fanOut'))} />
        {t('components.studio.canvas.edge.fanOut')}
      </label>
      <p className="field-hint">{t(fanOut ? 'components.studio.canvas.edge.fanOutOn' : 'components.studio.canvas.edge.fanOutOff', { from: edge.from, to: edge.to })}</p>
      <div>
        <button type="button" className="button-danger button-sm" onClick={() => !blocked && onDisconnect(edge.id)} aria-disabled={blocked ? 'true' : undefined} data-testid="studio-edge-disconnect" {...tip(blocked || t('tips.studio.canvas.disconnect'))}>
          {t('components.studio.canvas.toolbar.disconnect')}
        </button>
      </div>
    </div>
  );
}
