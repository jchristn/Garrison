// Field hints for the architect forms (Agents > Architects, the studio's New architect dialog, and the setup wizard):
// one message per field, naming the page its choices come from and linking to it, because those records are made
// elsewhere.

import DependencyHint from './DependencyHint';
import { pathFor } from '../config/navConfig';
import { CREDENTIAL_KINDS } from '../utils/architect';
import { formatList } from '../i18n/formatters';

/** Harness profiles live on Configuration > Harness Profiles. */
export function harnessProfileHint(t) {
  return <DependencyHint testId="architect-harness-hint" text={t('components.architectHints.harness')} links={[{ href: pathFor('harnessProfiles'), label: t('components.architectHints.harnessLink') }]} />;
}

/**
 * One message about the credential, which lives on Configuration > Secrets. When the chosen harness needs one and
 * none is chosen, it is a warning that names the secret kinds to use and says whether the tenant has any secrets.
 */
export function credentialHint(t, { profile = null, secretCount = 0, chosen = '', onRefresh, lng = 'en' } = {}) {
  const kinds = profile ? CREDENTIAL_KINDS[profile.harnessType] || [] : [];
  const list = formatList(kinds, lng, { type: 'disjunction' });
  let text;
  let warning = '';
  if (!profile) text = t('components.architectHints.credentialNoProfile');
  else if (!kinds.length) text = t('components.architectHints.credentialNotNeeded', { profile: profile.name });
  else if (chosen) text = t('components.architectHints.credentialChosen', { profile: profile.name });
  else warning = t(secretCount ? 'components.architectHints.credentialPick' : 'components.architectHints.credentialAdd', { profile: profile.name, kinds: list });
  return (
    <DependencyHint
      testId="architect-credential-hint"
      warning={warning}
      text={text}
      links={[{ href: pathFor('secrets'), label: t('components.architectHints.credentialLink'), testId: 'architect-open-secrets' }]}
      onRefresh={onRefresh}
    />
  );
}

/**
 * Architect prompts live on Configuration > Prompt Templates. `description` is the chosen prompt's own description;
 * `editing` adds that a change applies on the architect's next turn (meaningless for a new architect).
 */
export function architectPromptHint(t, description = '', editing = false) {
  return (
    <DependencyHint
      testId="architect-prompt-hint"
      text={[description, editing ? t('components.architectHints.prompt') : '']}
      links={[{ href: pathFor('promptTemplates'), label: t('components.architectHints.promptLink') }]}
    />
  );
}
