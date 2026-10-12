import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DataTable from './DataTable';
import { tip } from './Tooltip';
import { approvalsConfig } from '../views/runConfigs';
import { pathFor } from '../config/navConfig';

/** Columns of the approvals inbox that make sense inside one run (the agent and run are the page's own). */
const RUN_COLUMNS = ['createdUtc', 'toolName', 'summary', 'status', 'decision', 'decisionSource', 'decidedBy', 'expiresUtc', 'waitMs'];

/**
 * The approvals of one run (P12.3) on the run detail page: what the harness asked for and how each request was
 * decided, with Allow and Deny for the pending ones. `onDecide(approval, decision)` opens the decide dialog.
 */
export default function RunApprovals({ approvals, loading, error, onDecide }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  if (error) return <div className="text-muted" data-testid="run-approvals-error">{error}</div>;
  const ctx = { t, i18n };
  const byKey = Object.fromEntries(approvalsConfig.columns(ctx).map((c) => [c.key, c]));
  const columns = [
    ...RUN_COLUMNS.map((key) => byKey[key]).filter(Boolean),
    {
      key: 'actions',
      label: t('common.generic.actions'),
      tip: t('tips.views.runDetail.approvalActions'),
      headerClass: 'right',
      cellClass: 'actions-cell nowrap',
      render: (a) => (
        <span className="inline-actions">
          {a.status === 'Pending' && (
            <>
              <button type="button" className="button-primary button-sm" onClick={() => onDecide(a, 'Allow')} data-testid="run-approval-allow" {...tip(t('tips.resources.approvals.actions.allow'))}>
                {t('resources.approvals.actions.allow')}
              </button>
              <button type="button" className="button-danger button-sm" onClick={() => onDecide(a, 'Deny')} data-testid="run-approval-deny" {...tip(t('tips.resources.approvals.actions.deny'))}>
                {t('resources.approvals.actions.deny')}
              </button>
            </>
          )}
          <a
            href={pathFor('approvals', a.id)}
            className="button-ghost button-sm"
            {...tip(t('tips.actions.openDetail'))}
            onClick={(e) => {
              e.preventDefault();
              navigate(pathFor('approvals', a.id));
            }}
          >
            {t('common.actions.view')}
          </a>
        </span>
      )
    }
  ];
  return (
    <div data-testid="run-approvals">
      <DataTable columns={columns} items={approvals} loading={loading} emptyMessage={t('views.runDetail.noApprovals')} onRowClick={(a) => navigate(pathFor('approvals', a.id))} />
    </div>
  );
}
