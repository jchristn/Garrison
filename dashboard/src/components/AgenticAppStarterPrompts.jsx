import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { ChevronDownIcon, PlusIcon, TrashIcon } from './Icons';
import { APP_LIMITS } from '../utils/apps';

/**
 * Starter prompts (LP8.4): at most four, each up to 200 characters, shown as buttons on a new conversation. Prompts are
 * added, removed, and reordered with the buttons on each row, or with Alt+Up and Alt+Down in a prompt's box; focus
 * stays on the prompt that moved. The counts update as people type.
 */
export default function AgenticAppStarterPrompts({ value, onChange, errors = {}, disabled = false, idPrefix = 'apps' }) {
  const { t } = useTranslation();
  const prompts = Array.isArray(value) ? value : [];
  const max = APP_LIMITS.starterPrompts;
  const maxLength = APP_LIMITS.starterPrompt;
  const [focus, setFocus] = useState(null);
  const refs = useRef([]);

  useEffect(() => {
    if (focus === null) return;
    const el = refs.current[focus];
    if (el) el.focus();
    setFocus(null);
  }, [focus, prompts.length]);

  const set = (next) => onChange(next);
  const update = (i, text) => set(prompts.map((p, j) => (j === i ? text : p)));
  const remove = (i) => {
    set(prompts.filter((_, j) => j !== i));
    setFocus(Math.max(0, Math.min(i, prompts.length - 2)));
  };
  const move = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= prompts.length) return;
    const next = [...prompts];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
    setFocus(j);
  };
  const add = () => {
    if (prompts.length >= max) return;
    set([...prompts, '']);
    setFocus(prompts.length);
  };
  const onKeyDown = (i) => (e) => {
    if (!e.altKey) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(i, -1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(i, 1);
    }
  };

  return (
    <div className={`appearance-prompts ${errors.starterPrompts ? 'has-error' : ''}`} data-field="starterPrompts" data-testid="starter-prompts">
      <div className="appearance-prompts-head">
        <span className="field-label" id={`${idPrefix}-starterPrompts-label`} {...tip(t('tips.resources.apps.starterPrompts'))}>
          {t('resources.apps.fields.starterPrompts')}
        </span>
        <span className="text-muted appearance-count" aria-live="polite" data-testid="starter-prompts-count">
          {t('components.appAppearance.prompts.count', { count: prompts.length, max })}
        </span>
      </div>
      <div className="field-hint">{t('resources.apps.hints.starterPrompts')}</div>
      {prompts.length === 0 ? <p className="text-muted appearance-prompts-empty">{t('components.appAppearance.prompts.empty')}</p> : null}
      <ol className="appearance-prompt-list" aria-labelledby={`${idPrefix}-starterPrompts-label`}>
        {prompts.map((p, i) => {
          const id = `${idPrefix}-starterPrompts-${i}`;
          const err = errors[`starterPrompts[${i}]`];
          const label = t('components.appAppearance.prompts.label', { number: i + 1 });
          return (
            <li key={i} className={`appearance-prompt ${err ? 'has-error' : ''}`} data-testid="starter-prompt-row">
              <span className="appearance-prompt-number" aria-hidden="true">
                {i + 1}
              </span>
              <div className="appearance-prompt-input">
                <input
                  id={id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="text"
                  value={p}
                  disabled={disabled}
                  maxLength={maxLength}
                  placeholder={t('components.appAppearance.prompts.placeholder')}
                  aria-label={label}
                  aria-describedby={`${id}-chars ${idPrefix}-starterPrompts-keys`}
                  aria-invalid={err ? 'true' : undefined}
                  onChange={(e) => update(i, e.target.value)}
                  onKeyDown={onKeyDown(i)}
                  data-testid="starter-prompt-input"
                  {...tip(t('tips.appAppearance.prompt'))}
                />
                <span id={`${id}-chars`} className="appearance-chars text-muted" data-testid="starter-prompt-chars">
                  {t('components.appAppearance.prompts.chars', { count: p.length, max: maxLength })}
                </span>
                {err ? (
                  <div className="field-error" role="alert">
                    {err}
                  </div>
                ) : null}
              </div>
              <span className="appearance-prompt-actions">
                <button type="button" className="button-ghost button-sm" disabled={disabled || i === 0} onClick={() => move(i, -1)} aria-label={t('components.appAppearance.prompts.moveUp', { number: i + 1 })} data-testid="starter-prompt-up" {...tip(t('tips.form.moveUp'))}>
                  <span className="appearance-chevron-up">
                    <ChevronDownIcon size={14} />
                  </span>
                </button>
                <button type="button" className="button-ghost button-sm" disabled={disabled || i === prompts.length - 1} onClick={() => move(i, 1)} aria-label={t('components.appAppearance.prompts.moveDown', { number: i + 1 })} data-testid="starter-prompt-down" {...tip(t('tips.form.moveDown'))}>
                  <ChevronDownIcon size={14} />
                </button>
                <button type="button" className="button-ghost button-sm" disabled={disabled} onClick={() => remove(i)} aria-label={t('components.appAppearance.prompts.remove', { number: i + 1 })} data-testid="starter-prompt-remove" {...tip(t('tips.form.removeItem'))}>
                  <TrashIcon size={14} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <p id={`${idPrefix}-starterPrompts-keys`} className="field-hint">
        {t('components.appAppearance.prompts.keys')}
      </p>
      {errors.starterPrompts ? (
        <div className="field-error" role="alert">
          {errors.starterPrompts}
        </div>
      ) : null}
      <button type="button" className="button-secondary button-sm" disabled={disabled || prompts.length >= max} onClick={add} data-testid="starter-prompt-add" {...tip(prompts.length >= max ? t('tips.appAppearance.promptsFull', { max }) : t('tips.appAppearance.addPrompt'))}>
        <PlusIcon size={14} /> {t('components.appAppearance.prompts.add')}
      </button>
    </div>
  );
}
