import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Route page header. Sets document.title and renders title, summary, and actions. */
export default function PageHeader({ title, subtitle, actions }) {
  const { t } = useTranslation();
  useEffect(() => {
    if (title) document.title = `${title} | ${t('common.appName')}`;
  }, [title, t]);

  return (
    <header className="page-header">
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <div className="page-header-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
