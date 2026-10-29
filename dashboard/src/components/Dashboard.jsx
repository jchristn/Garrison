import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { findHub, hubBySlug, detailPageBySlug, pageBySlug, DASHBOARD_BASE } from '../config/navConfig';
import { allowed } from '../utils/principal';
import { ARCHITECT_AGENT_NAME, STORAGE_KEYS, APPROVAL_POLL_MS } from '../utils/constants';
import { ApprovalsProvider } from '../context/ApprovalsContext';
import { combinedPending } from '../utils/approvals';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SetupWizard from './SetupWizard';
import Tour from './Tour';
import LegacyRedirect from './LegacyRedirect';
import { EmptyState } from './States';
import { useTranslation } from 'react-i18next';
import HubView from '../views/hubs/HubView';
import { tip } from './Tooltip';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';

/**
 * Resolve /dashboard/:section[/:id] to what the main area renders: a hub (tabbed or standalone),
 * a detail view, a redirect for a pre-hub URL, or a redirect home for anything unknown.
 */
function resolveRoute(section, id) {
  if (id) {
    const page = detailPageBySlug(section);
    if (page && DETAIL_VIEWS[page.id]) return { kind: 'detail', page, View: DETAIL_VIEWS[page.id] };
  }
  const hub = hubBySlug(section);
  if (hub && !id) {
    if (hub.tabs) return { kind: 'hub', hub };
    return { kind: 'page', page: hub.page, View: PAGE_VIEWS[hub.page.id] };
  }
  // A pre-hub URL (or a detail-style URL with an unknown record route) lands on its hub and tab.
  const legacy = pageBySlug(section);
  if (legacy) return { kind: 'redirect', to: `${DASHBOARD_BASE}/${findHub(legacy.hub).slug}`, tab: legacy.defaultTab ? null : legacy.tab };
  return { kind: 'redirect', to: `${DASHBOARD_BASE}/home` };
}

/** Authenticated shell: sidebar, topbar, and the routed view. */
export default function Dashboard() {
  const { t } = useTranslation();
  const { section = 'home', id } = useParams();
  const { apiClient, principal } = useAuth();
  const { sidebarCollapsed, toggleSidebar, tenantId, setWizardOpen } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [live, setLive] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [pendingReviews, setPendingReviews] = useState(null);
  const approvalsReadable = useRef(true);
  const reviewsReadable = useRef(true);
  const route = resolveRoute(section, id);

  // Pending approvals (P12.3) and pipeline stage reviews (P12.9) for the one sidebar badge: polled, and pushed over the
  // WebSocket approvals channel (approvals.changed carries both counts) when the live connection is up. A 403 or 404
  // (no Approval Read permission, or a server without that route) hides that part of the count for good.
  const refreshApprovals = useCallback(() => {
    if (!apiClient || !tenantId) return;
    if (approvalsReadable.current) {
      apiClient
        .countPendingApprovals(tenantId)
        .then((count) => setPendingApprovals(count))
        .catch((e) => {
          if (e?.status === 403 || e?.status === 404) approvalsReadable.current = false;
          setPendingApprovals(null);
        });
    }
    if (reviewsReadable.current && typeof apiClient.countPendingPipelineReviews === 'function') {
      apiClient
        .countPendingPipelineReviews(tenantId)
        .then((count) => setPendingReviews(count))
        .catch((e) => {
          if (e?.status === 403 || e?.status === 404) reviewsReadable.current = false;
          setPendingReviews(null);
        });
    }
  }, [apiClient, tenantId]);

  useEffect(() => {
    approvalsReadable.current = true;
    reviewsReadable.current = true;
    refreshApprovals();
    const timer = setInterval(refreshApprovals, APPROVAL_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshApprovals]);

  const approvals = useMemo(
    () => ({ pending: combinedPending(pendingApprovals, pendingReviews), approvalsPending: pendingApprovals, reviewsPending: pendingReviews, refresh: refreshApprovals }),
    [pendingApprovals, pendingReviews, refreshApprovals]
  );

  useEffect(() => {
    if (!apiClient) return undefined;
    let active = true;
    const check = () =>
      apiClient
        .healthCheck()
        .then(() => active && setHealth(true))
        .catch(() => active && setHealth(false));
    check();
    const timer = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [apiClient]);

  // Live updates indicator: open the WebSocket when available, otherwise views poll.
  useEffect(() => {
    if (!apiClient || typeof WebSocket === 'undefined') return undefined;
    let ws;
    try {
      ws = new WebSocket(apiClient.webSocketUrl());
      ws.onopen = () => {
        setLive(true);
        try {
          ws.send(JSON.stringify({ type: 'subscribe', topics: ['runs', 'nodes'] }));
          // One channel per subscribe message; the server pushes approvals.changed whenever the pending set changes.
          ws.send(JSON.stringify({ type: 'subscribe', channel: 'approvals' }));
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'approvals.changed') {
            if (typeof message.pending === 'number') setPendingApprovals(message.pending);
            if (typeof message.reviewsPending === 'number' && reviewsReadable.current) setPendingReviews(message.reviewsPending);
          }
        } catch {
          /* not JSON */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => ws?.close();
  }, [apiClient]);

  // Offer the setup wizard automatically for an empty tenant. The agent architect is seeded in every tenant (AD7.6), so
  // a tenant whose only agent is agent-architect still counts as empty.
  useEffect(() => {
    if (!apiClient || !tenantId) return;
    if (localStorage.getItem(`${STORAGE_KEYS.setupDismissed}:${tenantId}`) === 'true') return;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 2 })
      .then((r) => {
        const others = (r.items || []).filter((a) => a?.name !== ARCHITECT_AGENT_NAME);
        if ((r.totalCount ?? 0) <= (r.items || []).length && others.length === 0) setWizardOpen(true);
      })
      .catch(() => {});
  }, [apiClient, tenantId, setWizardOpen]);

  if (route.kind === 'redirect') return <LegacyRedirect to={route.to} tab={route.tab} />;

  const permitted = route.kind === 'hub' || allowed(route.page.requires, principal);
  let content;
  if (!permitted) content = <EmptyState title={t('common.states.forbiddenTitle')} body={t('common.states.forbiddenBody')} />;
  else if (route.kind === 'hub') content = <HubView key={`${route.hub.key}-${tenantId}`} hubKey={route.hub.key} apiClient={apiClient} />;
  else {
    const View = route.View;
    content = <View key={`${route.page.id}-${id || ''}-${tenantId}`} recordId={id ? decodeURIComponent(id) : undefined} apiClient={apiClient} />;
  }

  const cls = ['dashboard'];
  if (sidebarCollapsed) cls.push('sidebar-collapsed');
  if (mobileNavOpen) cls.push('mobile-nav-open');

  return (
    <ApprovalsProvider value={approvals}>
      <div className={cls.join(' ')}>
        <a className="skip-link" href="#main-content" {...tip(t('tips.nav.skipToContent'))}>
          {t('nav.skipToContent')}
        </a>
        <Sidebar onNavigateMobile={() => setMobileNavOpen(false)} />
        {mobileNavOpen && <div className="mobile-nav-scrim" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />}
        <Topbar
          onToggleSidebar={() => {
            if (window.innerWidth <= 900) setMobileNavOpen((m) => !m);
            else toggleSidebar();
          }}
          health={health}
          live={live}
        />
        <main className="dashboard-content" id="main-content">
          {content}
        </main>
        <SetupWizard />
        <Tour />
      </div>
    </ApprovalsProvider>
  );
}
