import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { renderMarkdown } from '../utils/markdown.js';

// An agent answer rendered as sanitized Markdown. Links open in a new tab and carry a tooltip with their target.
export default function Markdown({ text }) {
  const { t } = useTranslation();
  const html = useMemo(
    () =>
      renderMarkdown(text, {
        linkTip: (href) => t('tips.answerLink', { href }),
        headerTip: (header) => t('tips.tableHeader', { text: header })
      }),
    [text, t]
  );
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
