import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon } from '../../Icons';
import { tip } from '../../Tooltip';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { itemTemplate } from '../../../utils/studio';
import { draftDeployments, fieldError, findItem } from '../../../utils/studioCanvas';
import { ManifestYamlError, extractDocument, joinPromptRef, parseSchemaText, readAgentFields, writeAgentFields } from '../../../utils/manifestYaml';
import { PanelActions, PanelErrors, PanelField, diffFailure, failureText, useItemForm } from './panelParts';

const SCHEMA_KEYS = ['inputSchema', 'outputSchema'];

/** The agent's document for the form, or the empty form when the draft does not hold it. */
function readForm(document) {
  const f = readAgentFields(document || '');
  return { ...f, capabilitiesText: f.capabilities.join(', ') };
}

/**
 * Properties of the selected agent (AD8.3): description, input and output schema (JSON), asset pins, and
 * capabilities. Saving rewrites the draft's Agent item, so the edit shows in Diff and apply. An agent the draft does
 * not hold yet is brought in first, from its live document (or a new one). The System prompt is a property of each
 * deployment, so the panel lists it per environment and links to the runtime tab, where it is edited.
 */
export default function AgentPanel({ name, node, draft, diff, blocked, onSave, onShowRuntime }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const item = findItem(draft, 'Agent', name);
  const held = item && item.operation !== 'Delete';
  const { form, change, reset, saved, dirty } = useItemForm(held ? item.document : '', readForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const failure = diffFailure(diff, 'Agent', name);
  const schemaFailure = failure?.errorCode === 'InvalidJsonSchema' ? failureText(t, failure) : '';
  const deployments = draftDeployments(draft, name);

  const bringIn = async () => {
    if (blocked) return;
    setBusy(true);
    setServerError(null);
    let document = null;
    try {
      document = extractDocument(await apiClient.exportManifests(tenantId, { resources: [`Agent/${name}`] }), 'Agent', name);
    } catch {
      document = null;
    }
    const result = await onSave('Agent', name, document || itemTemplate('Agent', name));
    setBusy(false);
    if (result.error) setServerError(result.error);
  };

  const save = async () => {
    const e = {};
    for (const key of SCHEMA_KEYS) {
      const parsed = parseSchemaText(form[key]);
      if (parsed.error) e[key] = t(`components.studio.canvas.agent.errors.${parsed.error}`);
    }
    form.assets.forEach((a, i) => {
      if (a.asset.trim() && a.version.trim() && !/^\d+$/.test(a.version.trim())) e[`assets[${i}].version`] = t('components.studio.canvas.agent.errors.version');
    });
    setErrors(e);
    if (Object.keys(e).length) return;
    let document;
    try {
      document = writeAgentFields(item.document, { ...form, capabilities: form.capabilitiesText.split(',') });
    } catch (err) {
      setServerError(err instanceof ManifestYamlError ? { message: t('components.studio.canvas.panel.unparsable', { message: err.message }) } : err);
      return;
    }
    setBusy(true);
    setServerError(null);
    setSavedNote('');
    const result = await onSave('Agent', name, document);
    setBusy(false);
    if (result.ok) {
      saved();
      setSavedNote(t('components.studio.canvas.panel.saved', { item: `Agent/${name}` }));
    } else if (result.error) setServerError(result.error);
  };

  const fe = (field) => errors[field] || fieldError(t, serverError, field) || fieldError(t, serverError, `spec.${field}`);
  const setAsset = (i, patch) => change({ assets: form.assets.map((a, j) => (j === i ? { ...a, ...patch } : a)) });

  return (
    <div className="studio-canvas-props" data-testid="studio-agent-panel" data-agent={name}>
      <h4 className="section-title" {...tip(t('tips.studio.canvas.agent.title'))}>
        {t('components.studio.canvas.agent.title', { name })}
      </h4>
      {node.entry && <div className="text-muted">{t('components.studio.canvas.agent.isEntry')}</div>}
      {!held ? (
        <div className="studio-canvas-bring">
          <p className="text-muted">{t(item?.operation === 'Delete' ? 'components.studio.canvas.agent.deleted' : 'components.studio.canvas.agent.notHeld', { name })}</p>
          {item?.operation !== 'Delete' && (
            <button type="button" className="button-secondary button-sm" onClick={bringIn} aria-disabled={blocked || busy ? 'true' : undefined} data-testid="studio-agent-bring" {...tip(blocked || t('tips.studio.canvas.agent.bring'))}>
              {t('components.studio.canvas.agent.bring')}
            </button>
          )}
          <PanelErrors error={serverError} />
        </div>
      ) : (
        <div className="form-grid studio-canvas-form">
          <PanelField id="studio-agent-description" label={t('components.studio.canvas.agent.description')} tipText={t('tips.studio.canvas.agent.description')} error={fe('description')} wide>
            <textarea id="studio-agent-description" rows={3} value={form.description} readOnly={!!blocked} onChange={(e) => change({ description: e.target.value })} data-testid="studio-agent-description" {...tip(t('tips.studio.canvas.agent.description'))} />
          </PanelField>
          {SCHEMA_KEYS.map((key) => (
            <PanelField key={key} id={`studio-agent-${key}`} label={t(`components.studio.canvas.agent.${key}`)} tipText={t(`tips.studio.canvas.agent.${key}`)} error={fe(key) || schemaFailure} hint={t('components.studio.canvas.agent.schemaHint')} wide>
              <textarea
                id={`studio-agent-${key}`}
                className="monospace"
                rows={5}
                spellCheck={false}
                value={form[key]}
                readOnly={!!blocked}
                placeholder='{"type": "object", "properties": {}}'
                onChange={(e) => change({ [key]: e.target.value })}
                data-testid={`studio-agent-${key}`}
                {...tip(t(`tips.studio.canvas.agent.${key}`))}
              />
            </PanelField>
          ))}
          <div className="field span-full">
            <div className="form-section-title" {...tip(t('tips.studio.canvas.agent.assets'))}>
              {t('components.studio.canvas.agent.assets')}
            </div>
            {form.assets.length === 0 && <div className="text-muted">{t(form.hasAssets ? 'components.studio.canvas.agent.noAssets' : 'components.studio.canvas.agent.assetsKept')}</div>}
            {form.assets.map((a, i) => (
              <div key={i} className="studio-canvas-row" data-asset-row={i}>
                <label htmlFor={`studio-agent-asset-${i}`} className="sr-only" {...tip(t('tips.studio.canvas.agent.assetName'))}>
                  {t('components.studio.canvas.agent.assetName')}
                </label>
                <input id={`studio-agent-asset-${i}`} value={a.asset} readOnly={!!blocked} placeholder={t('components.studio.canvas.agent.assetName')} onChange={(e) => setAsset(i, { asset: e.target.value })} {...tip(t('tips.studio.canvas.agent.assetName'))} />
                <label htmlFor={`studio-agent-asset-version-${i}`} className="sr-only" {...tip(t('tips.studio.canvas.agent.assetVersion'))}>
                  {t('components.studio.canvas.agent.assetVersion')}
                </label>
                <input
                  id={`studio-agent-asset-version-${i}`}
                  className="studio-canvas-narrow"
                  inputMode="numeric"
                  value={a.version}
                  readOnly={!!blocked}
                  placeholder={t('components.studio.canvas.agent.latest')}
                  onChange={(e) => setAsset(i, { version: e.target.value })}
                  {...tip(t('tips.studio.canvas.agent.assetVersion'))}
                />
                <button type="button" className="icon-button" aria-label={t('components.studio.canvas.agent.removeAsset', { name: a.asset || i + 1 })} onClick={() => !blocked && change({ assets: form.assets.filter((_, j) => j !== i) })} {...tip(blocked || t('tips.studio.canvas.agent.removeAsset'))}>
                  <TrashIcon size={14} />
                </button>
                {fe(`assets[${i}].version`) && <div className="field-error">{fe(`assets[${i}].version`)}</div>}
                {fe(`assets[${i}].asset`) && <div className="field-error">{fe(`assets[${i}].asset`)}</div>}
              </div>
            ))}
            <button type="button" className="button-ghost button-sm" onClick={() => !blocked && change({ assets: [...form.assets, { asset: '', version: '' }] })} aria-disabled={blocked ? 'true' : undefined} data-testid="studio-agent-add-asset" {...tip(blocked || t('tips.studio.canvas.agent.addAsset'))}>
              <PlusIcon size={14} /> {t('components.studio.canvas.agent.addAsset')}
            </button>
          </div>
          <PanelField id="studio-agent-capabilities" label={t('components.studio.canvas.agent.capabilities')} tipText={t('tips.studio.canvas.agent.capabilities')} error={fe('capabilities')} hint={t(form.hasCapabilities ? 'components.studio.canvas.agent.capabilitiesHint' : 'components.studio.canvas.agent.capabilitiesKept')} wide>
            <input id="studio-agent-capabilities" value={form.capabilitiesText} readOnly={!!blocked} placeholder="pandoc, git" onChange={(e) => change({ capabilitiesText: e.target.value })} data-testid="studio-agent-capabilities" {...tip(t('tips.studio.canvas.agent.capabilities'))} />
          </PanelField>
          <div className="field span-full">
            <div className="form-section-title" {...tip(t('tips.studio.canvas.agent.systemPrompt'))}>
              {t('components.studio.canvas.agent.systemPrompt')}
            </div>
            {deployments.length === 0 ? (
              <div className="text-muted">{t('components.studio.canvas.agent.noDeployments')}</div>
            ) : (
              <ul className="studio-list" data-testid="studio-agent-prompts">
                {deployments.map(({ item: d, fields }) => (
                  <li key={d.name}>
                    {t('components.studio.canvas.agent.promptLine', { environment: fields.environment, deployment: d.name, prompt: joinPromptRef(fields.systemTemplate, fields.systemVersion) || t('components.studio.canvas.agent.builtInPrompt') })}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="button-ghost button-sm" onClick={onShowRuntime} data-testid="studio-agent-show-runtime" {...tip(t('tips.studio.canvas.agent.showRuntime'))}>
              {t('components.studio.canvas.agent.showRuntime')}
            </button>
          </div>
          <div className="span-full">
            <PanelErrors error={serverError} shownFields={['description', 'inputSchema', 'outputSchema', 'capabilities']} failure={failure} failureShown={!!schemaFailure} />
            <PanelActions blocked={blocked} dirty={dirty} busy={busy} savedNote={savedNote} onSave={save} onReset={reset} testId="studio-agent" />
          </div>
        </div>
      )}
    </div>
  );
}
