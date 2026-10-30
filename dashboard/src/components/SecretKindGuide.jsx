import { useTranslation } from 'react-i18next';
import CodeBlock from './CodeBlock';
import { tip } from './Tooltip';
import { secretGuide } from '../utils/secretGuides';

/**
 * "How to get this value" for one secret kind: numbered steps, each with an optional command to copy and an optional
 * link to the provider's page (new tab), and a caution for subscription logins. Renders nothing for a kind without a
 * guide.
 */
export default function SecretKindGuide({ kind }) {
  const { t } = useTranslation();
  const guide = secretGuide(kind);
  if (!guide) return null;
  return (
    <div className="secret-guide" data-testid="secret-guide" data-kind={kind}>
      <div className="section-title" {...tip(t('tips.secretGuide.title'))}>
        {t('components.secretGuide.title', { kind: t(`enums.secretKind.${kind}`, { defaultValue: kind }) })}
      </div>
      <ol className="secret-guide-steps">
        {guide.steps.map((step) => (
          <li key={step.key}>
            <span>{t(`components.secretGuide.${kind}.${step.key}`)}</span>
            {step.link && (
              <>
                {' '}
                <a href={step.link} target="_blank" rel="noopener noreferrer" data-testid={`secret-guide-link-${step.key}`} {...tip(t('tips.secretGuide.link', { url: step.link }))}>
                  {new URL(step.link).host} <span aria-hidden="true">↗</span>
                </a>
              </>
            )}
            {step.code && <CodeBlock value={step.code} />}
          </li>
        ))}
      </ol>
      {guide.note && (
        <div className="info-banner" role="note" data-testid="secret-guide-note">
          {t(`components.secretGuide.${kind}.note`)}
        </div>
      )}
    </div>
  );
}
