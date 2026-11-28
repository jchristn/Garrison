import { useTranslation } from 'react-i18next';
import { APP_COLOR_ROLES, effectiveColor } from '../utils/appPalettes';
import { mutedOn, readableOn, THEME_TEXT } from '../utils/appColors';

/** Font stacks per typeface, as the app page uses them (app-ui/src/utils/branding.js). */
const PREVIEW_FONTS = {
  Sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  Serif: "Georgia, 'Times New Roman', Times, serif",
  Rounded: "ui-rounded, 'SF Pro Rounded', 'Nunito', 'Varela Round', 'Arial Rounded MT Bold', sans-serif",
  Mono: "ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace"
};

/** CSS variables for one theme of the preview: each role's color, its readable text, and its muted text. */
function previewVariables(form, theme) {
  const vars = { '--pv-text': THEME_TEXT[theme], '--pv-border': theme === 'dark' ? '#2c3a52' : '#d5dde7' };
  for (const r of APP_COLOR_ROLES) {
    const { color } = effectiveColor(form, r.role, theme);
    vars[`--pv-${r.role}`] = color;
    vars[`--pv-on-${r.role}`] = readableOn(color);
    vars[`--pv-muted-${r.role}`] = mutedOn(color);
  }
  const font = PREVIEW_FONTS[form?.fontFamily];
  if (font) vars['--pv-font'] = font;
  return vars;
}

/**
 * A live sketch of the app page in one theme (LP8.4): the header with logo, name, and subtitle; the welcome title and
 * text; the starter prompts; one message from a person and one from the agent with its avatar and name; and the
 * composer with its placeholder, drawn with the app's colors, corner style, density, and typeface. It is a picture:
 * nothing in it can be focused or clicked.
 */
export default function AgenticAppPreview({ form, theme = 'light', logoUrl = null, avatarUrl = null }) {
  const { t } = useTranslation();
  const d = form || {};
  const name = String(d.displayName || '').trim() || String(d.name || '').trim() || t('components.appAppearance.preview.appName');
  const agent = String(d.agentDisplayName || '').trim() || name;
  const prompts = (d.starterPrompts || []).map((p) => String(p || '').trim()).filter(Boolean).slice(0, 4);
  const welcome = String(d.welcomeText || '').trim() || t('components.appAppearance.preview.welcomeDefault');
  const corners = d.cornerStyle === 'Sharp' ? 'sharp' : d.cornerStyle === 'Pill' ? 'pill' : 'rounded';
  const density = d.density === 'Compact' ? 'compact' : 'comfortable';
  const files = d.showFilesPanel !== false;
  return (
    <figure className="appearance-preview-frame" data-testid={`app-preview-${theme}`} data-theme-preview={theme}>
      <figcaption className="appearance-preview-caption">{theme === 'dark' ? t('components.appAppearance.preview.dark') : t('components.appAppearance.preview.light')}</figcaption>
      <div className={`app-preview pv-corners-${corners} pv-density-${density}`} style={previewVariables(d, theme)} aria-hidden="true" inert>
        <div className="pv-header">
          {logoUrl ? <img className="pv-logo" src={logoUrl} alt="" data-testid={`app-preview-${theme}-logo`} /> : null}
          <div className="pv-brand">
            <span className="pv-name" dir="auto" data-testid={`app-preview-${theme}-name`}>
              {name}
            </span>
            {d.subtitle ? (
              <span className="pv-subtitle" dir="auto">
                {d.subtitle}
              </span>
            ) : null}
          </div>
          <span className="pv-tools">
            {d.showLanguagePicker !== false ? <span className="pv-tool pv-tool-wide" /> : null}
            {d.allowThemeSwitch !== false ? <span className="pv-tool" /> : null}
          </span>
        </div>
        <div className="pv-body">
          <div className="pv-list">
            <span className="pv-new" />
            <span className="pv-row pv-row-selected" />
            <span className="pv-row" />
          </div>
          <div className="pv-chat">
            <div className="pv-scroll">
              <div className="pv-welcome">
                <div className="pv-welcome-title" dir="auto" data-testid={`app-preview-${theme}-welcome`}>
                  {String(d.welcomeTitle || '').trim() || name}
                </div>
                {d.subtitle ? (
                  <div className="pv-welcome-subtitle" dir="auto">
                    {d.subtitle}
                  </div>
                ) : null}
                <div className="pv-welcome-text" dir="auto">
                  {welcome}
                </div>
                {prompts.length ? (
                  <div className="pv-prompts" data-testid={`app-preview-${theme}-prompts`}>
                    {prompts.map((p, i) => (
                      <span key={i} className="pv-prompt" dir="auto">
                        {p}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="pv-message pv-user">
                <span className="pv-author">{t('components.appAppearance.preview.you')}</span>
                {t('components.appAppearance.preview.question')}
              </div>
              <div className="pv-message pv-agent">
                <span className="pv-author">
                  {avatarUrl ? <img className="pv-avatar" src={avatarUrl} alt="" data-testid={`app-preview-${theme}-avatar`} /> : null}
                  <span dir="auto" data-testid={`app-preview-${theme}-agent`}>
                    {agent}
                  </span>
                </span>
                {t('components.appAppearance.preview.answer')}
              </div>
            </div>
            <div className="pv-composer">
              <span className="pv-input" dir="auto" data-testid={`app-preview-${theme}-placeholder`}>
                {String(d.composerPlaceholder || '').trim() || t('components.appAppearance.preview.placeholder')}
              </span>
              <span className="pv-send" />
            </div>
            {d.showPoweredBy !== false ? <div className="pv-powered">{t('components.appAppearance.preview.poweredBy')}</div> : null}
          </div>
          {files ? (
            <div className="pv-files" data-testid={`app-preview-${theme}-files`}>
              <span className="pv-row" />
              <span className="pv-row" />
            </div>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
