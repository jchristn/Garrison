import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';

// The platform website the footer links to (AD12.12).
export const WEBSITE_URL = 'https://usegarrison.ai';

// A small "Powered by Garrison" line, on the sign-in page and under the chat, unless the app sets showPoweredBy false.
export default function PoweredBy({ className = '' }) {
  const { t } = useTranslation();
  return (
    <p className={`powered-by ${className}`}>
      <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" data-testid="powered-by" {...tip(t('tips.poweredBy'))}>
        {t('signIn.poweredBy')}
      </a>
    </p>
  );
}
