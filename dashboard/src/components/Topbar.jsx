import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { GITHUB_URL } from '../utils/constants';
import { roleKey } from '../utils/principal';
import LanguageSelector from './LanguageSelector';
import CopyButton from './CopyButton';
import { MenuIcon, SunIcon, MoonIcon, GithubIcon, LogoutIcon, RefreshIcon } from './Icons';

/** Top bar: server, tenant, principal, role, health, and live status on the left; utilities on the right. */
export default function Topbar({ onToggleSidebar, health, live }) {
  const { t } = useTranslation();
  const { serverUrl, principal, theme, toggleTheme, logout } = useAuth();
  const { tenantId, setTenantId, tenants, isSystemAdmin } = useApp();
  const healthState = health === true ? 'healthy' : health === false ? 'unhealthy' : 'unknown';

  return (
    <header className="dashboard-header" data-tour="topbar">
      <div className="topbar">
        <div className="topbar-left">
          <button type="button" className="icon-button" onClick={onToggleSidebar} aria-label={t('nav.collapseSidebar')} title={t('nav.collapseSidebar')}>
            <MenuIcon />
          </button>
          <span className="topbar-chip topbar-server" title={`${t('topbar.server')}: ${serverUrl}`}>
            <span className={`health-dot ${healthState}`} role="img" aria-label={t(`topbar.health.${healthState}`)} title={t(`topbar.health.${healthState}`)} />
            <code className="topbar-truncate">{serverUrl}</code>
            <CopyButton value={serverUrl} title={t('topbar.copyServer')} />
          </span>
          {isSystemAdmin && tenants.length > 0 ? (
            <label className="topbar-chip topbar-tenant">
              <span className="text-muted">{t('topbar.tenant')}</span>
              <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} aria-label={t('topbar.switchTenant')}>
                {tenants.map((tn) => (
                  <option key={tn.id} value={tn.id}>
                    {tn.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="topbar-chip" title={tenantId}>
              <span className="text-muted">{t('topbar.tenant')}</span>
              <code className="topbar-truncate">{tenantId}</code>
            </span>
          )}
          {principal?.principalName && (
            <span className="topbar-chip topbar-hide-narrow" title={principal.principalName}>
              <code className="topbar-truncate">{principal.principalName}</code>
            </span>
          )}
          <span className="topbar-chip role topbar-hide-mobile">{t(roleKey(principal))}</span>
          <span className={`topbar-chip live-chip ${live ? 'on' : ''}`} title={live ? t('topbar.liveOn') : t('topbar.liveOff')}>
            <RefreshIcon size={12} />
            <span className="topbar-hide-narrow">{live ? t('topbar.live') : t('topbar.polling')}</span>
          </span>
        </div>

        <div className="topbar-right">
          <LanguageSelector compact />
          <a className="icon-button" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label={t('common.actions.openGithub')} title={t('common.actions.openGithub')}>
            <GithubIcon />
          </a>
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('common.theme.switchToLight') : t('common.theme.switchToDark')}
            title={theme === 'dark' ? t('common.theme.switchToLight') : t('common.theme.switchToDark')}
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button type="button" className="icon-button" onClick={logout} aria-label={t('common.actions.logout')} title={t('common.actions.logout')} data-testid="logout">
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
