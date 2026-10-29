import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import AgenticAppReleasePanel from './AgenticAppReleasePanel';
import { tip } from './Tooltip';

/**
 * Agents > Apps, row action Environments (AD9.6): the app's deployments per environment with the difference between
 * two environments, Promote, and the promotion history with Rollback, in a dialog. `permissions` disables Promote and
 * Rollback with a reason when the caller lacks Execute on Promotion for the target environment.
 */
export default function AgenticAppReleaseModal({ app, permissions = null, onClose, onChanged }) {
  const { t } = useTranslation();
  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.apps.release.title')}
      headerMeta={<code className="cell-id">{app?.name}</code>}
      footer={
        <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>
          {t('common.actions.close')}
        </button>
      }
    >
      <AgenticAppReleasePanel app={app} permissions={permissions} onChanged={onChanged} />
    </Modal>
  );
}
