import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { MoonIcon, SunIcon } from './Icons.jsx';

// Switches between the light and dark theme. The button names the theme it switches to.
export default function ThemeToggle({ theme, onToggle }) {
  const { t } = useTranslation();
  const toDark = theme !== 'dark';
  return (
    <button
      type="button"
      className="icon-button"
      onClick={onToggle}
      aria-label={toDark ? t('header.themeDark') : t('header.themeLight')}
      {...tip(toDark ? t('tips.themeDark') : t('tips.themeLight'))}
      data-testid="theme-toggle"
    >
      {toDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
