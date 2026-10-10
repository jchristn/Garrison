import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { routeBySlug } from '../utils/routes';
import { allowed } from '../utils/principal';
import { STORAGE_KEYS } from '../utils/constants';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SetupWizard from './SetupWizard';
import Tour from './Tour';
import { EmptyState } from './States';
import { useTranslation } from 'react-i18next';
import HomeView from '../views/HomeView';
import InvokeView from '../views/InvokeView';
import RunsView from '../views/RunsView';
import RunDetailView from '../views/RunDetailView';
import QueueView from '../views/QueueView';
import NodesView from '../views/NodesView';
import NodePoolsView from '../views/NodePoolsView';
import AgentsView from '../views/AgentsView';
import AgentDetailView from '../views/AgentDetailView';
import DeploymentsView from '../views/DeploymentsView';
import HarnessProfilesView from '../views/HarnessProfilesView';
import PromptTemplatesView from '../views/PromptTemplatesView';
import PromptTemplateEditorView from '../views/PromptTemplateEditorView';
import McpServersView from '../views/McpServersView';
import SecretsView from '../views/SecretsView';
import WorkspacesView from '../views/WorkspacesView';
import ArtifactStoresView from '../views/ArtifactStoresView';
import ManifestsView from '../views/ManifestsView';
import RequestHistoryView from '../views/RequestHistoryView';
import AuditView from '../views/AuditView';
import ApiExplorerView from '../views/ApiExplorerView';
import TenantsView from '../views/TenantsView';
import UsersView from '../views/UsersView';
import CredentialsView from '../views/CredentialsView';
import RolesView from '../views/RolesView';
import AssignmentsView from '../views/AssignmentsView';
import SettingsView from '../views/SettingsView';
import ServerInfoView from '../views/ServerInfoView';

const VIEWS = {
  home: HomeView,
  invoke: InvokeView,
  runs: RunsView,
  queue: QueueView,
  nodes: NodesView,
  nodePools: NodePoolsView,
  agents: AgentsView,
  deployments: DeploymentsView,
  harnessProfiles: HarnessProfilesView,
  promptTemplates: PromptTemplatesView,
  mcpServers: McpServersView,
  secrets: SecretsView,
  workspaces: WorkspacesView,
  artifactStores: ArtifactStoresView,
  manifests: ManifestsView,
  requests: RequestHistoryView,
  audit: AuditView,
  explorer: ApiExplorerView,
  tenants: TenantsView,
  users: UsersView,
  credentials: CredentialsView,
  roles: RolesView,
  assignments: AssignmentsView,
  settings: SettingsView,
  serverInfo: ServerInfoView
};

const DETAIL_VIEWS = {
  runs: RunDetailView,
  agents: AgentDetailView,
  promptTemplates: PromptTemplateEditorView
};

/** Authenticated shell: sidebar, topbar, and the routed view. */
export default function Dashboard() {
  const { t } = useTranslation();
  const { section = 'home', id } = useParams();
  const { apiClient, principal } = useAuth();
  const { sidebarCollapsed, toggleSidebar, tenantId, setWizardOpen } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [live, setLive] = useState(false);
  const route = routeBySlug(section);

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

  const View = id && DETAIL_VIEWS[route.id] ? DETAIL_VIEWS[route.id] : VIEWS[route.id] || HomeView;
  const permitted = allowed(route.requires, principal);

  const cls = ['dashboard'];
  if (sidebarCollapsed) cls.push('sidebar-collapsed');
  if (mobileNavOpen) cls.push('mobile-nav-open');

  return (
    <div className={cls.join(' ')}>
      <a className="skip-link" href="#main-content">
        {t('nav.skipToContent')}
      </a>
      <Sidebar activeId={route.id} onNavigateMobile={() => setMobileNavOpen(false)} />
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
        {permitted ? <View key={`${route.id}-${id || ''}-${tenantId}`} recordId={id ? decodeURIComponent(id) : undefined} apiClient={apiClient} /> : <EmptyState title={t('common.states.forbiddenTitle')} body={t('common.states.forbiddenBody')} />}
      </main>
      <SetupWizard />
      <Tour />
    </div>
  );
}
