import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { FormField } from './FormFields';
import AgenticAppImageField from './AgenticAppImageField';
import AgenticAppPalette from './AgenticAppPalette';
import AgenticAppPreview from './AgenticAppPreview';
import AgenticAppStarterPrompts from './AgenticAppStarterPrompts';
import { APP_CORNER_STYLES, APP_DENSITIES, APP_FONTS, APP_THEME_DEFAULTS } from '../utils/apps';
import { enumOptions } from '../utils/enums';
import { optionalText, resourceTip } from '../utils/tips';

const ID = 'apps';

function appField(t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${ID}.hints.${name}`);
  return { name, type, label: t(`resources.${ID}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, ID, name), ...extra };
}

/**
 * The appearance step of the app editor (LP8.4): text, images with inline upload, the palette and custom colors, theme
 * and layout, what the page shows, and starter prompts, beside a live preview of the app page in light and dark. The
 * preview stacks under the form when the dialog is narrow. Every field follows the LP8 contract; defaults keep the
 * look the app page had before these fields existed.
 */
export default function AgenticAppAppearance({ data, onChange, errors = {}, disabled = false, assets = [], reloadOptions = null }) {
  const { t } = useTranslation();
  const d = data || {};
  const [images, setImages] = useState({});
  const set = (name) => (value) => onChange({ ...d, [name]: value });
  const onLogo = useCallback((url) => setImages((prev) => (prev.logo === url ? prev : { ...prev, logo: url })), []);
  const onAvatar = useCallback((url) => setImages((prev) => (prev.avatar === url ? prev : { ...prev, avatar: url })), []);
  const appName = d.name || d.slug || '';

  const field = (f) => <FormField key={f.name} field={f} value={d[f.name]} onChange={set(f.name)} error={errors[f.name]} disabled={disabled} id={`${ID}-${f.name}`} />;
  const textField = (name, placeholder) => field(appField(t, name, 'text', { placeholder }));
  const image = (name, role, noneLabel, onPreview) => (
    <AgenticAppImageField
      key={name}
      id={`${ID}-${name}`}
      role={role}
      label={t(`resources.${ID}.fields.${name}`)}
      tipText={resourceTip(t, ID, name)}
      hint={optionalText(t, `resources.${ID}.hints.${name}`) || null}
      value={d[name] || ''}
      onChange={set(name)}
      assets={assets}
      noneLabel={noneLabel}
      appName={appName}
      disabled={disabled}
      error={errors[name] || null}
      onUploaded={reloadOptions ? () => reloadOptions() : null}
      onPreview={onPreview}
    />
  );
  const section = (key) => (
    <div className="form-section-title appearance-section-title" {...tip(t(`tips.appAppearance.sections.${key}`))}>
      {t(`components.appAppearance.sections.${key}`)}
    </div>
  );

  return (
    <div className="appearance-editor" data-testid="app-appearance">
      <div className="appearance-editor-grid">
        <div className="appearance-form">
          {section('text')}
          <div className="form-grid">
            {textField('subtitle', t('resources.apps.placeholders.subtitle'))}
            {textField('welcomeTitle', d.displayName || d.name || '')}
            {field(appField(t, 'welcomeText', 'textarea', { rows: 3 }))}
            {textField('composerPlaceholder', t('components.appAppearance.preview.placeholder'))}
            {textField('agentDisplayName', d.displayName || d.name || '')}
          </div>

          {section('images')}
          <div className="form-grid appearance-images">
            {image('logoAssetId', 'logo', t('resources.apps.noLogo'), onLogo)}
            {image('faviconAssetId', 'favicon', t('resources.apps.faviconFromLogo'), null)}
            {image('agentAvatarAssetId', 'avatar', t('resources.apps.noAvatar'), onAvatar)}
          </div>

          {section('colors')}
          <AgenticAppPalette data={d} onChange={onChange} errors={errors} disabled={disabled} idPrefix={ID} />

          {section('layout')}
          <div className="form-grid">
            {field(appField(t, 'themeDefault', 'select', { required: true, options: enumOptions(t, 'appThemeDefault', APP_THEME_DEFAULTS) }))}
            {field(appField(t, 'cornerStyle', 'select', { required: true, options: enumOptions(t, 'appCornerStyle', APP_CORNER_STYLES) }))}
            {field(appField(t, 'density', 'select', { required: true, options: enumOptions(t, 'appDensity', APP_DENSITIES) }))}
            {field(appField(t, 'fontFamily', 'select', { required: true, options: enumOptions(t, 'appFont', APP_FONTS) }))}
          </div>

          {section('show')}
          <div className="form-grid appearance-switches">
            {field(appField(t, 'allowThemeSwitch', 'checkbox'))}
            {field(appField(t, 'showFilesPanel', 'checkbox'))}
            {field(appField(t, 'showLanguagePicker', 'checkbox'))}
            {field(appField(t, 'showPoweredBy', 'checkbox'))}
          </div>

          {section('prompts')}
          <AgenticAppStarterPrompts value={d.starterPrompts} onChange={set('starterPrompts')} errors={errors} disabled={disabled} idPrefix={ID} />
        </div>
        <aside className="appearance-preview" aria-label={t('components.appAppearance.sections.preview')}>
          {section('preview')}
          <div className="appearance-preview-pair">
            <AgenticAppPreview form={d} theme="light" logoUrl={images.logo || null} avatarUrl={images.avatar || null} />
            <AgenticAppPreview form={d} theme="dark" logoUrl={images.logo || null} avatarUrl={images.avatar || null} />
          </div>
          <p className="field-hint">{t('components.appAppearance.preview.note')}</p>
        </aside>
      </div>
    </div>
  );
}
