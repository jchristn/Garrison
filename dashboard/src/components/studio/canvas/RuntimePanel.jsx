import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon } from '../../Icons';
import { tip } from '../../Tooltip';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { ENUMS } from '../../../utils/constants';
import { enumLabel } from '../../../utils/enums';
import { draftDeployments, fieldError, liveDeployments } from '../../../utils/studioCanvas';
import { ManifestYamlError, extractDocument, readDeploymentFields, runtimeErrors, writeDeploymentFields } from '../../../utils/manifestYaml';
import { PanelActions, PanelErrors, PanelField, diffFailure, useItemForm } from './panelParts';

const TEXT_FIELDS = ['model', 'effort'];
const NUMBER_FIELDS = ['timeoutSeconds', 'maxTurns', 'maxBudgetUsd'];

/**
 * Deployment and runtime per environment for the selected agent (AD8.4): the agent's Deployment items in the draft,
 * one environment at a time, with model, effort, time limit, maximum turns, budget, the System prompt template with
 * an optional pinned version, and approval rules. Saving rewrites only the chosen deployment's item, so a staging
 * change never touches dev or prod. Live deployments of the agent that the draft does not hold yet are listed with a
 * button that brings one in (its live document becomes a draft item).
 */
export default function RuntimePanel({ agent, draft, diff, agents, deployments, blocked, onSave }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const held = draftDeployments(draft, agent);
  const live = liveDeployments(deployments, agents, agent, draft);
  const [chosen, setChosen] = useState(null);
  const [bringing, setBringing] = useState('');
  const [bringError, setBringError] = useState(null);
  const current = held.find((d) => d.item.name === chosen) || held[0] || null;

  const bringIn = async (deployment) => {
    if (blocked) return;
    setBringing(deployment.name);
    setBringError(null);
    let document = null;
    let failed = null;
    try {
      document = extractDocument(await apiClient.exportManifests(tenantId, { resources: [`Deployment/${deployment.name}`] }), 'Deployment', deployment.name);
    } catch (e) {
      failed = e;
    }
    if (document) {
      const result = await onSave('Deployment', deployment.name, document);
      if (result.ok) setChosen(deployment.name);
      else if (result.error) setBringError(result.error);
    } else setBringError(failed || { message: t('components.studio.canvas.runtime.exportMissing', { name: deployment.name }) });
    setBringing('');
  };

  return (
    <div className="studio-canvas-props" data-testid="studio-runtime-panel" data-agent={agent}>
      <h4 className="section-title" {...tip(t('tips.studio.canvas.runtime.title'))}>
        {t('components.studio.canvas.runtime.title', { name: agent })}
      </h4>
      {held.length === 0 ? (
        <p className="text-muted">{t('components.studio.canvas.runtime.none', { name: agent })}</p>
      ) : (
        <>
          <PanelField id="studio-runtime-deployment" label={t('components.studio.canvas.runtime.deployment')} tipText={t('tips.studio.canvas.runtime.deployment')}>
            <select id="studio-runtime-deployment" value={current.item.name} onChange={(e) => setChosen(e.target.value)} data-testid="studio-runtime-deployment" {...tip(t('tips.studio.canvas.runtime.deployment'))}>
              {held.map(({ item, fields }) => (
                <option key={item.name} value={item.name}>
                  {t('components.studio.canvas.runtime.option', { environment: fields.environment, name: item.name })}
                </option>
              ))}
            </select>
          </PanelField>
          <RuntimeForm key={current.item.name} item={current.item} diff={diff} blocked={blocked} onSave={onSave} />
        </>
      )}
      <div className="form-section-title" {...tip(t('tips.studio.canvas.runtime.live'))}>
        {t('components.studio.canvas.runtime.live')}
      </div>
      {live.length === 0 ? (
        <div className="text-muted">{t('components.studio.canvas.runtime.noLive')}</div>
      ) : (
        <ul className="studio-list" data-testid="studio-runtime-live">
          {live.map((d) => (
            <li key={d.id || d.name} className="flex gap-sm items-center" data-live-deployment={d.name}>
              <span>{t('components.studio.canvas.runtime.option', { environment: d.environment || 'dev', name: d.name })}</span>
              <button
                type="button"
                className="button-ghost button-sm"
                onClick={() => !bringing && bringIn(d)}
                aria-disabled={blocked || bringing ? 'true' : undefined}
                data-testid={`studio-runtime-bring-${d.name}`}
                {...tip(blocked || t('tips.studio.canvas.runtime.bring', { name: d.name }))}
              >
                {bringing === d.name ? t('common.generic.saving') : t('components.studio.canvas.runtime.bring')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <PanelErrors error={bringError} />
    </div>
  );
}

function RuntimeForm({ item, diff, blocked, onSave }) {
  const { t } = useTranslation();
  const { form, change, reset, saved, dirty } = useItemForm(item.document, readDeploymentFields);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const failure = diffFailure(diff, 'Deployment', item.name);
  const lock = blocked ? { readOnly: true } : {};

  const save = async () => {
    const codes = runtimeErrors(form);
    const e = {};
    for (const [field, code] of Object.entries(codes)) e[field] = t(`components.studio.canvas.runtime.errors.${code}`);
    setErrors(e);
    if (Object.keys(e).length) return;
    let document;
    try {
      document = writeDeploymentFields(item.document, form);
    } catch (err) {
      setServerError(err instanceof ManifestYamlError ? { message: t('components.studio.canvas.panel.unparsable', { message: err.message }) } : err);
      return;
    }
    setBusy(true);
    setServerError(null);
    setSavedNote('');
    const result = await onSave('Deployment', item.name, document);
    setBusy(false);
    if (result.ok) {
      saved();
      setSavedNote(t('components.studio.canvas.panel.saved', { item: `Deployment/${item.name}` }));
    } else if (result.error) setServerError(result.error);
  };

  const fe = (field) => errors[field] || fieldError(t, serverError, field) || fieldError(t, serverError, `spec.${field}`);
  const setRule = (i, patch) => change({ approvalRules: form.approvalRules.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  return (
    <div className="form-grid studio-canvas-form" data-testid="studio-runtime-form" data-deployment={item.name}>
      <p className="field-hint span-full">{t('components.studio.canvas.runtime.scope', { environment: form.environment, name: item.name, profile: form.harnessProfile || '-' })}</p>
      {TEXT_FIELDS.map((key) => (
        <PanelField key={key} id={`studio-runtime-${key}`} label={t(`components.studio.canvas.runtime.fields.${key}`)} tipText={t(`tips.studio.canvas.runtime.fields.${key}`)} error={fe(key)}>
          <input id={`studio-runtime-${key}`} value={form[key]} onChange={(e) => change({ [key]: e.target.value })} data-testid={`studio-runtime-${key}`} {...lock} {...tip(t(`tips.studio.canvas.runtime.fields.${key}`))} />
        </PanelField>
      ))}
      {NUMBER_FIELDS.map((key) => (
        <PanelField key={key} id={`studio-runtime-${key}`} label={t(`components.studio.canvas.runtime.fields.${key}`)} tipText={t(`tips.studio.canvas.runtime.fields.${key}`)} error={fe(key)} hint={t(`components.studio.canvas.runtime.hints.${key}`)}>
          <input
            id={`studio-runtime-${key}`}
            inputMode={key === 'maxBudgetUsd' ? 'decimal' : 'numeric'}
            value={form[key]}
            onChange={(e) => change({ [key]: e.target.value })}
            data-testid={`studio-runtime-${key}`}
            {...lock}
            {...tip(t(`tips.studio.canvas.runtime.fields.${key}`))}
          />
        </PanelField>
      ))}
      <PanelField id="studio-runtime-system" label={t('components.studio.canvas.runtime.fields.systemTemplate')} tipText={t('tips.studio.canvas.runtime.fields.systemTemplate')} error={fe('prompts') || fe('prompts.System')}>
        <input id="studio-runtime-system" value={form.systemTemplate} placeholder={t('components.studio.canvas.runtime.builtIn')} onChange={(e) => change({ systemTemplate: e.target.value })} data-testid="studio-runtime-system" {...lock} {...tip(t('tips.studio.canvas.runtime.fields.systemTemplate'))} />
      </PanelField>
      <PanelField id="studio-runtime-system-version" label={t('components.studio.canvas.runtime.fields.systemVersion')} tipText={t('tips.studio.canvas.runtime.fields.systemVersion')} error={fe('systemVersion')}>
        <input
          id="studio-runtime-system-version"
          inputMode="numeric"
          value={form.systemVersion}
          placeholder={t('components.studio.canvas.agent.latest')}
          onChange={(e) => change({ systemVersion: e.target.value })}
          data-testid="studio-runtime-system-version"
          {...lock}
          {...tip(t('tips.studio.canvas.runtime.fields.systemVersion'))}
        />
      </PanelField>
      <div className="form-section-title span-full" {...tip(t('tips.studio.canvas.runtime.approvals'))}>
        {t('components.studio.canvas.runtime.approvals')}
      </div>
      <div className="field">
        <label className="checkbox-label" {...tip(t('tips.studio.canvas.runtime.fields.approvalsEnabled'))}>
          <input type="checkbox" checked={form.approvalsEnabled} disabled={!!blocked} onChange={(e) => change({ approvalsEnabled: e.target.checked })} data-testid="studio-runtime-approvals" {...tip(t('tips.studio.canvas.runtime.fields.approvalsEnabled'))} />
          {t('components.studio.canvas.runtime.fields.approvalsEnabled')}
        </label>
      </div>
      <PanelField id="studio-runtime-default-action" label={t('components.studio.canvas.runtime.fields.approvalDefaultAction')} tipText={t('tips.studio.canvas.runtime.fields.approvalDefaultAction')} error={fe('approvalDefaultAction')}>
        <select id="studio-runtime-default-action" value={form.approvalDefaultAction} disabled={!!blocked} onChange={(e) => change({ approvalDefaultAction: e.target.value })} {...tip(t('tips.studio.canvas.runtime.fields.approvalDefaultAction'))}>
          {ENUMS.approvalRuleAction.map((a) => (
            <option key={a} value={a}>
              {enumLabel(t, 'approvalRuleAction', a)}
            </option>
          ))}
        </select>
      </PanelField>
      <div className="field span-full">
        {form.approvalRules.length === 0 && <div className="text-muted">{t('components.studio.canvas.runtime.noRules')}</div>}
        {form.approvalRules.map((r, i) => (
          <div key={i} className="studio-canvas-row" data-rule-row={i}>
            <label htmlFor={`studio-rule-action-${i}`} className="sr-only" {...tip(t('tips.studio.canvas.runtime.rule.action'))}>
              {t('components.studio.canvas.runtime.rule.action')}
            </label>
            <select id={`studio-rule-action-${i}`} value={r.action} disabled={!!blocked} onChange={(e) => setRule(i, { action: e.target.value })} {...tip(t('tips.studio.canvas.runtime.rule.action'))}>
              {ENUMS.approvalRuleAction.map((a) => (
                <option key={a} value={a}>
                  {enumLabel(t, 'approvalRuleAction', a)}
                </option>
              ))}
            </select>
            <label htmlFor={`studio-rule-pattern-${i}`} className="sr-only" {...tip(t('tips.studio.canvas.runtime.rule.pattern'))}>
              {t('components.studio.canvas.runtime.rule.pattern')}
            </label>
            <input id={`studio-rule-pattern-${i}`} value={r.pattern} placeholder="Bash(git *)" onChange={(e) => setRule(i, { pattern: e.target.value })} {...lock} {...tip(t('tips.studio.canvas.runtime.rule.pattern'))} />
            <label htmlFor={`studio-rule-input-${i}`} className="sr-only" {...tip(t('tips.studio.canvas.runtime.rule.inputPattern'))}>
              {t('components.studio.canvas.runtime.rule.inputPattern')}
            </label>
            <input id={`studio-rule-input-${i}`} value={r.inputPattern} placeholder={t('components.studio.canvas.runtime.rule.inputPlaceholder')} onChange={(e) => setRule(i, { inputPattern: e.target.value })} {...lock} {...tip(t('tips.studio.canvas.runtime.rule.inputPattern'))} />
            <button type="button" className="icon-button" aria-label={t('components.studio.canvas.runtime.rule.remove', { number: i + 1 })} onClick={() => !blocked && change({ approvalRules: form.approvalRules.filter((_, j) => j !== i) })} {...tip(blocked || t('tips.studio.canvas.runtime.rule.remove'))}>
              <TrashIcon size={14} />
            </button>
            {fe(`approvalRules[${i}].pattern`) && <div className="field-error">{fe(`approvalRules[${i}].pattern`)}</div>}
          </div>
        ))}
        <button
          type="button"
          className="button-ghost button-sm"
          onClick={() => !blocked && change({ approvalRules: [...form.approvalRules, { action: 'Ask', pattern: '', inputPattern: '', description: '' }] })}
          aria-disabled={blocked ? 'true' : undefined}
          data-testid="studio-runtime-add-rule"
          {...tip(blocked || t('tips.studio.canvas.runtime.rule.add'))}
        >
          <PlusIcon size={14} /> {t('components.studio.canvas.runtime.rule.add')}
        </button>
      </div>
      <div className="span-full">
        <PanelErrors error={serverError} shownFields={[...TEXT_FIELDS, ...NUMBER_FIELDS, 'prompts', 'approvalDefaultAction']} failure={failure} />
        <PanelActions blocked={blocked} dirty={dirty} busy={busy} savedNote={savedNote} onSave={save} onReset={reset} testId="studio-runtime" />
      </div>
    </div>
  );
}
