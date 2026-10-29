import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Tabs from '../components/Tabs';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { Badge } from '../components/StatusBadge';
import { CodeIcon, TrashIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import StudioChatPanel from '../components/studio/StudioChatPanel';
import StudioItemsPanel from '../components/studio/StudioItemsPanel';
import StudioGraphPanel from '../components/studio/StudioGraphPanel';
import StudioDiffPanel from '../components/studio/StudioDiffPanel';
import StudioPlaygroundPanel from '../components/studio/StudioPlaygroundPanel';
import StudioPreviewPanel from '../components/studio/StudioPreviewPanel';
import ArchitectPromptPanel from '../components/studio/ArchitectPromptPanel';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import useStudioDraftChannel from '../hooks/useStudioDraftChannel';
import { pathFor, TAB_PARAM } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatNumber } from '../i18n/formatters';
import { ARCHITECT_STORAGE_KEY, STUDIO_POLL_MS, architectDeployments, draftStatusTone, graphFromMessage, isDraftOpen, readStored, studioPermissions, writeStored } from '../utils/studio';

/** Tabs of the workspace; `?tab=` opens one. */
const TAB_KEYS = ['architect', 'items', 'graph', 'apply', 'playground', 'preview', 'prompts'];

/**
 * One studio draft (AD7.10, AD7.16, AD9.2, AD9.3): the chat with the agent architect, the items with their YAML
 * editor, the read-only graph, diff, validation, apply with the approval decided inline, the playground, the compile
 * preview, and the architect prompt. The draft follows the WebSocket channel studio-draft:{id} and polls every few
 * seconds when that is not available; a change from someone else (or the architect) refreshes the items, the graph, the
 * diff, and the version, and says what moved.
 */
export default function StudioDraftView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const permissions = useCallerPermissions();
  const denied = studioPermissions(t, permissions);
  const lng = i18n.language;
  const requestedTab = searchParams.get(TAB_PARAM);
  const activeTab = TAB_KEYS.includes(requestedTab) ? requestedTab : 'architect';
  const selectTab = (key) => setSearchParams(key === 'architect' ? {} : { [TAB_PARAM]: key }, { replace: true });
  const [draft, setDraft] = useState(null);
  const [graph, setGraph] = useState(null);
  const [diff, setDiff] = useState(null);
  const [error, setError] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [architectId, setArchitectId] = useState(() => readStored(ARCHITECT_STORAGE_KEY) || '');
  const [liveNotice, setLiveNotice] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const versionRef = useRef(null);

  // Read the graph (unless a pushed message just carried it) and the diff of a draft.
  const loadSide = useCallback(
    (id, keepGraph = false) => {
      if (!apiClient || !id) return;
      if (!keepGraph)
        apiClient
          .getStudioDraftGraph(tenantId, id)
          .then(setGraph)
          .catch(() => setGraph({ nodes: [], edges: [] }));
      apiClient
        .getStudioDraftDiff(tenantId, id)
        .then(setDiff)
        .catch(() => setDiff(null));
    },
    [apiClient, tenantId]
  );

  // Take a draft the server answered; when its version moved, read the graph and diff again.
  const acceptDraft = useCallback(
    (next, keepGraph = false) => {
      if (!next) return;
      const moved = versionRef.current !== next.version;
      versionRef.current = next.version;
      setDraft(next);
      if (moved) loadSide(next.id, keepGraph);
    },
    [loadSide]
  );

  const load = useCallback(
    (keepGraph = false) => {
      if (!apiClient || !recordId) return Promise.resolve();
      return apiClient
        .getStudioDraft(tenantId, recordId)
        .then((d) => {
          setError(null);
          acceptDraft(d, keepGraph === true);
        })
        .catch(setError);
    },
    [apiClient, tenantId, recordId, acceptDraft]
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadDeployments = useCallback(() => {
    if (!apiClient) return;
    apiClient
      .listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setDeployments(r.items || []))
      .catch(() => setDeployments([]));
  }, [apiClient, tenantId]);
  useEffect(loadDeployments, [loadDeployments]);

  const architects = useMemo(() => architectDeployments(deployments), [deployments]);
  // Fall back to the first architect when the remembered one is gone.
  const currentArchitectId = architects.some((d) => d.id === architectId) ? architectId : architects[0]?.id || '';
  const architect = architects.find((d) => d.id === currentArchitectId) || null;
  const chooseArchitect = (id) => {
    setArchitectId(id);
    writeStored(ARCHITECT_STORAGE_KEY, id || null);
  };

  // A pushed change: take the graph it carries, read the draft again, and say what moved.
  const onChanged = useCallback(
    (message) => {
      const pushed = graphFromMessage(message);
      if (pushed) setGraph(pushed);
      if (message.version !== versionRef.current) {
        setLiveNotice({ version: message.version, status: message.status, changed: Array.isArray(message.changed) ? message.changed : [] });
        load(!!pushed);
      }
    },
    [load]
  );
  const live = useStudioDraftChannel(apiClient, draft?.id || null, onChanged);

  // Poll while the live channel is not subscribed.
  useEffect(() => {
    if (live || !draft?.id || draft.status === 'Discarded' || draft.status === 'Applied') return undefined;
    const id = setInterval(() => {
      apiClient
        .getStudioDraft(tenantId, draft.id)
        .then((d) => {
          if (d.version !== versionRef.current) setLiveNotice({ version: d.version, status: d.status, changed: [] });
          acceptDraft(d);
        })
        .catch(() => {});
    }, STUDIO_POLL_MS);
    return () => clearInterval(id);
  }, [live, draft?.id, draft?.status, apiClient, tenantId, acceptDraft]);

  const discard = async () => {
    try {
      await apiClient.deleteStudioDraft(tenantId, draft.id);
      addToast({ type: 'success', message: t('views.studio.discarded', { title: draft.title || draft.id }) });
      setConfirmDiscard(false);
      navigate(pathFor('studio'));
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
      setConfirmDiscard(false);
    }
  };

  if (error && !draft) {
    return (
      <div>
        <PageHeader title={t('views.studioDraft.title')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={load} />
        <EmptyState title={t('views.studioDraft.notFoundTitle')} body={t('views.studioDraft.notFoundBody')} />
      </div>
    );
  }
  if (!draft) return <LoadingState />;

  const open = isDraftOpen(draft);
  const notOpen = open ? '' : t('tips.studio.notOpen', { status: enumLabel(t, 'studioDraftStatus', draft.status) });
  const editBlocked = denied.edit || notOpen;
  const tabs = TAB_KEYS.map((id) => ({ id, label: t(`views.studioDraft.tabs.${id}`), tip: t(`tips.views.studioDraft.tabs.${id}`) }));

  return (
    <div data-testid="studio-draft">
      <PageHeader
        title={draft.title || t('views.studio.untitled')}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={draft.id} max={40} />
            <Badge tone={draftStatusTone(draft.status)} tip={enumTip(t, 'studioDraftStatus', draft.status || 'Open')}>
              {enumLabel(t, 'studioDraftStatus', draft.status || 'Open')}
            </Badge>
            <span data-testid="studio-draft-version" {...tip(t('tips.views.studioDraft.version'))}>
              {t('views.studioDraft.version', { version: formatNumber(draft.version ?? 1, {}, lng) })}
            </span>
            <span className={`live-chip studio-live-chip${live ? ' on' : ''}`} data-testid="studio-live" {...tip(t(live ? 'tips.views.studioDraft.live' : 'tips.views.studioDraft.polling'))}>
              {t(live ? 'views.studioDraft.live' : 'views.studioDraft.polling')}
            </span>
          </span>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => navigate(pathFor('studio'))} {...tip(t('tips.views.studioDraft.back'))}>
              {t('views.studioDraft.back')}
            </button>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.studioDraft.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {draft.status !== 'Discarded' && (
              <button
                type="button"
                className="button-danger"
                onClick={() => !denied.discard && setConfirmDiscard(true)}
                aria-disabled={denied.discard ? 'true' : undefined}
                data-testid="studio-discard"
                {...tip(denied.discard || t(draft.status === 'PendingApproval' ? 'tips.views.studio.discardPending' : 'tips.views.studio.discard'))}
              >
                <TrashIcon size={14} /> {t('views.studio.discard')}
              </button>
            )}
          </>
        }
      />
      <div className="panel detail-grid studio-summary">
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.views.studio.columns.owner'))}>
            {t('views.studio.columns.owner')}
          </div>
          <div className="detail-item-value">{draft.ownerName || draft.ownerUserId || '-'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.views.studio.columns.targetApp'))}>
            {t('views.studio.columns.targetApp')}
          </div>
          <div className="detail-item-value">{draft.targetApp || '-'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.views.studio.columns.items'))}>
            {t('views.studio.columns.items')}
          </div>
          <div className="detail-item-value">{formatNumber((draft.items || []).length, {}, lng)}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.views.studioDraft.architect'))}>
            {t('views.studioDraft.architect')}
          </div>
          <div className="detail-item-value">{architect ? architect.name : '-'}</div>
        </div>
      </div>
      {!open && (
        <div className="info-banner" role="status" data-testid="studio-not-open">
          {t(`views.studioDraft.notOpen.${draft.status || 'Open'}`, { defaultValue: t('views.studioDraft.notOpen.other') })}
        </div>
      )}
      {liveNotice && (
        <div className="info-banner studio-live-notice" role="status" data-testid="studio-live-notice">
          <span>
            {t('views.studioDraft.liveNotice', { version: formatNumber(liveNotice.version ?? 0, {}, lng), status: enumLabel(t, 'studioDraftStatus', liveNotice.status || draft.status) })}{' '}
            {liveNotice.changed.length > 0 &&
              t('views.studioDraft.liveChanged', {
                items: liveNotice.changed.map((c) => `${c.kind}/${c.name}${c.removed ? ` (${t('views.studioDraft.removedTag')})` : ''}`).join(', ')
              })}
          </span>
          <button type="button" className="button-ghost button-sm" onClick={() => setLiveNotice(null)} {...tip(t('tips.views.studioDraft.dismissNotice'))}>
            {t('views.studioDraft.dismissNotice')}
          </button>
        </div>
      )}
      <Tabs label={t('views.studioDraft.tabsLabel')} active={activeTab} onChange={selectTab} tabs={tabs} />
      {activeTab === 'architect' && (
        <StudioChatPanel
          key={draft.id}
          draft={draft}
          architects={architects}
          architectId={currentArchitectId}
          onArchitectChange={chooseArchitect}
          onArchitectCreated={(deployment) => {
            addToast({ type: 'success', message: t('components.studio.architect.created', { name: deployment?.name || '' }) });
            if (deployment?.id) chooseArchitect(deployment.id);
            loadDeployments();
          }}
          deniedArchitect={denied.architect}
          onTurnFinished={load}
        />
      )}
      {activeTab === 'items' && <StudioItemsPanel draft={draft} diff={diff} blocked={editBlocked} onDraft={acceptDraft} />}
      {activeTab === 'graph' && <StudioGraphPanel graph={graph} />}
      {activeTab === 'apply' && <StudioDiffPanel draft={draft} diff={diff} onDiff={setDiff} onReload={load} blocked={editBlocked} deniedDecide={denied.decide} />}
      {activeTab === 'playground' && <StudioPlaygroundPanel draft={draft} graph={graph} blocked={denied.playground} />}
      {activeTab === 'preview' && <StudioPreviewPanel deployments={deployments} blocked={denied.preview} />}
      {activeTab === 'prompts' && <ArchitectPromptPanel architect={architect} deployments={deployments} denied={denied} />}
      <ConfirmModal
        open={confirmDiscard}
        danger
        title={t('views.studio.discardTitle')}
        message={t(draft.status === 'PendingApproval' ? 'views.studio.discardPendingMessage' : 'views.studio.discardMessage', { title: draft.title || draft.id })}
        confirmLabel={t('views.studio.discard')}
        confirmTip={t('tips.views.studio.discard')}
        onConfirm={discard}
        onCancel={() => setConfirmDiscard(false)}
      />
      <JsonViewerModal open={jsonOpen} value={draft} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
