import ActionMenu from './ActionMenu';
import { tip } from './Tooltip';

/**
 * The shared row action pattern (UXP1-V027): at most one inline primary action, then the three-dot menu with the rest.
 * `primary`: { label, tip, onClick, testId?, disabled?, hidden? } or null. `items`: ActionMenu items. `label` names the
 * record for the menu trigger's tooltip, and `menuTestId` sets the trigger's data-testid. A disabled primary keeps
 * aria-disabled (not the disabled attribute), so its tooltip still says why.
 */
export default function RowActions({ primary = null, items = [], label = '', menuTestId }) {
  const showPrimary = primary && !primary.hidden;
  return (
    <span className="row-actions">
      {showPrimary && (
        <button
          type="button"
          className="button-ghost button-sm"
          aria-disabled={primary.disabled ? 'true' : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (!primary.disabled) primary.onClick?.();
          }}
          data-testid={primary.testId}
          {...tip(primary.tip)}
        >
          {primary.label}
        </button>
      )}
      <ActionMenu items={items} label={label} testId={menuTestId} />
    </span>
  );
}
