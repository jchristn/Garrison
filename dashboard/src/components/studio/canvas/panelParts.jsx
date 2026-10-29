// Shared parts of the canvas property panels (AD8.3, AD8.4): a labelled field with its hint and error, the form
// state hook that keeps a person's unsaved edit when the draft changes underneath, and the server check banner.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../../Tooltip';
import { errorMessage } from '../../../utils/errors';
import { otherFieldErrors } from '../../../utils/studioCanvas';

/** A labelled control: `children` is the control with id `id`; `error` and `hint` show under it. */
export function PanelField({ id, label, tipText, error, hint, children, wide = false }) {
  return (
    <div className={`field${error ? ' has-error' : ''}${wide ? ' span-full' : ''}`}>
      <label htmlFor={id} {...tip(tipText)}>
        {label}
      </label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
      {error && (
        <div className="field-error" data-field-error={id}>
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Form state for one draft item: starts from `read(source)`, follows the item while the person has not changed
 * anything, and keeps their edit (dirty) when the item changes underneath, so a conflict never loses it.
 */
export function useItemForm(source, read) {
  const [form, setForm] = useState(() => read(source));
  const [base, setBase] = useState(source);
  const [dirty, setDirty] = useState(false);
  if (source !== base) {
    setBase(source);
    if (!dirty) setForm(read(source));
  }
  const change = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const reset = () => {
    setForm(read(source));
    setDirty(false);
  };
  const saved = () => setDirty(false);
  return { form, change, reset, saved, dirty };
}

/** The diff's verdict on one item when it failed validation: { message, errorCode }, or null. */
export function diffFailure(diff, kind, name) {
  const item = (diff?.items || []).find((i) => i.kind === kind && i.name === name);
  return item && item.change === 'Failed' ? { message: item.message || '', errorCode: item.errorCode || '' } : null;
}

/** The text of a diff failure: the field code's translation when the dashboard knows it, then the server's message. */
export function failureText(t, failure) {
  if (!failure) return '';
  const key = `common.fieldCodes.${failure.errorCode}`;
  const translated = failure.errorCode ? t(key, { defaultValue: '' }) : '';
  const known = translated && translated !== key ? translated : '';
  return known && failure.message ? `${known} (${failure.message})` : known || failure.message;
}

/** Errors under a panel: a server error (with field errors that no control shows) and the diff's check of the item. */
export function PanelErrors({ error, shownFields = [], failure, failureShown = false }) {
  const { t } = useTranslation();
  const rest = error ? otherFieldErrors(t, error, shownFields) : [];
  return (
    <>
      {error && (
        <div className="error-banner" role="alert" data-testid="studio-panel-error">
          {errorMessage(t, error)}
          {rest.length > 0 && (
            <ul className="studio-list">
              {rest.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {failure && !failureShown && (
        <div className="warning-banner" role="status" data-testid="studio-panel-check">
          {t('components.studio.canvas.panel.check', { message: failureText(t, failure) })}
        </div>
      )}
    </>
  );
}

/** Save and Reset buttons with the unsaved marker and the saved note. */
export function PanelActions({ blocked, dirty, busy, savedNote, onSave, onReset, testId }) {
  const { t } = useTranslation();
  const reason = blocked || (dirty ? '' : t('tips.studio.canvas.panel.nothingToSave'));
  return (
    <div className="flex gap-sm items-center studio-canvas-panel-actions">
      <button
        type="button"
        className="button-primary button-sm"
        onClick={() => !reason && !busy && onSave()}
        aria-disabled={reason || busy ? 'true' : undefined}
        data-testid={`${testId}-save`}
        {...tip(reason || t('tips.studio.canvas.panel.save'))}
      >
        {busy ? t('common.generic.saving') : t('components.studio.canvas.panel.save')}
      </button>
      <button
        type="button"
        className="button-ghost button-sm"
        onClick={() => dirty && onReset()}
        aria-disabled={dirty ? undefined : 'true'}
        data-testid={`${testId}-reset`}
        {...tip(dirty ? t('tips.studio.canvas.panel.reset') : t('tips.studio.canvas.panel.nothingToReset'))}
      >
        {t('components.studio.canvas.panel.reset')}
      </button>
      {dirty && <span className="text-muted">{t('components.studio.items.unsaved')}</span>}
      {!dirty && savedNote && (
        <span className="text-muted" role="status" data-testid={`${testId}-saved`}>
          {savedNote}
        </span>
      )}
    </div>
  );
}
