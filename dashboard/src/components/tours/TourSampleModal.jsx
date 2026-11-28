import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import { tip } from '../Tooltip';
import { Badge } from '../StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { tourKey } from '../learn/learnSections';
import { enumLabel } from '../../utils/enums';
import { errorMessage } from '../../utils/errors';
import { enumTip } from '../../utils/tips';
import { TOUR_EXAMPLES, exampleContents } from '../../utils/tours';

const RESULT_TONE = { Created: 'success', Updated: 'info', Unchanged: 'neutral', Failed: 'danger' };

/**
 * The sample data offer (LP4.6): the tenant has none of what the tour needs, so this asks whether to load the
 * example. It never uses a browser dialog. On open it asks the manifest apply route for a dry run, so the list says
 * exactly what the apply will create, update, or leave alone; until the dry run answers (or when it cannot run) the
 * list shows what the example holds. Load applies the manifest for real; Continue without it runs the tour anyway,
 * and steps with nothing to show are skipped with a note. Closing the dialog ends the tour.
 */
export default function TourSampleModal({ tourId, sample, onLoaded, onContinue, onCancel }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const toast = useToast();
  const example = TOUR_EXAMPLES[sample?.example] || null;
  const contents = exampleContents(sample?.example);
  const [preview, setPreview] = useState(null);
  const [checking, setChecking] = useState(!!example && !!apiClient);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!example || !apiClient) return undefined;
    let live = true;
    apiClient
      .applyManifest(tenantId, example.manifest, true)
      .then((r) => live && setPreview(r))
      .catch((e) => {
        if (!live) return;
        if (e?.body && typeof e.body === 'object' && Array.isArray(e.body.items)) setPreview(e.body);
      })
      .finally(() => live && setChecking(false));
    return () => {
      live = false;
    };
  }, [example, apiClient, tenantId]);

  const load = async () => {
    if (!example || busy) return;
    setBusy(true);
    setError('');
    try {
      await apiClient.applyManifest(tenantId, example.manifest, false);
      toast?.addToast?.({ type: 'success', message: t('tours.sample.loaded', { example: t(`tours.sample.examples.${example.id}`) }) });
      onLoaded?.();
    } catch (e) {
      if (e?.body && typeof e.body === 'object' && Array.isArray(e.body.items)) setPreview(e.body);
      setError(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  };

  const items = preview?.items || [];
  const planned = (c, i) => items.find((x) => x.kind === c.kind && x.name === c.name) || items[i] || null;

  return (
    <Modal
      open
      size="medium"
      onClose={() => !busy && onCancel?.()}
      title={t('tours.sample.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onContinue} disabled={busy} data-testid="tour-sample-continue" {...tip(t('tips.tours.sampleContinue'))}>
            {t('tours.sample.continue')}
          </button>
          <button type="button" className="button-primary" onClick={load} disabled={busy || !example} data-testid="tour-sample-load" {...tip(t('tips.tours.sampleLoad'))}>
            {busy ? t('tours.sample.loading') : t('tours.sample.load')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="tour-sample" data-example={example?.id || ''}>
        <p>
          {t('tours.sample.body', {
            tour: t(tourKey(tourId)),
            need: t(`tours.sample.needs.${sample?.needs}`),
            example: example ? t(`tours.sample.examples.${example.id}`) : ''
          })}
        </p>
        <div className="form-section-title">{t('tours.sample.contents', { count: contents.length })}</div>
        <ul className="org-template-items tour-sample-items" data-testid="tour-sample-items">
          {contents.map((c, i) => {
            const item = planned(c, i);
            return (
              <li key={`${c.kind}/${c.name}`} data-sample-item={`${c.kind}/${c.name}`}>
                <code>{`${c.kind}/${c.name}`}</code>
                {item?.result && (
                  <>
                    {' '}
                    <Badge tone={RESULT_TONE[item.result] || 'neutral'} tip={enumTip(t, 'manifestApplyResult', item.result)}>{enumLabel(t, 'manifestApplyResult', item.result)}</Badge>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {checking && <p className="field-hint">{t('tours.sample.checking')}</p>}
        <div className="info-banner" role="note">
          {t('tours.sample.fake')}
        </div>
        {sample?.needs === 'runs' && <p className="field-hint">{t('tours.sample.runsLater')}</p>}
        {error && (
          <div className="error-banner" role="alert" data-testid="tour-sample-error">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
