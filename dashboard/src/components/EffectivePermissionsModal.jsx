import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CodeBlock from './CodeBlock';
import { EmptyNote, ErrorBanner, LoadingState } from './States';
import { Badge } from './StatusBadge';
import LocalTableFrame from './LocalTableFrame';
import { errorMessage } from '../utils/errors';
import { enumLabel, enumList } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Effective permissions for a user or credential, with a hasPermission matrix when provided. */
export default function EffectivePermissionsModal({ load, title, onClose }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    load()
      .then(setData)
      .catch((e) => setError(e));
  }, [load]);

  const grants = data?.grants || data?.effectiveGrants || [];
  const col = (key, render) => ({ key, label: t(`components.permissions.${key}`), tip: t(`tips.permissions.${key}`), render });
  const columns = [
    col('source', (g) => g.source || '-'),
    col('type', (g) => (
      <Badge tone={g.permissionType === 'Deny' ? 'danger' : 'success'} tip={enumTip(t, 'permissionType', g.permissionType || 'Permit')}>
        {enumLabel(t, 'permissionType', g.permissionType || 'Permit')}
      </Badge>
    )),
    col('resources', (g) => enumList(t, 'resourceType', g.resourceTypes)),
    col('operations', (g) => enumList(t, 'operationType', g.operations || g.operationTypes)),
    col('scope', (g) => (g.scope === 'Resource' ? `${enumLabel(t, 'resourceScope', g.scope)}: ${g.resourceId}` : enumLabel(t, 'resourceScope', g.scope || 'Tenant')))
  ];
  return (
    <Modal open size="large" onClose={onClose} title={t('components.permissions.title')} headerMeta={title}>
      {!data && !error && <LoadingState />}
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      {data && (
        <>
          {grants.length === 0 ? (
            <EmptyNote>{t('components.permissions.none')}</EmptyNote>
          ) : (
            <LocalTableFrame tableId="effective-permissions" columns={columns} items={grants} />
          )}
          <details className="details-section">
            <summary>{t('common.actions.viewJson')}</summary>
            <CodeBlock value={data} prettyJson />
          </details>
        </>
      )}
    </Modal>
  );
}
