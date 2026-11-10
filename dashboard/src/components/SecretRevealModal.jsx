import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CopyButton from './CopyButton';
import { tip } from './Tooltip';
import { errorMessage } from '../utils/errors';

/**
 * Reveals one secret's stored value on request. Nothing is fetched until the person presses Reveal, because the server
 * writes a SecretRevealed audit record for every reveal. The value lives only in this dialog's state and is dropped
 * when the dialog closes or the person hides it. `load()` returns the reveal response ({ value, ... }).
 */
export default function SecretRevealModal({ name, multiline = false, load, onClose }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const reveal = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await load();
      setValue(response?.value ?? '');
    } catch (e) {
      setError(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setValue(null);
    onClose();
  };

  return (
    <Modal
      open
      onClose={close}
      title={t('components.secretReveal.title')}
      headerMeta={name}
      footer={
        <>
          {value !== null ? (
            <button type="button" className="button-secondary" onClick={() => setValue(null)} data-testid="secret-reveal-hide" {...tip(t('tips.secretReveal.hide'))}>
              {t('components.secretReveal.hide')}
            </button>
          ) : (
            <button type="button" className="button-primary" onClick={reveal} disabled={busy} data-testid="secret-reveal-confirm" {...tip(t('tips.secretReveal.reveal'))}>
              {t('components.secretReveal.reveal')}
            </button>
          )}
          <button type="button" className={value !== null ? 'button-primary' : 'button-secondary'} onClick={close} disabled={busy} data-testid="secret-reveal-close" {...tip(t('tips.secretReveal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div className="warning-banner" role="note" data-testid="secret-reveal-warning">{t('components.secretReveal.warning')}</div>
      {error && (
        <div className="error-banner" role="alert" data-testid="secret-reveal-error">
          {error}
        </div>
      )}
      {value !== null && (
        <div className="field">
          <label {...tip(t('tips.secretReveal.value'))}>{t('components.secretReveal.value')}</label>
          <div className="secret-row">
            {multiline ? <pre data-testid="secret-reveal-value" style={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: 0 }}>{value}</pre> : <code data-testid="secret-reveal-value">{value}</code>}
            <CopyButton value={value} tipText={t('tips.secretReveal.copy')} testId="secret-reveal-copy" />
          </div>
        </div>
      )}
    </Modal>
  );
}
