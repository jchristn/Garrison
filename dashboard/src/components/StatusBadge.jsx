import { statusClass, methodClass } from '../i18n/formatters';
import { tip as tipProps } from './Tooltip';

/** HTTP status-code pill. */
export function StatusBadge({ code, tip }) {
  return (
    <span className={statusClass(code)} {...tipProps(tip)}>
      {code}
    </span>
  );
}

/** HTTP method pill. */
export function MethodPill({ method, tip }) {
  return (
    <span className={methodClass(method)} {...tipProps(tip)}>
      {method}
    </span>
  );
}

/** Generic labeled pill with a semantic tone. */
export function Badge({ tone = 'neutral', children, tip }) {
  return (
    <span className={`pill pill-${tone}`} {...tipProps(tip)}>
      {children}
    </span>
  );
}

/** Boolean active/inactive pill. */
export function ActiveBadge({ active, activeLabel, inactiveLabel, tip }) {
  return (
    <span className={`pill ${active ? 'pill-success' : 'pill-neutral'}`} {...tipProps(tip)}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
