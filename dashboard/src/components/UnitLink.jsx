import { useTranslation } from 'react-i18next';
import StudioLink from './studio/StudioLink';
import { unitPath } from '../utils/organizations';

/**
 * A link to one organization unit (UXP1-S004): its name, with the organization's name after it unless
 * `showOrganization` is false, opening the organization's Design tab with the unit selected. `unit` carries id, name,
 * organizationId, and organizationName (see utils/organizations orgUnitIndex). Without an organization it is plain text.
 */
export default function UnitLink({ unit, testId, showOrganization = true }) {
  const { t } = useTranslation();
  if (!unit) return null;
  const text = showOrganization && unit.organizationName ? t('links.unitInOrganization', { unit: unit.name || unit.id, organization: unit.organizationName }) : unit.name || unit.id;
  const href = unitPath(unit.organizationId, unit.id);
  if (!href) return <span>{text}</span>;
  return (
    <StudioLink to={href} testId={testId} tipText={t('tips.links.openUnit')}>
      {text}
    </StudioLink>
  );
}
