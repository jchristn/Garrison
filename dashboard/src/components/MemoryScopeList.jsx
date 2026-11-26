import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { ErrorBanner } from './States';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatBytes, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { groupScopes } from '../utils/memory';

/**
 * The memory scopes of the tenant (AA4.13), grouped by kind with entry counts, bytes, and the latest write. Choosing a
 * scope filters the entries table to it; choosing a kind's heading filters to every scope of that kind; All scopes
 * clears both. `scopes` is null while loading; `error` is the failed load. `selected` is { scopeKind, scopeId }.
 */
export default function MemoryScopeList({ scopes, error, selected, onSelect, onRetry }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const groups = groupScopes(scopes || []);
  const kind = selected?.scopeKind || '';
  const id = selected?.scopeId || '';
  const totalEntries = groups.reduce((sum, g) => sum + g.entryCount, 0);
  const totalBytes = groups.reduce((sum, g) => sum + g.bytes, 0);
  const totals = (count, bytes) => t('memory.scopes.totals', { count, entries: formatNumber(count, {}, lng), bytes: formatBytes(bytes, lng) });

  if (error) {
    return (
      <div className="memory-scopes" data-testid="memory-scopes">
        <ErrorBanner message={t('memory.scopes.loadFailed')} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <nav className="memory-scopes" aria-label={t('memory.scopes.label')} data-testid="memory-scopes" aria-busy={scopes === null ? 'true' : undefined}>
      <div className="memory-scopes-head">
        <button type="button" className={`memory-scope-all ${!kind ? 'is-selected' : ''}`} aria-pressed={!kind} onClick={() => onSelect('', '')} data-testid="memory-scope-all" {...tip(t('tips.memory.scopes.all'))}>
          <span className="memory-scope-name">{t('memory.scopes.all')}</span>
          <span className="memory-scope-meta">{scopes === null ? t('common.generic.loading') : totals(totalEntries, totalBytes)}</span>
        </button>
      </div>
      <div className="memory-scope-groups">
        {groups.map((g) => (
          <section key={g.kind} className="memory-scope-group" data-kind={g.kind} data-testid={`memory-scope-group-${g.kind}`}>
            <button type="button" className={`memory-scope-group-head ${kind === g.kind && !id ? 'is-selected' : ''}`} aria-pressed={kind === g.kind && !id} onClick={() => onSelect(g.kind, '')} {...tip(enumTip(t, 'memoryScopeKind', g.kind))}>
              <span className="memory-scope-kind">{enumLabel(t, 'memoryScopeKind', g.kind)}</span>
              <span className="memory-scope-meta">{totals(g.entryCount, g.bytes)}</span>
            </button>
            {g.scopes.length === 0 ? (
              <p className="memory-scope-empty text-muted">{scopes === null ? t('common.generic.loading') : t(`memory.scopes.empty.${g.kind}`)}</p>
            ) : (
              <ul className="memory-scope-items">
                {g.scopes.map((s) => {
                  const active = kind === s.scopeKind && id === s.scopeId;
                  const name = s.scopeName || t('memory.deletedScope', { id: s.scopeId });
                  return (
                    <li key={s.scopeId}>
                      <button
                        type="button"
                        className={`memory-scope-item ${active ? 'is-selected' : ''} ${s.scopeName ? '' : 'is-orphan'}`}
                        aria-pressed={active}
                        data-testid="memory-scope"
                        data-scope-id={s.scopeId}
                        onClick={() => onSelect(s.scopeKind, s.scopeId)}
                        {...tip(s.scopeName ? t('tips.memory.scopes.scope', { name, id: s.scopeId }) : t('tips.memory.scopes.orphan', { id: s.scopeId }))}
                      >
                        <span className="memory-scope-name">{name}</span>
                        <span className="memory-scope-meta">
                          {totals(s.entryCount || 0, s.bytes || 0)}
                          {s.lastUpdateUtc && (
                            <>
                              {' · '}
                              <span {...tip(formatDateTime(s.lastUpdateUtc, lng))}>{formatRelativeTime(s.lastUpdateUtc, lng)}</span>
                            </>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </nav>
  );
}
