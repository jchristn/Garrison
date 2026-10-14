import { useTranslation } from 'react-i18next';
import { FormField } from './FormFields';
import { PlusIcon, TrashIcon } from './Icons';
import { tip } from './Tooltip';
import { PIPELINE_LIMITS } from '../utils/constants';
import { enumOptions } from '../utils/enums';
import { resourceTip, optionalText } from '../utils/tips';
import { blankStage, moveItem, stageErrors, deploymentsForAgent, handoffTemplates } from '../utils/pipelines';

const label = (t, name) => t(`resources.pipelines.fields.${name}`);
const stageTip = (t, name) => resourceTip(t, 'pipelines', `stagesItems.${name}`);
const hint = (t, name, values) => optionalText(t, `resources.pipelines.hints.${name}`, values) || undefined;

/**
 * Field descriptors for one pipeline stage (P12.9), in display order. Options come from `options` (agents,
 * deployments, templates); the deployment picker lists only the stage agent's deployments and the handoff template
 * picker only Task templates. Review settings show when the stage requires a review. Also used by the tooltip tests.
 */
export function stageFields(t, stage, options = {}) {
  const s = stage || {};
  const agents = options.agents || [];
  const deployments = deploymentsForAgent(options.deployments, s.agentId);
  const templates = handoffTemplates(options.templates, s.handoffTemplateId);
  const number = (name, extra = {}) => ({ name, type: 'number', label: label(t, name), tip: stageTip(t, name), min: PIPELINE_LIMITS[name]?.min, max: PIPELINE_LIMITS[name]?.max, hint: hint(t, name, PIPELINE_LIMITS[name]), ...extra });
  const fields = [
    { name: 'name', type: 'text', label: label(t, 'stageName'), tip: stageTip(t, 'name'), required: true },
    {
      name: 'agentId',
      type: 'select',
      label: label(t, 'agentId'),
      tip: stageTip(t, 'agentId'),
      required: true,
      noneLabel: t('resources.pipelines.chooseAgent'),
      options: [{ value: '', label: t('resources.pipelines.chooseAgent') }, ...agents.map((a) => ({ value: a.id, label: a.displayName || a.name }))].filter((o, i, all) => all.findIndex((x) => x.value === o.value) === i)
    },
    {
      name: 'deploymentId',
      type: 'select',
      label: label(t, 'deploymentId'),
      tip: stageTip(t, 'deploymentId'),
      noneLabel: t('resources.pipelines.anyDeployment'),
      hint: s.agentId && !deployments.length ? t('resources.pipelines.hints.noDeployments') : undefined,
      options: [...deployments.map((d) => ({ value: d.id, label: d.name })), ...(s.deploymentId && !deployments.some((d) => d.id === s.deploymentId) ? [{ value: s.deploymentId, label: s.deploymentId }] : [])]
    },
    {
      name: 'handoffTemplateId',
      type: 'select',
      label: label(t, 'handoffTemplateId'),
      tip: stageTip(t, 'handoffTemplateId'),
      noneLabel: t('resources.pipelines.defaultHandoff'),
      options: templates.map((x) => ({ value: x.id, label: x.isBuiltIn ? `${x.name} (${t('common.generic.builtIn')})` : x.name }))
    },
    number('handoffTemplateVersion', { min: 1, max: undefined, hint: hint(t, 'handoffTemplateVersion'), showIf: (x) => !!x.handoffTemplateId }),
    number('outputCharLimit', { step: 1000 }),
    number('maxAttempts'),
    { name: 'continueOnFailure', type: 'checkbox', label: label(t, 'continueOnFailure'), tip: stageTip(t, 'continueOnFailure') },
    { name: 'requiresReview', type: 'checkbox', label: label(t, 'requiresReview'), tip: stageTip(t, 'requiresReview') },
    number('reviewTimeoutSeconds', { showIf: (x) => !!x.requiresReview }),
    { name: 'reviewTimeoutAction', type: 'select', required: true, label: label(t, 'reviewTimeoutAction'), tip: stageTip(t, 'reviewTimeoutAction'), options: enumOptions(t, 'pipelineReviewDecision', ['Approve', 'Reject']), showIf: (x) => !!x.requiresReview && Number(x.reviewTimeoutSeconds) > 0 },
    number('maxRevisions', { showIf: (x) => !!x.requiresReview }),
    { name: 'description', type: 'textarea', rows: 2, label: label(t, 'stageDescription'), tip: stageTip(t, 'description'), span: 'full' },
    { name: 'parameters', type: 'keyValue', label: label(t, 'parameters'), tip: stageTip(t, 'parameters'), keyLabel: t('resources.pipelines.parameterName'), valueLabel: t('resources.pipelines.parameterValue'), hint: hint(t, 'parameters') }
  ];
  return fields;
}

/** A stage's parameters ({ name, value }) as key/value editor rows, and back. */
const toRows = (parameters) => (parameters || []).map((p) => ({ key: p.name ?? '', value: p.value ?? '' }));
const fromRows = (rows) => (rows || []).map((r) => ({ name: r.key ?? '', value: r.value ?? '' }));

/**
 * Ordered stage editor for a pipeline definition (P12.9): add, remove, and reorder stages; each stage has an agent,
 * an optional deployment of that agent (none means weighted selection), an optional Task handoff template with an
 * optional pinned version, limits, review settings, and run parameters. Errors use the server's stages[i].field keys.
 */
export default function PipelineStagesEditor({ value, onChange, disabled = false, errors = {}, options = {}, maxStages = PIPELINE_LIMITS.maxStages }) {
  const { t } = useTranslation();
  const stages = Array.isArray(value) ? value : [];
  const update = (i, next) => onChange(stages.map((s, j) => (j === i ? next : s)));

  const change = (i, stage, name, v) => {
    const next = { ...stage, [name]: v };
    // A deployment belongs to one agent: picking another agent clears a deployment of the previous one.
    if (name === 'agentId' && stage.deploymentId && !deploymentsForAgent(options.deployments, v).some((d) => d.id === stage.deploymentId)) next.deploymentId = '';
    if (name === 'handoffTemplateId' && !v) next.handoffTemplateVersion = null;
    update(i, next);
  };

  return (
    <div className="pipeline-stages" data-testid="pipeline-stages">
      <div className="form-section">
        <div className="form-section-title" {...tip(t('tips.resources.pipelines.stages'))}>
          {t('resources.pipelines.fields.stages')} <span className="text-muted">{t('resources.pipelines.stageCount', { count: stages.length, max: maxStages })}</span>
        </div>
        <div className="field-hint">{t('resources.pipelines.hints.stages')}</div>
        {errors.stages && (
          <div className="field-error" role="alert">
            {errors.stages}
          </div>
        )}
      </div>
      {stages.length === 0 && <div className="text-muted object-list-empty">{t('resources.pipelines.noStages')}</div>}
      {stages.map((stage, i) => {
        const own = stageErrors(errors, i);
        const fields = stageFields(t, stage, options).filter((f) => !f.showIf || f.showIf(stage));
        return (
          <section className="panel pipeline-stage" key={i} data-stage={i + 1} aria-label={t('resources.pipelines.stageHeading', { position: i + 1, name: stage.name || '' })}>
            <div className="pipeline-stage-head">
              <h4 className="section-title" {...tip(t('tips.resources.pipelines.stageHeading'))}>
                {t('resources.pipelines.stageHeading', { position: i + 1, name: stage.name || '' })}
              </h4>
              <div className="object-list-actions">
                <button type="button" className="icon-button" disabled={disabled || i === 0} onClick={() => onChange(moveItem(stages, i, -1))} aria-label={t('components.form.moveUp')} data-testid={`stage-${i + 1}-up`} {...tip(t('tips.resources.pipelines.moveUp'))}>
                  {'↑'}
                </button>
                <button type="button" className="icon-button" disabled={disabled || i === stages.length - 1} onClick={() => onChange(moveItem(stages, i, 1))} aria-label={t('components.form.moveDown')} data-testid={`stage-${i + 1}-down`} {...tip(t('tips.resources.pipelines.moveDown'))}>
                  {'↓'}
                </button>
                <button type="button" className="icon-button" disabled={disabled || stages.length <= 1} onClick={() => onChange(stages.filter((_, j) => j !== i))} aria-label={t('resources.pipelines.removeStage')} data-testid={`stage-${i + 1}-remove`} {...tip(t('tips.resources.pipelines.removeStage'))}>
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
            <div className="form-grid">
              {fields.map((f) => (
                <FormField
                  key={f.name}
                  field={f}
                  id={`pipelines-stage-${i}-${f.name}`}
                  value={f.name === 'parameters' ? toRows(stage.parameters) : stage[f.name]}
                  error={own[f.name]}
                  disabled={disabled}
                  onChange={(v) => change(i, stage, f.name, f.name === 'parameters' ? fromRows(v) : v)}
                />
              ))}
            </div>
          </section>
        );
      })}
      <button type="button" className="button-secondary button-sm" disabled={disabled || stages.length >= maxStages} onClick={() => onChange([...stages, blankStage(stages.length)])} data-testid="pipeline-add-stage" {...tip(t('tips.resources.pipelines.addStage'))}>
        <PlusIcon size={14} /> {t('resources.pipelines.addStage')}
      </button>
    </div>
  );
}
