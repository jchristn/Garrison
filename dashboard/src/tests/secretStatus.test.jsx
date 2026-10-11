// Secret credential status (G-22): the Secrets list badge and the form notice for a Codex login that needs
// reauthentication, rendered against the e2e mock rows.
import { describe, it, expect, beforeAll } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../i18n';
import { secretsConfig } from '../views/resourceConfigs';
import { respond } from '../../tests/e2e/mocks.js';

const secrets = () => respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/secrets?maxResults=25&skip=0&pageSize=25')).objects;

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('secret status', () => {
  const ctx = () => ({ t: i18n.getFixedT('en'), i18n });

  it('shows a translated status badge with a tooltip', () => {
    const column = secretsConfig.columns(ctx()).find((c) => c.key === 'status');
    expect(column.label).toBe('Status');
    expect(column.tip).toMatch(/still works/);
    const rejected = secrets().find((s) => s.status === 'NeedsReauthentication');
    const markup = renderToStaticMarkup(column.render(rejected));
    expect(markup).toContain('Needs reauthentication');
    expect(markup).toContain('pill-danger');
    expect(markup).toMatch(/data-tip="OpenAI rejected the stored ChatGPT login/);
    const ok = renderToStaticMarkup(column.render(secrets().find((s) => s.status === 'Ok')));
    expect(ok).toContain('>OK<');
  });

  it('explains reauthentication in the form and shows Codex login times', () => {
    const rejected = secrets().find((s) => s.status === 'NeedsReauthentication');
    const markup = renderToStaticMarkup(secretsConfig.formNotice(rejected, ctx()));
    expect(markup).toContain('secret-reauth-warning');
    expect(markup).toContain('refresh_token_reused');
    expect(markup).toContain('CODEX_HOME');
    expect(markup).toContain('Last refreshed by Garrison');
    expect(markup).toContain('Access token expires');
  });

  it('shows nothing for a healthy secret that is not a Codex login', () => {
    expect(secretsConfig.formNotice(secrets().find((s) => s.status === 'Ok'), ctx())).toBeNull();
    expect(secretsConfig.formNotice(null, ctx())).toBeNull();
  });

  it('translates the status in every locale', () => {
    for (const lng of ['de', 'es', 'fr', 'it', 'ja', 'zh-Hans', 'zh-Hant', 'yue-Hant']) {
      const t = i18n.getFixedT(lng);
      expect(t('enums.secretStatus.NeedsReauthentication')).not.toBe('Needs reauthentication');
      expect(t('resources.secrets.reauth.action')).toContain('CODEX_HOME');
    }
  });
});
