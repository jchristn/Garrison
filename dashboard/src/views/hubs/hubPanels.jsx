import HomeView from '../HomeView';
import InvokeView from '../InvokeView';
import RunsView from '../RunsView';
import RunDetailView from '../RunDetailView';
import QueueView from '../QueueView';
import AnalyticsView from '../AnalyticsView';
import NodesView from '../NodesView';
import ControlNodesView from '../ControlNodesView';
import NodePoolsView from '../NodePoolsView';
import AgentsView from '../AgentsView';
import AgentDetailView from '../AgentDetailView';
import DeploymentsView from '../DeploymentsView';
import HarnessProfilesView from '../HarnessProfilesView';
import PromptTemplatesView from '../PromptTemplatesView';
import PromptTemplateEditorView from '../PromptTemplateEditorView';
import McpServersView from '../McpServersView';
import SecretsView from '../SecretsView';
import WorkspacesView from '../WorkspacesView';
import ArtifactStoresView from '../ArtifactStoresView';
import ManifestsView from '../ManifestsView';
import RequestHistoryView from '../RequestHistoryView';
import AuditView from '../AuditView';
import ApiExplorerView from '../ApiExplorerView';
import TenantsView from '../TenantsView';
import UsersView from '../UsersView';
import CredentialsView from '../CredentialsView';
import RolesView from '../RolesView';
import AssignmentsView from '../AssignmentsView';
import SettingsView from '../SettingsView';
import ServerInfoView from '../ServerInfoView';

/**
 * View components keyed by page id (see config/navConfig.js). Labels, ordering, hub membership,
 * and gating live in the nav config; this only maps ids to components.
 */
export const PAGE_VIEWS = {
  home: HomeView,
  invoke: InvokeView,
  runs: RunsView,
  queue: QueueView,
  analytics: AnalyticsView,
  nodes: NodesView,
  controlNodes: ControlNodesView,
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

/** Detail views for `/dashboard/<slug>/<id>`, keyed by page id (pages marked `detail: true`). */
export const DETAIL_VIEWS = {
  runs: RunDetailView,
  agents: AgentDetailView,
  promptTemplates: PromptTemplateEditorView
};
