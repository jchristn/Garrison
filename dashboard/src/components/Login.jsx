import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { DEV_DEFAULTS, STORAGE_KEYS, defaultServerUrl } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import LanguageSelector from './LanguageSelector';
import { EyeIcon, EyeOffIcon, SunIcon, MoonIcon } from './Icons';

/** Login: server URL plus email and password, or access key and secret key. */
export default function Login() {
  const { t } = useTranslation();
  const { login, theme, toggleTheme } = useAuth();
  const [tab, setTab] = useState('password');
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem(STORAGE_KEYS.serverUrl) || defaultServerUrl());
  const [tenantId, setTenantId] = useState(DEV_DEFAULTS.tenantId);
  const [email, setEmail] = useState(DEV_DEFAULTS.email);
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'password') await login(serverUrl, 'password', { tenantId, email, password });
      else await login(serverUrl, 'key', { accessKey, secretKey });
    } catch (err) {
      setError(err?.code ? errorMessage(t, err) : t('login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const secretInput = (id, value, setter, label, autoComplete) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input id={id} type={reveal ? 'text' : 'password'} value={value} onChange={(e) => setter(e.target.value)} required disabled={loading} autoComplete={autoComplete} />
        <button type="button" className="icon-button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? t('common.actions.hide') : t('common.actions.reveal')} title={reveal ? t('common.actions.hide') : t('common.actions.reveal')}>
          {reveal ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/assets/logo.svg" alt="" width="56" height="56" />
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>

        <div className="login-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'password'} className={`login-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
            {t('login.tabs.password')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'key'} className={`login-tab ${tab === 'key' ? 'active' : ''}`} onClick={() => setTab('key')}>
            {t('login.tabs.accessKey')}
          </button>
        </div>

        <form className="login-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="serverUrl">{t('login.serverUrl')}</label>
            <input id="serverUrl" type="url" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} required disabled={loading} />
          </div>
          {tab === 'password' ? (
            <>
              <div className="field">
                <label htmlFor="tenantId">{t('login.tenantId')}</label>
                <input id="tenantId" type="text" value={tenantId} onChange={(e) => setTenantId(e.target.value)} disabled={loading} placeholder="ten_default" />
              </div>
              <div className="field">
                <label htmlFor="email">{t('login.email')}</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="username" />
              </div>
              {secretInput('password', password, setPassword, t('login.password'), 'current-password')}
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="accessKey">{t('login.accessKey')}</label>
                <input id="accessKey" type="text" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} required disabled={loading} autoComplete="username" placeholder="access_..." />
              </div>
              {secretInput('secretKey', secretKey, setSecretKey, t('login.secretKey'), 'current-password')}
            </>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="button-primary" disabled={loading} data-testid="login-submit">
            {loading ? t('login.connecting') : t('login.submit')}
          </button>
        </form>

        <div className="login-lang">
          <LanguageSelector />
          <button type="button" className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? t('common.theme.switchToLight') : t('common.theme.switchToDark')} title={theme === 'dark' ? t('common.theme.switchToLight') : t('common.theme.switchToDark')}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        <div className="login-footer">{t('login.footerHint')}</div>
      </div>
    </main>
  );
}
