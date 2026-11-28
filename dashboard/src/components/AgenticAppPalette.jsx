import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { APP_COLOR_ROLES, APP_PALETTES, CUSTOM_PALETTE, applyPalette, clearAppColors, effectiveColor, paletteById, setAppColor } from '../utils/appPalettes';
import { AA_TEXT, normalizeColor, textContrast } from '../utils/appColors';
import { formatNumber } from '../i18n/formatters';

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/** The 6-digit form of a color for <input type="color">, which takes nothing else. */
function swatchValue(color, fallback) {
  const n = normalizeColor(color) || normalizeColor(fallback) || '#000000';
  return HEX6.test(n) ? n : '#000000';
}

/**
 * The app's colors (LP8.3): a swatch per preset, which fills all sixteen colors and sets paletteId, and a custom editor
 * with a light and a dark column per role. Any color edit sets paletteId to custom. A blank dark color shows the color
 * the app page will use instead (derived from the light one, or the light one itself for an app without a palette),
 * and any color whose text falls under WCAG AA (4.5:1) carries a warning beside it.
 */
export default function AgenticAppPalette({ data, onChange, errors = {}, disabled = false, idPrefix = 'apps' }) {
  const { t, i18n } = useTranslation();
  const d = data || {};
  const current = paletteById(d.paletteId);
  const paletteName = (id) => t(`components.appAppearance.palettes.${id}`);
  const currentName = current ? paletteName(current.id) : d.paletteId === CUSTOM_PALETTE ? t('components.appAppearance.palettes.custom') : t('components.appAppearance.palettes.none');
  const ratioText = (ratio) => formatNumber(Math.floor(ratio * 10) / 10, { minimumFractionDigits: 1, maximumFractionDigits: 1 }, i18n.language);

  const warning = (color, theme, kind, id) => {
    const ratio = textContrast(color, theme, kind);
    if (ratio === null || ratio >= AA_TEXT) return null;
    const text = t('components.appAppearance.contrastWarning', { ratio: ratioText(ratio) });
    return (
      <span className="appearance-contrast-warning" role="note" data-testid={`${id}-contrast`} {...tip(t('tips.appAppearance.contrastWarning', { ratio: ratioText(ratio) }))}>
        <span aria-hidden="true">!</span> {text}
      </span>
    );
  };

  const colorCell = (r, theme) => {
    const field = theme === 'dark' ? r.darkField : r.field;
    const id = `${idPrefix}-${field}`;
    const value = d[field] ?? '';
    const roleLabel = t(`resources.apps.fields.${r.field}`);
    const label = theme === 'dark' ? t('components.appAppearance.darkLabel', { field: roleLabel }) : roleLabel;
    const shown = effectiveColor(d, r.role, theme);
    const blank = !String(value).trim();
    const placeholder = theme === 'dark' ? shown.color.toUpperCase() : t('resources.apps.defaultColor', { color: shown.color.toUpperCase() });
    const note =
      theme === 'dark' && blank
        ? shown.source === 'derived'
          ? t('components.appAppearance.derived')
          : shown.source === 'light'
            ? t('components.appAppearance.sameAsLight')
            : t('components.appAppearance.builtIn')
        : null;
    const noteTip = shown.source === 'derived' ? t('tips.appAppearance.derived') : shown.source === 'light' ? t('tips.appAppearance.sameAsLight') : t('tips.appAppearance.builtIn');
    return (
      <div className={`appearance-color-cell ${errors[field] ? 'has-error' : ''}`} data-field={field}>
        <div className="color-input">
          <input
            type="color"
            className="color-swatch"
            value={swatchValue(value, shown.color)}
            disabled={disabled}
            aria-label={t('components.form.pickColor', { field: label })}
            data-empty={blank ? 'true' : undefined}
            onChange={(e) => onChange(setAppColor(d, field, e.target.value.toUpperCase()))}
            {...tip(t('tips.form.pickColor', { field: label }))}
          />
          <input
            id={id}
            type="text"
            value={value}
            disabled={disabled}
            maxLength={7}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={errors[field] ? 'true' : undefined}
            onChange={(e) => onChange(setAppColor(d, field, e.target.value))}
            data-testid={id}
            {...tip(t(theme === 'dark' ? 'tips.appAppearance.darkColor' : `tips.resources.apps.${r.field}`, { field: roleLabel }))}
          />
        </div>
        {note ? (
          <span className="appearance-derived" data-testid={`${id}-derived`} data-source={shown.source} {...tip(noteTip)}>
            <span className="appearance-mini-swatch" style={{ background: shown.color }} aria-hidden="true" />
            {note}
          </span>
        ) : null}
        {warning(shown.color, theme, r.kind, id)}
        {errors[field] ? (
          <div className="field-error" role="alert">
            {errors[field]}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="appearance-palette" data-testid="app-palette">
      <div className="appearance-palette-head">
        <span className="appearance-palette-current" data-testid="palette-current" {...tip(t('tips.resources.apps.paletteId'))}>
          {t('components.appAppearance.paletteCurrent', { name: currentName })}
        </span>
        <button type="button" className="button-ghost button-sm" disabled={disabled} onClick={() => onChange(clearAppColors(d))} data-testid="palette-reset" {...tip(t('tips.appAppearance.resetColors'))}>
          {t('components.appAppearance.resetColors')}
        </button>
      </div>
      <div className="appearance-swatches" role="group" aria-label={t('resources.apps.fields.paletteId')}>
        {APP_PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`appearance-swatch ${d.paletteId === p.id ? 'is-selected' : ''}`}
            aria-pressed={d.paletteId === p.id}
            disabled={disabled}
            onClick={() => onChange(applyPalette(d, p.id))}
            data-testid={`palette-${p.id}`}
            {...tip(t('tips.appAppearance.palette', { name: paletteName(p.id) }))}
          >
            <span className="appearance-swatch-colors" aria-hidden="true">
              {['light', 'dark'].map((theme) => (
                <span key={theme} className="appearance-swatch-band" style={{ background: p[theme].background }}>
                  <span style={{ background: p[theme].primary }} />
                  <span style={{ background: p[theme].accent }} />
                  <span style={{ background: p[theme].agentBubble }} />
                </span>
              ))}
            </span>
            <span className="appearance-swatch-name">{paletteName(p.id)}</span>
          </button>
        ))}
      </div>
      <div className="appearance-color-table" role="table" aria-label={t('components.appAppearance.sections.colors')}>
        <div className="appearance-color-row appearance-color-header" role="row">
          <span role="columnheader">{t('components.appAppearance.columns.role')}</span>
          <span role="columnheader" {...tip(t('tips.appAppearance.lightColumn'))}>
            {t('components.appAppearance.columns.light')}
          </span>
          <span role="columnheader" {...tip(t('tips.appAppearance.darkColumn'))}>
            {t('components.appAppearance.columns.dark')}
          </span>
        </div>
        {APP_COLOR_ROLES.map((r) => (
          <div key={r.role} className="appearance-color-row" role="row" data-role={r.role}>
            <span role="rowheader" className="appearance-color-role">
              <label htmlFor={`${idPrefix}-${r.field}`} {...tip(t(`tips.resources.apps.${r.field}`))}>
                {t(`resources.apps.fields.${r.field}`)}
              </label>
            </span>
            <span role="cell">{colorCell(r, 'light')}</span>
            <span role="cell">{colorCell(r, 'dark')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
