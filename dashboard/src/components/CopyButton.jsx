import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyToClipboard } from '../utils/clipboard';
import { CopyIcon, CheckIcon } from './Icons';
import { tip } from './Tooltip';

/**
 * Reusable copy-to-clipboard icon button with a checkmark success state. Works on https, localhost, and plain http
 * (see utils/clipboard.js); when the browser refuses both ways, the tooltip says to select the text and copy it by
 * hand. `value` may be a function, read at click time (for text that is still streaming).
 */
export default function CopyButton({ value, size = 14, className = '', title, tipText, testId }) {
  const { t } = useTranslation();
  const [state, setState] = useState('idle');
  const copied = state === 'copied';

  const handle = async (e) => {
    e.stopPropagation();
    const ok = await copyToClipboard(typeof value === 'function' ? value() : value);
    setState(ok ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), ok ? 1600 : 4000);
  };

  const label = copied ? t('common.actions.copied') : title || t('common.actions.copy');

  return (
    <button
      type="button"
      className={`copy-btn ${copied ? 'is-copied' : ''} ${state === 'failed' ? 'is-failed' : ''} ${className}`}
      onClick={handle}
      aria-label={label}
      data-testid={testId}
      data-copy-state={state}
      {...tip(copied ? t('tips.copy.done') : state === 'failed' ? t('tips.copy.failed') : tipText || t('tips.copy.value'))}
    >
      {copied ? <CheckIcon size={size} /> : <CopyIcon size={size} />}
    </button>
  );
}
