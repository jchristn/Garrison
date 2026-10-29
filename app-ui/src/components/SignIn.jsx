import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import LanguageSelect from './LanguageSelect.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { errorText } from '../utils/errors.js';

// The platform website the sign-in footer links to (AD12.12).
const WEBSITE_URL = 'https://usegarrison.ai';

// Sign-in screen for an app (AD-021). Every auth mode accepts an email and password (TenantUsers: any user of the
// app's tenant; AppUsers: users with the AppUser role on the app). When the app allows anonymous sessions,
// "Continue without signing in" starts one. A small footer names the platform the app runs on (AD12.12).
export default function SignIn({ client, info, logoUrl, notice, onSignedIn, theme, onToggleTheme }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const name = info.displayName || info.slug;

  const run = async (kind, action) => {
    setBusy(kind);
    setError(null);
    try {
      const session = await action();
      onSignedIn(session);
    } catch (err) {
      setError(err);
      setBusy(null);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    run('password', () => client.signIn(email.trim(), password));
  };

  return (
    <main className="signin-page">
      <div className="signin-tools">
        <LanguageSelect />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <section className="signin-card" aria-labelledby="signin-title">
        <div className="signin-brand">
          {logoUrl ? <img className="brand-logo large" src={logoUrl} alt={t('header.logoAlt', { name })} /> : null}
          <h1 id="signin-title">{t('signIn.title', { name })}</h1>
          {info.description ? <p className="signin-description">{info.description}</p> : null}
        </div>
        {notice ? (
          <p className="notice notice-info" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="notice notice-error" role="alert" data-testid="signin-error">
            {errorText(t, error)}
          </p>
        ) : null}
        <form className="signin-form" onSubmit={submit} noValidate>
          <label htmlFor="app-email" {...tip(t('tips.email'))}>
            {t('signIn.email')}
          </label>
          <input id="app-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required {...tip(t('tips.email'))} />
          <label htmlFor="app-password" {...tip(t('tips.password'))}>
            {t('signIn.password')}
          </label>
          <input id="app-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required {...tip(t('tips.password'))} />
          <button type="submit" className="button primary block" disabled={!!busy || !email.trim() || !password} {...tip(t('tips.submit'))} data-testid="signin-submit">
            {busy === 'password' ? t('signIn.submitting') : t('signIn.submit')}
          </button>
        </form>
        {info.anonymousAllowed ? (
          <div className="signin-anonymous">
            <p className="divider">
              <span>{t('signIn.or')}</span>
            </p>
            <button type="button" className="button secondary block" disabled={!!busy} onClick={() => run('anonymous', () => client.continueAnonymously())} {...tip(t('tips.anonymous'))} data-testid="signin-anonymous">
              {t('signIn.anonymous')}
            </button>
            <p className="hint">{t('signIn.anonymousNote')}</p>
          </div>
        ) : null}
      </section>
      <p className="signin-powered">
        <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" data-testid="powered-by" {...tip(t('tips.poweredBy'))}>
          {t('signIn.poweredBy')}
        </a>
      </p>
    </main>
  );
}
