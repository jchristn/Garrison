import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { NAV_GROUPS } from '../utils/routes';
import { allowed } from '../utils/principal';
import { APP_VERSION } from '../utils/constants';
import * as Icons from './Icons';

const ICONS = {
  home: Icons.HomeIcon,
  invoke: Icons.SendIcon,
  runs: Icons.RunsIcon,
  queue: Icons.QueueIcon,
  nodes: Icons.CpuIcon,
  nodePools: Icons.PoolIcon,
  agents: Icons.BotIcon,
  deployments: Icons.BoxIcon,
  harnessProfiles: Icons.TerminalIcon,
  promptTemplates: Icons.FileTextIcon,
  mcpServers: Icons.PlugIcon,
  secrets: Icons.VaultIcon,
  workspaces: Icons.FolderIcon,
  artifactStores: Icons.DownloadIcon,
  manifests: Icons.FileCodeIcon,
  requests: Icons.ListIcon,
  audit: Icons.ShieldIcon,
  explorer: Icons.PlayIcon,
  tenants: Icons.BuildingIcon,
  users: Icons.UsersIcon,
  credentials: Icons.KeyIcon,
  roles: Icons.ShieldCheckIcon,
  assignments: Icons.LinkIcon,
  settings: Icons.SettingsIcon,
  serverInfo: Icons.ServerIcon
};

/** Grouped, role-aware sidebar with a utility footer (setup wizard, tour, version). */
export default function Sidebar({ activeId, onNavigateMobile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { principal } = useAuth();
  const { setWizardOpen, setTourOpen } = useApp();

  const go = (slug) => {
    navigate(`/dashboard/${slug}`);
    onNavigateMobile?.();
  };

  return (
    <aside className="dashboard-sidebar" data-tour="sidebar">
      <div className="sidebar-brand">
        <img src="/assets/logo.svg" alt="" />
        <span>{t('common.appName')}</span>
      </div>
      <nav className="sidebar-nav" aria-label={t('nav.primary')}>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((it) => allowed(it.requires, principal));
          if (items.length === 0) return null;
          return (
            <div className="sidebar-group" key={group.id}>
              <div className="sidebar-group-label">{t(`nav.groups.${group.id}`)}</div>
              {items.map((it) => {
                const Icon = ICONS[it.id];
                const label = t(`nav.items.${it.id}.label`);
                return (
                  <a
                    key={it.id}
                    href={`/dashboard/${it.slug}`}
                    className={`sidebar-item ${activeId === it.id ? 'active' : ''}`}
                    aria-current={activeId === it.id ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      go(it.slug);
                    }}
                    title={t(`nav.items.${it.id}.tip`)}
                    data-nav={it.id}
                  >
                    {Icon && <Icon size={18} />}
                    <span>{label}</span>
                  </a>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-utility" onClick={() => setWizardOpen(true)} title={t('nav.setupTip')}>
          <Icons.WandIcon size={16} />
          <span>{t('nav.setup')}</span>
        </button>
        <button type="button" className="sidebar-utility" onClick={() => setTourOpen(true)} title={t('nav.tourTip')}>
          <Icons.HelpIcon size={16} />
          <span>{t('nav.tour')}</span>
        </button>
        <div className="sidebar-version">{t('nav.version', { version: APP_VERSION })}</div>
      </div>
    </aside>
  );
}
