import { Badge } from './StatusBadge';
import { isActive } from '../utils/freezes';

/** Freeze status pill (AA3): Active while the freeze is in force, Lifted after. */
export function FreezeStatusBadge({ freeze, t }) {
  if (!freeze) return '-';
  const active = isActive(freeze);
  return (
    <Badge tone={active ? 'danger' : 'neutral'} tip={t(active ? 'tips.freezes.status.active' : 'tips.freezes.status.lifted')}>
      {t(active ? 'freezes.status.active' : 'freezes.status.lifted')}
    </Badge>
  );
}
