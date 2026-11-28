import TourRunner from './tours/TourRunner';
import TourPicker from './tours/TourPicker';

/**
 * The guided tours in the shell (LP4.5): the engine that runs the active tour, and the sidebar's list of tours. The
 * old single shell tour is now the "First look" tour in config/tours.js. Render inside a TourProvider.
 */
export default function Tour() {
  return (
    <>
      <TourRunner />
      <TourPicker />
    </>
  );
}
