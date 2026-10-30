// Field hints for the architect forms (Agents > Architects, the studio's New architect dialog, and the setup wizard):
// each names the page its choices come from and links to it, because those records are made elsewhere.

import DependencyHint from './DependencyHint';
import { pathFor } from '../config/navConfig';
import { CREDENTIAL_KINDS, needsCredential } from '../utils/architect';
import { formatList } from '../i18n/formatters';

/** Where harness profiles come from: Configuration > Harness Profiles. */
export function harnessProfileHint(t, onRefresh) {
  return (
    <DependencyHint
      testId="architect-harness-hint"
      text={t('components.architectHints.harness')}
      links={[{ href: pathFor('harnessProfiles'), label: t('components.architectHints.harnessLink') }]}
      onRefresh={onRefresh}
    />
  );
}

/**
 * Where the credential comes from: Configuration > Secrets, with the secret kinds the chosen harness signs in with, a
 * note when the tenant has no secrets, and a warning when the harness needs one and none is chosen.
 */
export function credentialHint(t, { profile = null, secretCount = 0, chosen = '', onRefresh, lng = 'en' } = {}) {
  const kinds = profile ? CREDENTIAL_KINDS[profile.harnessType] || [] : [];
  const parts = [t('components.architectHints.credential')];
  if (kinds.length) parts.push(t('components.architectHints.credentialKinds', { profile: profile.name, kinds: formatList(kinds, lng, { type: 'disjunction' }) }));
  else if (profile) parts.push(t('components.architectHints.credentialNotNeeded', { profile: profile.name }));
  if (!secretCount) parts.push(t('components.architectHints.credentialNone'));
  const missing = !!profile && needsCredential(profile.harnessType) && !chosen;
  return (
    <DependencyHint
      testId="architect-credential-hint"
      warning={missing ? t('components.architectHints.credentialMissing', { profile: profile.name }) : ''}
      text={parts.join(' ')}
      links={[{ href: pathFor('secrets'), label: t('components.architectHints.credentialLink'), testId: 'architect-open-secrets' }]}
      onRefresh={onRefresh}
    />
  );
}

/** Where architect prompts come from: Configuration > Prompt Templates (System templates). */
export function architectPromptHint(t, onRefresh, extra = '') {
  return (
    <DependencyHint
      testId="architect-prompt-hint"
      text={[extra, t('components.architectHints.prompt')]}
      links={[{ href: pathFor('promptTemplates'), label: t('components.architectHints.promptLink') }]}
      onRefresh={onRefresh}
    />
  );
}
