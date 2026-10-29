import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipLayer } from './components/Tooltip.jsx';
import ChatShell from './components/ChatShell.jsx';
import SignIn from './components/SignIn.jsx';
import StatusScreen from './components/StatusScreen.jsx';
import { createGatewayClient } from './api/gateway.js';
import { applyBranding } from './utils/branding.js';
import { appPath, parseAppPath } from './utils/location.js';
import { applyTheme, resolveTheme, saveTheme, watchSystemTheme } from './utils/theme.js';
import { errorText } from './utils/errors.js';

// The app UI root. The slug comes from the URL (/apps/{slug}/), branding from GET /v1.0/apps/{slug} at every load,
// and the session from sessionStorage. Without a session it shows sign-in; a 401 from any gateway route drops the
// session and returns here.
export default function App({ fetchImpl }) {
  const { t } = useTranslation();
  const [path, setPath] = useState(() => window.location.pathname);
  const { slug, conversationId } = parseAppPath(path);
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reload, setReload] = useState(0);
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState(null);
  const [theme, setTheme] = useState(() => resolveTheme());

  const client = useMemo(
    () =>
      slug
        ? createGatewayClient({
            slug,
            fetchImpl,
            onUnauthorized: (err) => {
              setSession(null);
              setNotice(err);
            }
          })
        : null,
    [slug, fetchImpl]
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => watchSystemTheme(setTheme), []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!client) return undefined;
    let cancelled = false;
    setInfo(null);
    setLoadError(null);
    setSession(client.session || null);
    client
      .info()
      .then((value) => {
        if (cancelled) return;
        applyBranding(value);
        setInfo(value);
      })
      .catch((err) => !cancelled && setLoadError(err));
    return () => {
      cancelled = true;
    };
  }, [client, reload]);

  const navigate = useCallback(
    (id, { replace = false } = {}) => {
      const next = appPath(slug, id);
      if (next === window.location.pathname) return;
      if (replace) window.history.replaceState(null, '', next);
      else window.history.pushState(null, '', next);
      setPath(next);
    },
    [slug]
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    setTheme(next);
  };

  const signOut = async () => {
    // Best effort: the session is forgotten here even when the server call fails.
    await client.endSession().catch(() => {});
    setSession(null);
    setNotice(null);
    navigate(null, { replace: true });
  };

  let content;
  if (!slug) content = <StatusScreen title={t('app.noSlugTitle')} body={t('app.noSlugBody')} />;
  else if (loadError && loadError.status === 404) content = <StatusScreen title={t('app.notFoundTitle')} body={t('app.notFoundBody')} />;
  else if (loadError) content = <StatusScreen title={t('app.loadErrorTitle')} body={`${t('app.loadErrorBody')} ${errorText(t, loadError)}`} onRetry={() => setReload((n) => n + 1)} />;
  else if (!info) content = <StatusScreen busy />;
  else if (!session) {
    const logoUrl = client.logoUrl(info);
    content = (
      <SignIn
        client={client}
        info={info}
        logoUrl={logoUrl}
        notice={notice ? errorText(t, notice) : null}
        onSignedIn={(s) => {
          setNotice(null);
          setSession(s);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  } else {
    content = (
      <ChatShell
        client={client}
        info={info}
        logoUrl={client.logoUrl(info)}
        session={session}
        conversationId={conversationId}
        onNavigate={navigate}
        onSignOut={signOut}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <>
      {content}
      <TooltipLayer />
    </>
  );
}
