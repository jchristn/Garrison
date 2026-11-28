import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Modal from '../components/Modal';
import LocalTableFrame from '../components/LocalTableFrame';
import FormFields from '../components/FormFields';
import EvalCaseModal from '../components/EvalCaseModal';
import EvalRunModal from '../components/EvalRunModal';
import { EvalDetail, EvalLink, EvalSection } from '../components/EvalDetailParts';
import { EvalRunStatusBadge, EvalSetStateBadge, EvalVerdictBadge } from '../components/EvalBadges';
import { EmptyNote, EmptyState, ErrorBanner, LoadingState } from '../components/States';
import { CodeIcon, PlusIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { evalFieldErrors } from '../utils/evalErrors';
import { enumLabel, enumList } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatDateTime, formatRelativeTime, truncate } from '../i18n/formatters';
import { effectiveScorers, evalSetFormErrors, evalSetFormToBody, evalSetToForm, needsJudge, scoreText } from '../utils/evaluations';
import { evalSetsConfig } from './resourceConfigs';
import { targetText } from './evaluationConfigs';
import { deniedProps, permissionDenied } from '../utils/permissions';
import useCallerPermissions from '../hooks/useCallerPermissions';
import RowActions from '../components/RowActions';

/**
 * One eval set version (AA9.15): its state, origin, judge, tags, and who wrote and approved it; its cases with their
 * input, expected text, scorers, and whether they are hidden, each editable in the case form; the other versions of the
 * set; and its recent eval runs. Approve freezes a draft so it can gate promotions; editing an approved version (the
 * set or a case) opens the next version as a draft, and the page follows it. Run starts an eval run; ?run=1 opens the
 * run form at once (the playground's "Run set" link adds ?target=AgentRevision&agent=<name>).
 */
export default function EvalSetDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [set, setSet] = useState(null);
  const [cases, setCases] = useState([]);
  const [versions, setVersions] = useState([]);
  const [runs, setRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const runAsked = useRef(false);
  const permissions = useCallerPermissions();
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    apiClient
      .getEvalSet(tenantId, recordId)
      .then(async (s) => {
        setSet(s);
        setError(null);
        const [items, all, recent] = await Promise.all([
          apiClient.listEvalCases(tenantId, s.id).catch(() => []),
          apiClient
            .listEvalSets(tenantId, { pageNumber: 1, pageSize: 200, search: s.name, latestOnly: false })
            .then((r) => r.items || [])
            .catch(() => []),
          apiClient
            .listEvalRuns(tenantId, { pageNumber: 1, pageSize: 10, set: s.id })
            .then((r) => r.items || [])
            .catch(() => [])
        ]);
        setCases(Array.isArray(items) ? items : items?.items || []);
        setVersions(all.filter((v) => v.name === s.name).sort((a, b) => b.version - a.version));
        setRuns(recent);
      })
      .catch((e) => setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setAgents(r.items || []))
      .catch(() => setAgents([]));
  }, [apiClient, tenantId]);

  // ?run=1 opens the run form once the set is in, then leaves the URL as it was without the run parameters.
  useEffect(() => {
    if (!set || runAsked.current || searchParams.get('run') !== '1') return;
    runAsked.current = true;
    const initial = {};
    if (searchParams.get('target') === 'AgentRevision') initial.targetType = 'AgentRevision';
    if (searchParams.get('agent')) {
      initial.targetType = 'AgentRevision';
      initial.agentId = searchParams.get('agent');
    }
    setModal({ kind: 'run', initial });
    const next = new URLSearchParams(searchParams);
    for (const k of ['run', 'target', 'agent']) next.delete(k);
    setSearchParams(next, { replace: true });
  }, [set, searchParams, setSearchParams]);

  /** Follow a change to another version (an edit of an approved version answers with the next one). */
  const follow = (versionId) => {
    if (versionId && versionId !== set?.id) navigate(pathFor('evaluations', versionId));
    else load();
  };

  if (error && !set) {
    return (
      <div>
        <PageHeader title={t('evals.setDetail.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('evals.setDetail.notFoundTitle')} body={t('evals.setDetail.notFoundBody')} />}
      </div>
    );
  }
  if (!set) return <LoadingState />;

  const s = set;
  const approved = s.state === 'Approved';
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'short' })}</span> : '-');
  const missingJudge = !s.judgeAgent && needsJudge(cases);
  const close = () => setModal(null);
  const label = (name) => t(`evals.setDetail.fields.${name}`);
  const tipOf = (name) => t(`tips.evals.setDetail.fields.${name}`);

  const saveSet = async () => {
    const found = evalSetFormErrors(editForm, t, 'edit');
    setEditErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const saved = await apiClient.updateEvalSet(tenantId, s.id, evalSetFormToBody(editForm, 'edit'));
      addToast({ type: 'success', message: t(saved?.id && saved.id !== s.id ? 'evals.toasts.setSavedNextVersion' : 'common.toasts.saved', { version: saved?.version }) });
      setEditForm(null);
      follow(saved?.id);
    } catch (e) {
      setEditErrors(evalFieldErrors(t, e) || {});
      addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    try {
      await apiClient.approveEvalSet(tenantId, s.id);
      addToast({ type: 'success', message: t('evals.toasts.approved', { name: s.name, version: s.version }) });
      close();
      load();
    } catch (e) {
      addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      close();
    }
  };

  const removeSet = async () => {
    try {
      await apiClient.deleteEvalSet(tenantId, s.id);
      addToast({ type: 'success', message: t('common.toasts.deleted') });
      navigate(s.previousVersionId ? pathFor('evaluations', s.previousVersionId) : pathFor('evaluations'));
    } catch (e) {
      addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      close();
    }
  };

  const removeCase = async (item) => {
    try {
      const draft = await apiClient.deleteEvalCase(tenantId, s.id, item.id);
      addToast({ type: 'success', message: t(draft?.id && draft.id !== s.id ? 'evals.toasts.caseRemovedNextVersion' : 'evals.toasts.caseRemoved', { version: draft?.version }) });
      close();
      follow(draft?.id);
    } catch (e) {
      addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      close();
    }
  };

  // UT-03: write actions stay visible but disabled, with the missing permission as the tooltip.
  const deniedUpdate = permissionDenied(t, permissions, 'EvalSet', 'Update', { resourceId: s.id });
  const deniedDelete = permissionDenied(t, permissions, 'EvalSet', 'Delete', { resourceId: s.id });
  const deniedRun = permissionDenied(t, permissions, 'EvalRun', 'Execute');
  const editFields = evalSetsConfig.fields(editForm || {}, { t, i18n, options: { agents }, mode: 'edit' });

  return (
    <div className="page-flow" data-testid="eval-set-detail">
      <PageHeader
        title={s.name}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={s.id} max={40} /> <span className="pill pill-neutral">{t('evals.versionShort', { version: s.version })}</span> <EvalSetStateBadge state={s.state} t={t} />
          </span>
        }
        back={
          <EvalLink to={pathFor('evaluations')} tipText={t('tips.evals.setDetail.back')} testId="eval-set-back">
            {t('evals.setDetail.back')}
          </EvalLink>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setModal({ kind: 'json' })} {...tip(t('tips.evals.setDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            <button type="button" className="button-secondary" onClick={() => !deniedUpdate && setEditForm(evalSetToForm(s))} data-testid="eval-set-edit" {...deniedProps(deniedUpdate)} {...tip(deniedUpdate || t(approved ? 'tips.evals.setDetail.editApproved' : 'tips.evals.setDetail.edit'))}>
              {t('common.actions.edit')}
            </button>
            {!approved && (
              <button type="button" className="button-danger" onClick={() => !deniedDelete && setModal({ kind: 'delete' })} data-testid="eval-set-delete" {...deniedProps(deniedDelete)} {...tip(deniedDelete || t('tips.evals.setDetail.delete'))}>
                {t('common.actions.delete')}
              </button>
            )}
            {!approved && (
              <button type="button" className="button-secondary" onClick={() => !deniedUpdate && setModal({ kind: 'approve' })} disabled={!cases.length} data-testid="eval-set-approve" {...deniedProps(deniedUpdate)} {...tip(deniedUpdate || t(cases.length ? 'tips.evals.setDetail.approve' : 'tips.evals.setDetail.approveEmpty'))}>
                {t('evals.setDetail.approve')}
              </button>
            )}
            <button type="button" className="button-primary" onClick={() => !deniedRun && setModal({ kind: 'run', initial: {} })} disabled={!cases.length} data-testid="eval-set-run" {...deniedProps(deniedRun)} {...tip(deniedRun || t(cases.length ? 'tips.evals.actions.runSet' : 'tips.evals.setDetail.runEmpty'))}>
              {t('evals.actions.runSet')}
            </button>
          </>
        }
      />

      {approved && (
        <p className="info-banner" data-testid="eval-set-approved-note">
          {t('evals.setDetail.approvedNote', { version: s.version + 1 })}
        </p>
      )}
      {missingJudge && (
        <p className="warning-banner" data-testid="eval-set-needs-judge">
          {t('evals.setDetail.needsJudge')}
        </p>
      )}

      <div className="panel detail-grid">
        <EvalDetail name="state" label={label('state')} tipText={tipOf('state')}>
          <EvalSetStateBadge state={s.state} t={t} />
        </EvalDetail>
        <EvalDetail name="origin" label={label('origin')} tipText={tipOf('origin')}>
          <span {...tip(enumTip(t, 'evalSetOrigin', s.origin))}>{enumLabel(t, 'evalSetOrigin', s.origin)}</span>
        </EvalDetail>
        <EvalDetail name="judgeAgent" label={label('judgeAgent')} tipText={tipOf('judgeAgent')}>
          {s.judgeAgent || <span className="text-muted">{t('evals.noJudge')}</span>}
        </EvalDetail>
        <EvalDetail name="tags" label={label('tags')} tipText={tipOf('tags')}>
          {(s.tags || []).length ? s.tags.join(', ') : '-'}
        </EvalDetail>
        <EvalDetail name="authoredBy" label={label('authoredBy')} tipText={tipOf('authoredBy')}>
          {s.authoredByName || '-'}
        </EvalDetail>
        <EvalDetail name="approvedBy" label={label('approvedBy')} tipText={tipOf('approvedBy')}>
          {s.approvedByName ? t('evals.setDetail.approvedByAt', { name: s.approvedByName, when: s.approvedUtc ? formatDateTime(s.approvedUtc, lng) : '-' }) : '-'}
        </EvalDetail>
        <EvalDetail name="previousVersion" label={label('previousVersion')} tipText={tipOf('previousVersion')}>
          {s.previousVersionId ? (
            <EvalLink to={pathFor('evaluations', s.previousVersionId)} tipText={t('tips.evals.setDetail.openVersion')} testId="eval-set-previous">
              {t('evals.versionShort', { version: s.version - 1 })}
            </EvalLink>
          ) : (
            '-'
          )}
        </EvalDetail>
        <EvalDetail name="lastUpdateUtc" label={label('lastUpdateUtc')} tipText={tipOf('lastUpdateUtc')}>
          {when(s.lastUpdateUtc)}
        </EvalDetail>
        {s.description && (
          <EvalDetail name="description" label={label('description')} tipText={tipOf('description')} span>
            <span className="eval-text">{s.description}</span>
          </EvalDetail>
        )}
      </div>

      <EvalSection
        id="cases"
        title={t('evals.setDetail.cases', { count: cases.length })}
        tipText={t('tips.evals.setDetail.cases')}
        testId="eval-set-cases"
        actions={
          <button type="button" className="button-secondary button-sm" onClick={() => !deniedUpdate && setModal({ kind: 'case', item: null })} data-testid="eval-case-add" {...deniedProps(deniedUpdate)} {...tip(deniedUpdate || t(approved ? 'tips.evals.setDetail.addCaseApproved' : 'tips.evals.setDetail.addCase'))}>
            <PlusIcon size={14} /> {t('evals.setDetail.addCase')}
          </button>
        }
      >
        {cases.length === 0 ? (
          <EmptyNote>{t('evals.setDetail.noCases')}</EmptyNote>
        ) : (
          <LocalTableFrame
            tableId="eval-set-cases"
            testId="eval-cases-table"
            compact
            items={cases}
            rowProps={(c) => ({ 'data-case': c.order })}
            columns={[
              { key: 'order', label: t('evals.setDetail.columns.order'), tip: t('tips.evals.setDetail.columns.order'), cellClass: 'nowrap', render: (c) => (c.order ?? 0) + 1 },
              { key: 'name', label: t('evals.setDetail.columns.name'), tip: t('tips.evals.setDetail.columns.name'), cellClass: 'eval-text-cell', render: (c) => c.name || '-' },
              { key: 'input', label: t('evals.setDetail.columns.input'), tip: t('tips.evals.setDetail.columns.input'), cellClass: 'eval-text-cell', render: (c) => <span {...tip(c.inputText || '')}>{truncate(c.inputText || '', 80)}</span> },
              {
                key: 'expected',
                label: t('evals.setDetail.columns.expected'),
                tip: t('tips.evals.setDetail.columns.expected'),
                cellClass: 'eval-text-cell',
                render: (c) => <span {...tip(c.expectedText || '')}>{c.expectedText ? truncate(c.expectedText, 60) : <span className="text-muted">{t('evals.setDetail.noExpected')}</span>}</span>
              },
              { key: 'scorers', label: t('evals.setDetail.columns.scorers'), tip: t('tips.evals.setDetail.columns.scorers'), render: (c) => enumList(t, 'evalScorer', effectiveScorers(c)) },
              { key: 'hidden', label: t('evals.setDetail.columns.hidden'), tip: t('tips.evals.setDetail.columns.hidden'), render: (c) => (c.hidden ? <span className="pill pill-warning" {...tip(t('tips.evals.case.hidden'))}>{t('evals.setDetail.hidden')}</span> : '-') },
              {
                key: 'source',
                label: t('evals.setDetail.columns.source'),
                tip: t('tips.evals.setDetail.columns.source'),
                defaultHidden: true,
                render: (c) =>
                  c.sourceRunId ? (
                    <EvalLink to={pathFor('runs', c.sourceRunId)} tipText={t('tips.evals.setDetail.openSourceRun')}>
                      <code>{c.sourceRunId}</code>
                    </EvalLink>
                  ) : (
                    '-'
                  )
              },
              {
                key: 'actions',
                label: t('common.generic.actions'),
                tip: t('tips.table.actionsColumn'),
                headerClass: 'right',
                cellClass: 'actions-cell',
                render: (c) => (
                  <RowActions
                    label={t('evals.setDetail.caseLabel', { order: c.order, defaultValue: String(c.order) })}
                    menuTestId={`eval-case-menu-${c.order}`}
                    primary={{ label: t('common.actions.edit'), tip: deniedUpdate || t(approved ? 'tips.evals.setDetail.editCaseApproved' : 'tips.evals.setDetail.editCase'), disabled: !!deniedUpdate, onClick: () => setModal({ kind: 'case', item: c }), testId: `eval-case-edit-${c.order}` }}
                    items={[{ label: t('common.actions.remove'), tip: deniedUpdate || t('tips.evals.setDetail.removeCase'), disabled: !!deniedUpdate, danger: true, onClick: () => setModal({ kind: 'removeCase', item: c }), testId: `eval-case-remove-${c.order}` }]}
                  />
                )
              }
            ]}
          />
        )}
      </EvalSection>

      <EvalSection id="versions" title={t('evals.setDetail.versions')} tipText={t('tips.evals.setDetail.versions')} testId="eval-set-versions">
        <LocalTableFrame
          tableId="eval-set-versions"
          testId="eval-versions-table"
          compact
          items={versions.length ? versions : [s]}
          rowProps={(v) => ({ 'data-version': v.version, className: v.id === s.id ? 'eval-current-row' : undefined })}
          columns={[
            {
              key: 'version',
              label: t('evals.setDetail.versionColumns.version'),
              tip: t('tips.evals.setDetail.versionColumns.version'),
              render: (v) =>
                v.id === s.id ? (
                  <strong>{t('evals.setDetail.thisVersion', { version: v.version })}</strong>
                ) : (
                  <EvalLink to={pathFor('evaluations', v.id)} tipText={t('tips.evals.setDetail.openVersion')}>
                    {t('evals.versionShort', { version: v.version })}
                  </EvalLink>
                )
            },
            { key: 'state', label: t('evals.setDetail.versionColumns.state'), tip: t('tips.evals.setDetail.versionColumns.state'), render: (v) => <EvalSetStateBadge state={v.state} t={t} /> },
            { key: 'caseCount', label: t('evals.setDetail.versionColumns.caseCount'), tip: t('tips.evals.setDetail.versionColumns.caseCount'), render: (v) => v.caseCount ?? '-' },
            { key: 'approvedBy', label: t('evals.setDetail.versionColumns.approvedBy'), tip: t('tips.evals.setDetail.versionColumns.approvedBy'), render: (v) => v.approvedByName || '-' },
            { key: 'lastUpdateUtc', label: t('evals.setDetail.versionColumns.lastUpdateUtc'), tip: t('tips.evals.setDetail.versionColumns.lastUpdateUtc'), cellClass: 'nowrap', render: (v) => when(v.lastUpdateUtc) }
          ]}
        />
      </EvalSection>

      <EvalSection
        id="runs"
        title={t('evals.setDetail.runs')}
        tipText={t('tips.evals.setDetail.runs')}
        testId="eval-set-runs"
        actions={
          <EvalLink to={pathFor('evalRuns', undefined, { set: s.id })} tipText={t('tips.evals.setDetail.allRuns')}>
            {t('evals.setDetail.allRuns')}
          </EvalLink>
        }
      >
        {runs.length === 0 ? (
          <EmptyNote>{t('evals.setDetail.noRuns')}</EmptyNote>
        ) : (
          <LocalTableFrame
            tableId="eval-set-runs"
            testId="eval-set-runs-table"
            compact
            items={runs}
            columns={[
              {
                key: 'run',
                label: t('evals.setDetail.runColumns.run'),
                tip: t('tips.evals.setDetail.runColumns.run'),
                render: (r) => (
                  <EvalLink to={pathFor('evalRuns', r.id)} tipText={t('tips.evals.setDetail.openRun')}>
                    <code>{r.id}</code>
                  </EvalLink>
                )
              },
              { key: 'status', label: t('evals.setDetail.runColumns.status'), tip: t('tips.evals.setDetail.runColumns.status'), render: (r) => <EvalRunStatusBadge status={r.status} t={t} /> },
              { key: 'verdict', label: t('evals.setDetail.runColumns.verdict'), tip: t('tips.evals.setDetail.runColumns.verdict'), render: (r) => <EvalVerdictBadge run={r} t={t} /> },
              { key: 'score', label: t('evals.setDetail.runColumns.score'), tip: t('tips.evals.setDetail.runColumns.score'), cellClass: 'nowrap', render: (r) => scoreText(r.score, lng) },
              { key: 'target', label: t('evals.setDetail.runColumns.target'), tip: t('tips.evals.setDetail.runColumns.target'), cellClass: 'eval-text-cell', render: (r) => targetText(t, r, null) },
              { key: 'createdUtc', label: t('evals.setDetail.runColumns.createdUtc'), tip: t('tips.evals.setDetail.runColumns.createdUtc'), cellClass: 'nowrap', render: (r) => when(r.createdUtc) }
            ]}
          />
        )}
      </EvalSection>

      {editForm && (
        <Modal
          open
          size="medium"
          onClose={() => !busy && setEditForm(null)}
          title={t('evals.setDetail.editTitle', { name: s.name })}
          footer={
            <>
              <button type="button" className="button-secondary" onClick={() => setEditForm(null)} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
                {t('common.actions.cancel')}
              </button>
              <button type="button" className="button-primary" onClick={saveSet} disabled={busy} data-testid="eval-set-save" {...tip(t('tips.modal.saveEdit'))}>
                {busy ? t('common.generic.saving') : t('common.actions.save')}
              </button>
            </>
          }
        >
          {approved && <p className="info-banner">{t('evals.set.nextVersion', { version: s.version + 1 })}</p>}
          <FormFields fields={editFields} data={editForm} errors={editErrors} disabled={busy} onChange={setEditForm} idPrefix="eval-set" />
        </Modal>
      )}

      {modal?.kind === 'case' && (
        <EvalCaseModal
          set={s}
          item={modal.item}
          onClose={close}
          onSaved={(saved) => {
            close();
            follow(saved?.setId);
          }}
        />
      )}
      {modal?.kind === 'run' && (
        <EvalRunModal
          set={s}
          initial={modal.initial}
          onClose={close}
          onStarted={(run) => {
            close();
            if (run?.id) navigate(pathFor('evalRuns', run.id));
          }}
        />
      )}
      <ConfirmModal
        open={modal?.kind === 'approve'}
        title={t('evals.setDetail.approveTitle', { name: s.name, version: s.version })}
        message={t('evals.setDetail.approveMessage')}
        confirmLabel={t('evals.setDetail.approve')}
        confirmTip={t('tips.evals.setDetail.approve')}
        onConfirm={approve}
        onCancel={close}
      />
      <ConfirmModal
        open={modal?.kind === 'delete'}
        danger
        title={t('evals.setDetail.deleteTitle')}
        message={t('evals.setDetail.deleteMessage', { name: s.name, version: s.version })}
        confirmLabel={t('common.actions.delete')}
        confirmTip={t('tips.confirm.delete')}
        onConfirm={removeSet}
        onCancel={close}
      />
      <ConfirmModal
        open={modal?.kind === 'removeCase'}
        danger
        title={t('evals.setDetail.removeCaseTitle', { number: (modal?.item?.order ?? 0) + 1 })}
        message={approved ? t('evals.setDetail.removeCaseApproved', { version: s.version + 1 }) : t('evals.setDetail.removeCaseMessage')}
        confirmLabel={t('common.actions.remove')}
        confirmTip={t('tips.evals.setDetail.removeCase')}
        onConfirm={() => removeCase(modal.item)}
        onCancel={close}
      />
      <JsonViewerModal open={modal?.kind === 'json'} value={{ ...s, cases }} onClose={close} />
    </div>
  );
}
