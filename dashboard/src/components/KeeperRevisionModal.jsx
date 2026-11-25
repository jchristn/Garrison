import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import FormFields from './FormFields';
import FieldWarnings, { fieldWarningsOf } from './FieldWarnings';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { keeperRevisionFields } from '../views/keeperConfigs';
import { revisionToForm, revisionToBody, revisionErrors } from '../utils/keepers';
import { errorMessage, fieldErrorMessages, withListItemErrors } from '../utils/errors';

/**
 * New revision of a keeper (AA1.16): the revision fields, filled from the current revision, and a change note. Save as
 * draft stores a Draft revision; Publish stores it and publishes it at once, which makes it current, resets the backoff,
 * and wakes the keeper now. Values the server clamps (intervals outside the cluster bounds) are listed after saving.
 */
export default function KeeperRevisionModal({ mandate, onClose, onSaved }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [data, setData] = useState(() => revisionToForm(mandate?.currentRevision));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const save = async (publish) => {
    const found = revisionErrors(data, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const created = await apiClient.createMandateRevision(tenantId, mandate.id, revisionToBody(data));
      const clamped = fieldWarningsOf(created);
      let next = null;
      if (publish) next = await apiClient.publishMandateRevision(tenantId, mandate.id, created.id);
      addToast({ type: 'success', message: t(publish ? 'components.keeperRevision.published' : 'components.keeperRevision.drafted', { number: created.number }) });
      if (clamped.length) {
        setWarnings(clamped);
        onSaved?.(next, created, true);
      } else {
        onSaved?.(next, created, false);
        onClose();
      }
    } catch (e) {
      const perField = withListItemErrors(t, fieldErrorMessages(t, e));
      if (perField) setErrors(perField);
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="large"
      onClose={onClose}
      title={t('components.keeperRevision.title', { name: mandate?.name })}
      footer={
        warnings.length ? (
          <button type="button" className="button-primary" onClick={onClose} data-testid="keeper-revision-done" {...tip(t('tips.keeperRevision.done'))}>
            {t('common.actions.close')}
          </button>
        ) : (
          <>
            <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
              {t('common.actions.cancel')}
            </button>
            <button type="button" className="button-secondary" onClick={() => save(false)} disabled={busy} data-testid="keeper-revision-draft" {...tip(t('tips.keeperRevision.draft'))}>
              {t('components.keeperRevision.draft')}
            </button>
            <button type="button" className="button-primary" onClick={() => save(true)} disabled={busy} data-testid="keeper-revision-publish" {...tip(t('tips.keeperRevision.publish'))}>
              {t('components.keeperRevision.publish')}
            </button>
          </>
        )
      }
    >
      {warnings.length ? (
        <FieldWarnings warnings={warnings} testId="keeper-revision-warnings" />
      ) : (
        <>
          <p className="text-muted">{t('components.keeperRevision.intro', { number: (mandate?.currentRevisionNumber || 0) + 1 })}</p>
          {Object.keys(errors).length > 0 && <div className="error-banner">{t('common.errors.fixFields')}</div>}
          <FormFields fields={keeperRevisionFields(t, true, true)} data={data} onChange={setData} errors={errors} disabled={busy} idPrefix="keeper-revision" />
        </>
      )}
    </Modal>
  );
}
