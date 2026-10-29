import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { DEV_DEFAULTS, customServerAllowed, defaultServerUrl, storedServerUrl } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import LanguageSelector from './LanguageSelector';
import { EyeIcon, EyeOffIcon, SunIcon, MoonIcon } from './Icons';
import { tip } from './Tooltip';

/**
 * Login: email and password, or access key and secret key. The server is the configured API URL or the page origin
 * and is shown read-only in the footer. "Use a different server" reveals a Server URL field only when the override is
 * available (a development build, or allowCustomServer in /config.js); otherwise there is no way to type a URL.
 */
export default function Login() {
  const { t } = useTranslation();
  const { login, theme, toggleTheme } = useAuth();
  const [tab, setTab] = useState('password');
  const [allowCustom] = useState(() => customServerAllowed());
  const [stored] = useState(() => storedServerUrl());
  const [defaultUrl] = useState(() => defaultServerUrl());
  const [custom, setCustom] = useState(() => allowCustom && !!stored && stored !== defaultUrl);
  const [serverUrl, setServerUrl] = useState(() => stored || defaultUrl);
  const [tenantId, setTenantId] = useState(DEV_DEFAULTS.tenantId);
  const [email, setEmail] = useState(DEV_DEFAULTS.email);
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveUrl = allowCustom && custom ? serverUrl.trim().replace(/\/$/, '') || defaultUrl : defaultUrl;

  const useDefault = () => {
    setCustom(false);
    setServerUrl(defaultUrl);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'password') await login(effectiveUrl, 'password', { tenantId, email, password });
      else await login(effectiveUrl, 'key', { accessKey, secretKey });
    } catch (err) {
      setError(err?.code ? errorMessage(t, err) : t('login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const secretInput = (id, value, setter, label, autoComplete, tipText) => (
    <div className="field">
      <label htmlFor={id} {...tip(tipText)}>{label}</label>
      <div className="password-wrap">
        <input id={id} {...tip(tipText)} type={reveal ? 'text' : 'password'} value={value} onChange={(e) => setter(e.target.value)} required disabled={loading} autoComplete={autoComplete} />
        <button type="button" className="icon-button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? t('common.actions.hide') : t('common.actions.reveal')} {...tip(t(reveal ? 'tips.form.hide' : 'tips.form.reveal'))}>
          {reveal ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/assets/logo.png" alt="" width="56" height="56" />
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>

        <div className="login-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'password'} className={`login-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')} {...tip(t('tips.login.passwordTab'))}>
            {t('login.tabs.password')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'key'} className={`login-tab ${tab === 'key' ? 'active' : ''}`} onClick={() => setTab('key')} {...tip(t('tips.login.keyTab'))}>
            {t('login.tabs.accessKey')}
          </button>
        </div>

        <form className="login-form" onSubmit={submit}>
          {allowCustom && custom && (
            <div className="field">
              <label htmlFor="serverUrl" {...tip(t('tips.login.serverUrl'))}>{t('login.serverUrl')}</label>
              <input id="serverUrl" {...tip(t('tips.login.serverUrl'))} type="url" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} required disabled={loading} />
            </div>
          )}
          {tab === 'password' ? (
            <>
              <div className="field">
                <label htmlFor="tenantId" {...tip(t('tips.login.tenantId'))}>{t('login.tenantId')}</label>
                <input id="tenantId" {...tip(t('tips.login.tenantId'))} type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} disabled={loading} placeholder="default" />
              </div>
              <div className="field">
                <label htmlFor="email" {...tip(t('tips.login.email'))}>{t('login.email')}</label>
                <input id="email" {...tip(t('tips.login.email'))} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="username" />
              </div>
              {secretInput('password', password, setPassword, t('login.password'), 'current-password', t('tips.login.password'))}
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="accessKey" {...tip(t('tips.login.accessKey'))}>{t('login.accessKey')}</label>
                <input id="accessKey" {...tip(t('tips.login.accessKey'))} type="text" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} required disabled={loading} autoComplete="username" placeholder="access_..." />
              </div>
              {secretInput('secretKey', secretKey, setSecretKey, t('login.secretKey'), 'current-password', t('tips.login.secretKey'))}
            </>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="button-primary" disabled={loading} data-testid="login-submit" {...tip(t('tips.login.submit'))}>
            {loading ? t('login.connecting') : t('login.submit')}
          </button>
        </form>

        <div className="login-lang">
          <LanguageSelector />
          <button type="button" className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? t('common.theme.switchToLight') : t('common.theme.switchToDark')} {...tip(t(theme === 'dark' ? 'tips.topbar.themeLight' : 'tips.topbar.themeDark'))}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        {allowCustom && (
          <div className="login-server-toggle">
            {custom ? (
              <button type="button" className="button-link" data-testid="login-use-default-server" onClick={useDefault} disabled={loading} {...tip(t('tips.login.useDefaultServer'))}>
                {t('login.useDefaultServer')}
              </button>
            ) : (
              <button type="button" className="button-link" data-testid="login-use-different-server" onClick={() => setCustom(true)} disabled={loading} {...tip(t('tips.login.useDifferentServer'))}>
                {t('login.useDifferentServer')}
              </button>
            )}
          </div>
        )}
        <div className="login-footer">{t('login.footerHint')}</div>
        <div className="login-footer login-server" data-testid="login-server" {...tip(t('tips.login.serverInUse'))}>
          {t('login.serverInUse')} <code>{effectiveUrl}</code>
        </div>
      </div>
    </main>
  );
}
