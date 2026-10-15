import { afterAll, describe, it, expect } from 'vitest';
import i18n from '../i18n';
import resources from '../i18n/resources.js';
import { fieldErrorMessages, FIELD_CODES } from '../utils/errors';

// P15.22: the server's new field codes for secret use, the grant ceiling, and reserved role names are translated in
// every locale instead of showing the English server message.
const CODES = ['SecretUseDenied', 'GrantCeiling', 'ReservedRoleName'];

afterAll(async () => { await i18n.changeLanguage('en'); });

describe('security field codes', () => {
  it('are known field codes', () => {
    for (const code of CODES) expect(FIELD_CODES).toContain(code);
  });
  it('are translated in every locale', async () => {
    for (const lng of Object.keys(resources)) {
      await i18n.changeLanguage(lng);
      for (const code of CODES) {
        const out = fieldErrorMessages(i18n.t.bind(i18n), { fields: { roleId: 'server text' }, fieldCodes: { roleId: code } });
        expect(out.roleId, `${lng} ${code}`).not.toBe('server text');
        expect(out.roleId.length, `${lng} ${code}`).toBeGreaterThan(0);
      }
    }
  });
});
