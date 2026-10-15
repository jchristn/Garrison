import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon } from './Icons';
import { tip } from './Tooltip';

/**
 * Invoke input form generated from an agent's input JSON Schema (P12.22). The model comes from
 * utils/schemaForm.buildFormModel; `state` maps field keys to raw control values; `errors` maps field keys to messages
 * (client checks and server field errors).
 */
export default function SchemaInputForm({ model, state, onChange, errors = {}, disabled = false }) {
  const { t } = useTranslation();
  const set = (key, value) => onChange({ ...state, [key]: value });

  const fieldTip = (f) => (f.description ? t('tips.views.invoke.schemaForm.fieldWithDescription', { name: f.label, description: f.description }) : t('tips.views.invoke.schemaForm.field', { name: f.label }));

  const label = (f, id) => (
    <label htmlFor={id} {...tip(fieldTip(f))}>
      {f.label}
      {f.required && (
        <span className="text-danger" aria-label={t('views.invoke.schemaForm.required')}>
          {' '}*
        </span>
      )}
    </label>
  );

  const errorText = (f) =>
    errors[f.key] ? (
      <div className="field-error" role="alert" data-testid={`schema-error-${f.key}`}>
        {errors[f.key]}
      </div>
    ) : null;

  const hint = (f) => (f.description ? <div className="field-hint">{f.description}</div> : null);

  const optionLabel = (v) => (typeof v === 'string' ? v : JSON.stringify(v));

  const control = (f) => {
    const id = `schema-${f.key.replace(/\./g, '-')}`;
    const value = state[f.key];
    const invalid = errors[f.key] ? 'true' : undefined;
    const common = { id, disabled, 'aria-invalid': invalid, 'data-testid': `schema-field-${f.key}`, ...tip(fieldTip(f)) };
    if (f.type === 'boolean') {
      return (
        <div className={`field field-checkbox ${errors[f.key] ? 'has-error' : ''}`} key={f.key}>
          <input type="checkbox" checked={!!value} onChange={(e) => set(f.key, e.target.checked)} {...common} />
          {label(f, id)}
          {hint(f)}
          {errorText(f)}
        </div>
      );
    }
    let input;
    if (f.type === 'enum') {
      input = (
        <select value={value ?? ''} onChange={(e) => set(f.key, e.target.value)} {...common}>
          <option value="">{t('views.invoke.schemaForm.choose')}</option>
          {f.options.map((o) => (
            <option key={JSON.stringify(o)} value={JSON.stringify(o)}>
              {optionLabel(o)}
            </option>
          ))}
        </select>
      );
    } else if (f.type === 'array') {
      const items = Array.isArray(value) ? value : [];
      const setItem = (i, v) => set(f.key, items.map((x, j) => (j === i ? v : x)));
      input = (
        <div className="flex-col gap-sm" data-testid={`schema-field-${f.key}`}>
          {items.map((item, i) => (
            <div className="flex gap-sm items-center" key={i}>
              {f.itemType === 'enum' ? (
                <select id={i === 0 ? id : undefined} value={item} disabled={disabled} onChange={(e) => setItem(i, e.target.value)} data-testid={`schema-item-${f.key}-${i}`} {...tip(fieldTip(f))}>
                  <option value="">{t('views.invoke.schemaForm.choose')}</option>
                  {f.options.map((o) => (
                    <option key={JSON.stringify(o)} value={JSON.stringify(o)}>
                      {optionLabel(o)}
                    </option>
                  ))}
                </select>
              ) : f.itemType === 'boolean' ? (
                <select id={i === 0 ? id : undefined} value={item} disabled={disabled} onChange={(e) => setItem(i, e.target.value)} data-testid={`schema-item-${f.key}-${i}`} {...tip(fieldTip(f))}>
                  <option value="true">{t('common.boolean.yes')}</option>
                  <option value="false">{t('common.boolean.no')}</option>
                </select>
              ) : (
                <input id={i === 0 ? id : undefined} type={f.itemType === 'string' ? 'text' : 'number'} value={item} disabled={disabled} onChange={(e) => setItem(i, e.target.value)} data-testid={`schema-item-${f.key}-${i}`} {...tip(fieldTip(f))} />
              )}
              <button type="button" className="button-ghost button-sm" disabled={disabled} onClick={() => set(f.key, items.filter((_, j) => j !== i))} aria-label={t('views.invoke.schemaForm.removeItem')} {...tip(t('tips.views.invoke.schemaForm.removeItem'))}>
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
          <div>
            <button type="button" className="button-secondary button-sm" disabled={disabled} onClick={() => set(f.key, [...items, f.itemType === 'boolean' ? 'false' : ''])} data-testid={`schema-add-${f.key}`} {...tip(t('tips.views.invoke.schemaForm.addItem'))}>
              <PlusIcon size={14} /> {t('views.invoke.schemaForm.addItem')}
            </button>
          </div>
        </div>
      );
    } else if (f.type === 'json') {
      input = <textarea className="monospace" rows={4} spellCheck={false} value={value ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={t('views.invoke.schemaForm.jsonPlaceholder')} {...common} />;
    } else if (f.type === 'number' || f.type === 'integer') {
      input = <input type="number" inputMode={f.type === 'integer' ? 'numeric' : 'decimal'} step={f.type === 'integer' ? 1 : 'any'} min={f.minimum} max={f.maximum} value={value ?? ''} onChange={(e) => set(f.key, e.target.value)} {...common} />;
    } else if (f.format === 'textarea' || (f.description && /multi-?line/i.test(f.description))) {
      input = <textarea rows={4} value={value ?? ''} onChange={(e) => set(f.key, e.target.value)} {...common} />;
    } else {
      input = <input type={f.format === 'email' ? 'email' : f.format === 'uri' ? 'url' : 'text'} value={value ?? ''} onChange={(e) => set(f.key, e.target.value)} {...common} />;
    }
    return (
      <div className={`field ${errors[f.key] ? 'has-error' : ''}`} key={f.key}>
        {label(f, id)}
        {input}
        {hint(f)}
        {errorText(f)}
      </div>
    );
  };

  return (
    <div className="flex-col gap-sm" data-testid="schema-form">
      {model.description && <div className="field-hint">{model.description}</div>}
      {model.fields.map((f) =>
        f.type === 'object' ? (
          <fieldset className="schema-form-group" key={f.key} data-testid={`schema-group-${f.key}`}>
            <legend {...tip(fieldTip(f))}>
              {f.label}
              {f.required && <span className="text-danger"> *</span>}
            </legend>
            {hint(f)}
            {errorText(f)}
            {f.children.map(control)}
          </fieldset>
        ) : (
          control(f)
        )
      )}
    </div>
  );
}
