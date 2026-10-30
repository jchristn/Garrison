import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { FormField } from './FormFields';
import { tip } from './Tooltip';
import { errorMessage } from '../utils/errors';

/**
 * Modal that collects one value (optionally secret, optionally multi-line) and submits it. `help` renders above the
 * field (for example how to get a secret's value); `size` is the modal size, small by default.
 */
export default function ValuePromptModal({ title, label, tip: fieldTip, saveTip, secret = false, multiline = false, help = null, size = 'small', onSubmit, onClose }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!value) {
      setError(t('common.errors.required'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
      onClose();
    } catch (e) {
      setError(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size={size}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} {...tip(saveTip || t('tips.modal.saveValue'))}>
            {t('common.actions.save')}
          </button>
        </>
      }
    >
      {help}
      <FormField id="value-prompt" field={{ name: 'value', type: secret ? 'password' : multiline ? 'code' : 'text', label, required: true, tip: fieldTip, rows: multiline ? 8 : undefined }} value={value} onChange={setValue} error={error} disabled={busy} />
    </Modal>
  );
}
