import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { CheckIcon, CopyIcon } from './Icons.jsx';
import { copyText } from '../utils/clipboard.js';

/** How long the green check shows after a copy, in milliseconds. */
const COPIED_MS = 1500;

/**
 * The one copy control of the app UI: copies `text` (on https, localhost, and plain http alike) and turns into a
 * green check for a moment, or says the browser refused.
 */
export default function CopyButton({ text, label, testId }) {
  const { t } = useTranslation();
  const [state, setState] = useState('idle');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    const ok = await copyText(text);
    setState(ok ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), COPIED_MS);
  };
  const name = state === 'copied' ? t('copy.copied') : state === 'failed' ? t('copy.failed') : label || t('copy.copy');
  return (
    <button type="button" className={`icon-button copy-button copy-${state}`} onClick={copy} aria-label={name} data-testid={testId} data-state={state} {...tip(name)}>
      {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
