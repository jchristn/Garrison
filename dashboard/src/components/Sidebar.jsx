import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { usePendingApprovals } from '../context/ApprovalsContext';
import { formatNumber } from '../i18n/formatters';
import { NAV_SECTIONS, DASHBOARD_BASE, hubIsActive } from '../config/navConfig';
import { allowed } from '../utils/principal';
import { APP_VERSION } from '../utils/constants';
import * as Icons from './Icons';
import { tip } from './Tooltip';

/** A hub is visible when its standalone page, or at least one of its tabs, is allowed. */
function hubVisible(hub, principal) {
  if (hub.page) return allowed(hub.page.requires, principal);
  return hub.tabs.some((tab) => allowed(tab.requires, principal));
}

/**
 * Grouped, role-aware sidebar rendered from config/navConfig.js, with a utility footer (setup
 * wizard, tour, version). Each item is a hub; tabbed hubs show their pages as in-page tabs.
 */
export default function Sidebar({ onNavigateMobile }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pending, approvalsPending, reviewsPending } = usePendingApprovals();
  const { pathname } = useLocation();
  const { principal } = useAuth();
  const { setWizardOpen, setTourOpen } = useApp();

  const go = (path) => {
    navigate(path);
    onNavigateMobile?.();
  };

  return (
    <aside className="dashboard-sidebar" data-tour="sidebar">
      <div className="sidebar-brand">
        <img src="/assets/logo.png" alt="" />
        <span>{t('common.appName')}</span>
      </div>
      <nav className="sidebar-nav" aria-label={t('nav.primary')}>
        {NAV_SECTIONS.map((section) => {
          const hubs = section.items.filter((hub) => hubVisible(hub, principal));
          if (hubs.length === 0) return null;
          return (
            <div className="sidebar-group" key={section.key}>
              <div className="sidebar-group-label">{t(`nav.sections.${section.key}`)}</div>
              {hubs.map((hub) => {
                const Icon = Icons[hub.icon];
                const label = t(`nav.hubs.${hub.key}.label`);
                const path = `${DASHBOARD_BASE}/${hub.slug}`;
                const active = hubIsActive(hub, pathname);
                return (
                  <a
                    key={hub.key}
                    href={path}
                    className={`sidebar-item ${active ? 'active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      go(path);
                    }}
                    {...tip(t(`tips.nav.hubs.${hub.key}`))}
                    data-nav={hub.key}
                  >
                    {Icon && <Icon size={18} />}
                    <span>{label}</span>
                    {hub.key === 'approvals' && pending > 0 && (
                      <span
                        className="sidebar-badge"
                        data-testid="approvals-badge"
                        aria-label={t('nav.approvalsPending', { count: pending })}
                        {...tip(reviewsPending ? t('tips.nav.approvalsBadgeCombined', { count: pending, approvals: approvalsPending ?? 0, reviews: reviewsPending }) : t('tips.nav.approvalsBadge', { count: pending }))}
                      >
                        {pending > 99 ? '99+' : formatNumber(pending, {}, i18n.language)}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-utility" onClick={() => setWizardOpen(true)} {...tip(t('tips.nav.setup'))}>
          <Icons.WandIcon size={16} />
          <span>{t('nav.setup')}</span>
        </button>
        <button type="button" className="sidebar-utility" onClick={() => setTourOpen(true)} {...tip(t('tips.nav.tour'))}>
          <Icons.HelpIcon size={16} />
          <span>{t('nav.tour')}</span>
        </button>
        <div className="sidebar-version">{t('nav.version', { version: APP_VERSION })}</div>
      </div>
    </aside>
  );
}
