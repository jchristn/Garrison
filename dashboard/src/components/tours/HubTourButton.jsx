import { useTranslation } from 'react-i18next';
import { useTours } from '../../context/TourContext';
import { hubTourFor } from '../../config/tours';
import { tourKey } from '../learn/learnSections';
import { HelpIcon } from '../Icons';
import { tip } from '../Tooltip';

/**
 * A hub's "?" button (LP4.7): starts the tour that covers the hub, or the one for the open tab when config/tours.js
 * names one. Renders nothing for a hub without a tour, or outside a TourProvider.
 */
export default function HubTourButton({ hubKey, tab = null }) {
  const { t } = useTranslation();
  const tours = useTours();
  const tourId = hubTourFor(hubKey, tab);
  if (!tourId || !tours?.startTour) return null;
  const name = t(tourKey(tourId));
  return (
    <button
      type="button"
      className="button-secondary hub-tour-button"
      onClick={() => tours.startTour(tourId)}
      aria-label={t('tours.hub.label', { tour: name })}
      data-testid="hub-tour"
      data-hub-tour={tourId}
      {...tip(t('tips.tours.hub', { tour: name }))}
    >
      <HelpIcon size={16} />
    </button>
  );
}
