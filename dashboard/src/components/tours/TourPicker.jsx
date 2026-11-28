import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from '../Modal';
import { Badge } from '../StatusBadge';
import { tip } from '../Tooltip';
import { useApp } from '../../context/AppContext';
import { useTours } from '../../context/TourContext';
import { TOURS, tourNamespace } from '../../config/tours';
import { DASHBOARD_BASE } from '../../config/navConfig';
import { tourKey } from '../learn/learnSections';

/**
 * The sidebar's Guided tour list (LP4.5): every tour with what it covers and how many steps it has, marked when this
 * person has finished it, with Start or Replay. Opened through AppContext.setTourOpen, as the single shell tour was.
 */
export default function TourPicker() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tourOpen, setTourOpen } = useApp();
  const tours = useTours();
  if (!tourOpen || !tours) return null;
  const close = () => setTourOpen(false);
  const start = (id) => {
    close();
    tours.startTour(id);
  };

  return (
    <Modal
      open
      onClose={close}
      title={t('tours.picker.title')}
      footer={
        <>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              close();
              navigate(`${DASHBOARD_BASE}/learn`);
            }}
            data-testid="tour-picker-learn"
            {...tip(t('tips.tours.pickerLearn'))}
          >
            {t('tours.picker.learn')}
          </button>
          <button type="button" className="button-primary" onClick={close} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <p className="text-muted">{t('tours.picker.intro')}</p>
      <ul className="tour-picker" data-testid="tour-picker">
        {TOURS.map((x) => {
          const done = tours.isCompleted(x.id);
          const name = t(tourKey(x.id));
          return (
            <li key={x.id} className="tour-picker-row" data-tour-row={x.id}>
              <div className="tour-picker-text">
                <strong>{name}</strong>
                {done && (
                  <>
                    {' '}
                    <Badge tone="success" tip={t('tips.tours.finished')}>
                      {t('tours.picker.finished')}
                    </Badge>
                  </>
                )}
                <span className="text-muted">{t(`${tourNamespace(x.id)}.summary`)}</span>
                <span className="text-muted tour-picker-count">{t('tours.picker.steps', { count: x.steps.length })}</span>
              </div>
              <button type="button" className={done ? 'button-secondary button-sm' : 'button-primary button-sm'} onClick={() => start(x.id)} data-testid={`tour-picker-start-${x.id}`} {...tip(t(done ? 'tips.tours.replay' : 'tips.tours.start', { tour: name }))}>
                {done ? t('tours.picker.replay') : t('tours.picker.start')}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
