import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from '../Modal';
import FormFields from '../FormFields';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { pathFor } from '../../config/navConfig';
import { errorMessage } from '../../utils/errors';
import { ORGANIZATION_LIMITS } from '../../utils/constants';
import { orgErrorMessage, organizationFormErrors, organizationFormToBody, organizationToForm } from '../../utils/organizations';
import { ORG_TEMPLATES, appliedOrganizationId, orgTemplate, templateContents } from '../../utils/orgTemplates';

/**
 * Start a new organization from a template (LP3.8). Blank asks for a name and creates an empty organization. Gerbil
 * (one keeper) and Site reliability (examples/autonomous/site-reliability-org) apply the example manifest through the
 * manifest apply route: first as a dry run, so the dialog names everything the apply will create or change, then for
 * real once the person confirms. The new organization opens in the Design tab. Applying needs the manifest apply
 * permission, the same as the Manifests page; the server refuses a caller without it.
 */
export default function OrgTemplateModal({ onClose }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [chosen, setChosen] = useState('blank');
  const [blank, setBlank] = useState(() => organizationToForm(null));
  const [blankErrors, setBlankErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const template = orgTemplate(chosen);
  const contents = templateContents(template?.manifest);

  const pick = (id) => {
    setChosen(id);
    setPreview(null);
    setError('');
  };

  const open = (id) => navigate(pathFor('organizations', id, { tab: 'design' }));

  const dryRun = async () => {
    setBusy(true);
    setError('');
    try {
      setPreview(await apiClient.applyManifest(tenantId, template.manifest, true));
    } catch (e) {
      setPreview(e?.body && typeof e.body === 'object' && Array.isArray(e.body.items) ? e.body : null);
      setError(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    setError('');
    try {
      if (!template.manifest) {
        const found = organizationFormErrors(blank, t);
        setBlankErrors(found);
        if (Object.keys(found).length) return;
        const created = await apiClient.createOrganization(tenantId, organizationFormToBody(blank));
        addToast({ type: 'success', message: t('common.toasts.created') });
        onClose?.();
        if (created?.id) open(created.id);
        return;
      }
      const result = await apiClient.applyManifest(tenantId, template.manifest, false);
      addToast({ type: 'success', message: t('views.manifests.applied') });
      const id = appliedOrganizationId(result, template.organization) || template.organization;
      onClose?.();
      open(id);
    } catch (e) {
      if (e?.body && typeof e.body === 'object' && Array.isArray(e.body.items)) setPreview(e.body);
      setError(template?.manifest ? errorMessage(t, e) : orgErrorMessage(t, e));
    } finally {
      setBusy(false);
    }
  };

  const items = preview?.items || [];
  const ready = !template?.manifest || (preview && !preview.failedCount && !items.some((i) => i.result === 'Failed'));
  const blankFields = [
    { name: 'name', type: 'text', required: true, placeholder: 'refund-operations', label: t('resources.organizations.fields.name'), tip: t('tips.resources.organizations.name'), hint: t('resources.organizations.hints.name', { max: ORGANIZATION_LIMITS.nameMax }) },
    { name: 'description', type: 'textarea', rows: 2, label: t('resources.organizations.fields.description'), tip: t('tips.resources.organizations.description') }
  ];

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose?.()}
      title={t('components.orgDesigner.templates.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          {template?.manifest && (
            <button type="button" className="button-secondary" onClick={dryRun} disabled={busy} data-testid="org-template-preview" {...tip(t('tips.orgDesigner.templates.preview'))}>
              {t('components.orgDesigner.templates.preview')}
            </button>
          )}
          <button
            type="button"
            className="button-primary"
            onClick={() => ready && !busy && apply()}
            aria-disabled={!ready || busy ? 'true' : undefined}
            data-testid="org-template-apply"
            {...tip(ready ? t('tips.orgDesigner.templates.apply') : t('tips.orgDesigner.templates.previewFirst'))}
          >
            {busy ? t('common.generic.saving') : template?.manifest ? t('components.orgDesigner.templates.apply') : t('components.orgDesigner.templates.create')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="org-templates">
        <p className="text-muted">{t('components.orgDesigner.templates.intro')}</p>
        <fieldset className="org-template-choices">
          <legend className="sr-only">{t('components.orgDesigner.templates.title')}</legend>
          {ORG_TEMPLATES.map((x) => (
            <label key={x.id} className={`org-template-choice${chosen === x.id ? ' is-chosen' : ''}`} data-template={x.id} {...tip(t(`tips.orgDesigner.templates.${x.id}`))}>
              <input type="radio" name="org-template" value={x.id} checked={chosen === x.id} onChange={() => pick(x.id)} data-testid={`org-template-${x.id}`} />
              <span>
                <strong>{t(`components.orgDesigner.templates.${x.id}.name`)}</strong>
                <span className="text-muted">{t(`components.orgDesigner.templates.${x.id}.body`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {!template?.manifest ? (
          <FormFields idPrefix="org-template-blank" fields={blankFields} data={blank} onChange={setBlank} errors={blankErrors} disabled={busy} />
        ) : (
          <div data-testid="org-template-contents">
            <div className="form-section-title" {...tip(t('tips.orgDesigner.templates.contents'))}>
              {t('components.orgDesigner.templates.contents', { count: contents.length })}
            </div>
            <ul className="org-template-items">
              {contents.map((c, i) => {
                const item = items.find((x) => x.kind === c.kind && x.name === c.name) || items[i] || null;
                return (
                  <li key={`${c.kind}/${c.name}`} data-template-item={`${c.kind}/${c.name}`}>
                    <code>{`${c.kind}/${c.name}`}</code>
                    {item?.message ? <span className={item.result === 'Failed' ? 'field-error' : 'text-muted'}>{` ${item.message}`}</span> : null}
                  </li>
                );
              })}
            </ul>
            <div className="warning-banner" role="note">
              {t('components.orgDesigner.templates.ticks')}
            </div>
            {!preview && <p className="field-hint">{t('components.orgDesigner.templates.previewHint')}</p>}
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert" data-testid="org-template-error">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
