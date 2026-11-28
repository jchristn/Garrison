import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from '../Modal';
import FormFields from '../FormFields';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { errorDetail, errorMessage, fieldErrorMessages, withListItemErrors } from '../../utils/errors';

/**
 * The create or edit form of a ResourceView configuration, opened from somewhere other than its page (LP3.3, LP3.4,
 * LP3.6): the organization designer opens the existing agent, keeper, and change rule forms here, prefilled, instead of
 * keeping copies of them. It uses the configuration's own fields, pick lists, checks, request body, and API, so the
 * form behaves the way it does on its page. `initial` is merged over the configuration's blank record; `mode` is
 * 'create' or 'edit'. onSaved(result) receives what the server stored.
 */
export default function ConfigFormModal({ config, mode = 'create', initial = {}, title, onClose, onSaved, testId = 'config-form' }) {
  const { t, i18n } = useTranslation();
  const { apiClient, principal } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const ctx = useMemo(() => ({ apiClient, principal, tenantId, t, i18n, navigate, addToast }), [apiClient, principal, tenantId, t, i18n, navigate, addToast]);
  const [data, setData] = useState(() => (mode === 'create' ? { ...(config.blank ? config.blank(ctx) : {}), ...initial } : { ...initial }));
  const [options, setOptions] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config.loadOptions || !apiClient) return undefined;
    let active = true;
    config
      .loadOptions(ctx)
      .then((opts) => {
        if (!active) return;
        setOptions(opts || {});
        if (config.withOptions && mode === 'create') setData((d) => config.withOptions(d, opts));
      })
      .catch(() => active && setOptions({}));
    return () => {
      active = false;
    };
  }, [config, ctx, apiClient, mode]);

  const fields = config.fields(data, { ...ctx, mode, options, reloadOptions: () => {} });

  const save = async () => {
    setBusy(true);
    setErrors({});
    try {
      const found = config.validate ? config.validate(data, t, { ...ctx, options }) : null;
      if (found && Object.keys(found).length) {
        setErrors(found);
        return;
      }
      const body = config.toBody ? config.toBody(data, mode, { ...ctx, options }) : data;
      const result = mode === 'edit' ? await config.api.update(apiClient, tenantId, data.id, body) : await config.api.create(apiClient, tenantId, body);
      addToast({ type: 'success', message: t(mode === 'edit' ? 'common.toasts.saved' : 'common.toasts.created') });
      onSaved?.(result);
    } catch (e) {
      const perField = withListItemErrors(t, fieldErrorMessages(t, e, config.fieldErrorSpecial ? config.fieldErrorSpecial(t) : undefined)) || (config.errorFields ? config.errorFields(e, t) : null);
      if (perField) setErrors(perField);
      addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size={config.formSize || 'large'}
      onClose={() => !busy && onClose?.()}
      title={title || t(`resources.${config.id}.${mode === 'edit' ? 'edit' : 'create'}`)}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={save} disabled={busy} data-testid={`${testId}-save`} {...tip(t(mode === 'edit' ? 'tips.modal.saveEdit' : 'tips.modal.saveCreate'))}>
            {busy ? t('common.generic.saving') : t('common.actions.save')}
          </button>
        </>
      }
    >
      <div data-testid={testId}>
        {Object.keys(errors).length > 0 && <div className="error-banner">{t('common.errors.fixFields')}</div>}
        {mode !== 'create' && config.formNotice && config.formNotice(data, { ...ctx, options })}
        <FormFields fields={fields} data={data} errors={errors} onChange={setData} idPrefix={`${testId}-${config.id}`} />
      </div>
    </Modal>
  );
}
