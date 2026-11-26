import FrozenBanner from './FrozenBanner';
import useActiveFreezes from '../hooks/useActiveFreezes';
import useCallerPermissions from '../hooks/useCallerPermissions';

/**
 * Frozen banner for list pages (AA3): the Deployments and Apps lists have no page per record, so the list names every
 * frozen record of its kind, with Lift. Shows nothing when none is frozen or freezes cannot be read.
 */
export default function FrozenListBanner({ targetKind }) {
  const { freezes } = useActiveFreezes();
  const permissions = useCallerPermissions();
  const mine = freezes.filter((f) => f.targetKind === targetKind);
  return <FrozenBanner freezes={mine} permissions={permissions} link={false} testId="frozen-list-banner" />;
}
