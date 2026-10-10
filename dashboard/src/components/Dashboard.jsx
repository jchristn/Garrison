import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { findHub, hubBySlug, detailPageBySlug, pageBySlug, DASHBOARD_BASE } from '../config/navConfig';
import { allowed } from '../utils/principal';
import { STORAGE_KEYS } from '../utils/constants';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SetupWizard from './SetupWizard';
import Tour from './Tour';
import LegacyRedirect from './LegacyRedirect';
import { EmptyState } from './States';
import { useTranslation } from 'react-i18next';
import HubView from '../views/hubs/HubView';
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
  const route = resolveRoute(section, id);

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
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => ws?.close();
  }, [apiClient]);

  // Offer the setup wizard automatically for an empty tenant.
  useEffect(() => {
    if (!apiClient || !tenantId) return;
    if (localStorage.getItem(`${STORAGE_KEYS.setupDismissed}:${tenantId}`) === 'true') return;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1 })
      .then((r) => {
        if ((r.totalCount ?? 0) === 0) setWizardOpen(true);
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
    <div className={cls.join(' ')}>
      <a className="skip-link" href="#main-content">
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
  );
}
