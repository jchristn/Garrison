import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../../Tooltip';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { APP_AUTH_MODES, APP_COLOR_PATTERN } from '../../../utils/apps';
import { enumLabel } from '../../../utils/enums';
import { fieldError, findItem } from '../../../utils/studioCanvas';
import { BRANDING_KEYS, ManifestYamlError, appTemplate, extractDocument, readAppFields, writeAppFields } from '../../../utils/manifestYaml';
import { PanelActions, PanelErrors, PanelField, diffFailure, useItemForm } from './panelParts';

/**
 * Properties of the app the canvas shows (AD8.3), when no agent or call is selected: the entry agent (a SetEntry
 * operation, at once), and the description, sign-in mode, anonymous use, and branding, which rewrite the draft's
 * AgenticApp item on Save. An app the draft does not hold yet is brought in first from its live document.
 */
export default function AppPanel({ app, flow, draft, diff, blocked, onSave, onSetEntry }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const item = findItem(draft, 'AgenticApp', app);
  const held = item && item.operation !== 'Delete';
  const { form, change, reset, saved, dirty } = useItemForm(held ? item.document : '', readAppFields);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const failure = diffFailure(diff, 'AgenticApp', app);

  const bringIn = async () => {
    if (blocked) return;
    setBusy(true);
    let document = null;
    try {
      document = extractDocument(await apiClient.exportManifests(tenantId, { resources: [`AgenticApp/${app}`] }), 'AgenticApp', app);
    } catch {
      document = null;
    }
    const result = await onSave('AgenticApp', app, document || appTemplate(app));
    setBusy(false);
    if (result.error) setServerError(result.error);
  };

  const save = async () => {
    const e = {};
    for (const key of ['primaryColor', 'accentColor']) {
      const v = form.branding[key].trim();
      if (v && !APP_COLOR_PATTERN.test(v)) e[`branding.${key}`] = t('components.studio.canvas.app.errors.color');
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    let document;
    try {
      document = writeAppFields(item.document, form);
    } catch (err) {
      setServerError(err instanceof ManifestYamlError ? { message: t('components.studio.canvas.panel.unparsable', { message: err.message }) } : err);
      return;
    }
    setBusy(true);
    setServerError(null);
    setSavedNote('');
    const result = await onSave('AgenticApp', app, document);
    setBusy(false);
    if (result.ok) {
      saved();
      setSavedNote(t('components.studio.canvas.panel.saved', { item: `AgenticApp/${app}` }));
    } else if (result.error) setServerError(result.error);
  };

  const fe = (field) => errors[field] || fieldError(t, serverError, field) || fieldError(t, serverError, `spec.${field}`);
  const setBranding = (key, value) => change({ branding: { ...form.branding, [key]: value } });

  return (
    <div className="studio-canvas-props" data-testid="studio-app-panel" data-app={app}>
      <h4 className="section-title" {...tip(t('tips.studio.canvas.app.title'))}>
        {t('components.studio.canvas.app.title', { name: app })}
      </h4>
      <p className="field-hint">{t('components.studio.canvas.app.hint')}</p>
      <PanelField id="studio-app-entry" label={t('components.studio.canvas.app.entry')} tipText={t('tips.studio.canvas.app.entry')} hint={flow.nodes.length ? '' : t('components.studio.canvas.app.noMembers')}>
        <select id="studio-app-entry" value={flow.entry || ''} disabled={!!blocked || !flow.nodes.length} onChange={(e) => onSetEntry(e.target.value)} data-testid="studio-app-entry" {...tip(blocked || t('tips.studio.canvas.app.entry'))}>
          {!flow.entry && <option value="">{t('components.studio.canvas.app.noEntry')}</option>}
          {flow.nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.id}
            </option>
          ))}
        </select>
      </PanelField>
      {!held ? (
        <div className="studio-canvas-bring">
          <p className="text-muted">{t(item?.operation === 'Delete' ? 'components.studio.canvas.app.deleted' : 'components.studio.canvas.app.notHeld', { name: app })}</p>
          {item?.operation !== 'Delete' && (
            <button type="button" className="button-secondary button-sm" onClick={bringIn} aria-disabled={blocked || busy ? 'true' : undefined} data-testid="studio-app-bring" {...tip(blocked || t('tips.studio.canvas.app.bring'))}>
              {t('components.studio.canvas.app.bring')}
            </button>
          )}
          <PanelErrors error={serverError} />
        </div>
      ) : (
        <div className="form-grid studio-canvas-form">
          <PanelField id="studio-app-description" label={t('components.studio.canvas.app.description')} tipText={t('tips.studio.canvas.app.description')} error={fe('description')} wide>
            <textarea id="studio-app-description" rows={2} value={form.description} readOnly={!!blocked} onChange={(e) => change({ description: e.target.value })} data-testid="studio-app-description" {...tip(t('tips.studio.canvas.app.description'))} />
          </PanelField>
          <PanelField id="studio-app-auth" label={t('components.studio.canvas.app.authMode')} tipText={t('tips.studio.canvas.app.authMode')} error={fe('authMode')}>
            <select id="studio-app-auth" value={form.authMode} disabled={!!blocked} onChange={(e) => change({ authMode: e.target.value })} data-testid="studio-app-auth" {...tip(t('tips.studio.canvas.app.authMode'))}>
              <option value="">{t('components.studio.canvas.app.authDefault')}</option>
              {APP_AUTH_MODES.map((m) => (
                <option key={m} value={m}>
                  {enumLabel(t, 'appAuthMode', m)}
                </option>
              ))}
            </select>
          </PanelField>
          <div className="field">
            <label className="checkbox-label" {...tip(t('tips.studio.canvas.app.anonymous'))}>
              <input type="checkbox" checked={form.anonymousEnabled} disabled={!!blocked} onChange={(e) => change({ anonymousEnabled: e.target.checked })} data-testid="studio-app-anonymous" {...tip(t('tips.studio.canvas.app.anonymous'))} />
              {t('components.studio.canvas.app.anonymous')}
            </label>
          </div>
          <div className="form-section-title span-full" {...tip(t('tips.studio.canvas.app.branding'))}>
            {t('components.studio.canvas.app.branding')}
          </div>
          {BRANDING_KEYS.map((key) => (
            <PanelField key={key} id={`studio-app-${key}`} label={t(`components.studio.canvas.app.brandingFields.${key}`)} tipText={t(`tips.studio.canvas.app.brandingFields.${key}`)} error={fe(`branding.${key}`)} wide={key === 'welcomeText'}>
              {key === 'welcomeText' ? (
                <textarea id={`studio-app-${key}`} rows={2} value={form.branding[key]} readOnly={!!blocked} onChange={(e) => setBranding(key, e.target.value)} data-testid={`studio-app-${key}`} {...tip(t(`tips.studio.canvas.app.brandingFields.${key}`))} />
              ) : (
                <input
                  id={`studio-app-${key}`}
                  value={form.branding[key]}
                  readOnly={!!blocked}
                  placeholder={key.endsWith('Color') ? '#1F6FEB' : ''}
                  onChange={(e) => setBranding(key, e.target.value)}
                  data-testid={`studio-app-${key}`}
                  {...tip(t(`tips.studio.canvas.app.brandingFields.${key}`))}
                />
              )}
            </PanelField>
          ))}
          <div className="span-full">
            <PanelErrors error={serverError} shownFields={['description', 'authMode', ...BRANDING_KEYS.map((k) => `branding.${k}`)]} failure={failure} />
            <PanelActions blocked={blocked} dirty={dirty} busy={busy} savedNote={savedNote} onSave={save} onReset={reset} testId="studio-app" />
          </div>
        </div>
      )}
    </div>
  );
}
