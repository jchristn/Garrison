import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { renderMarkdown } from '../utils/markdown.js';
import { filePathFromHref } from '../utils/fileLinks.js';

const NO_FILES = [];

// An agent answer rendered as sanitized Markdown. Links open in a new tab and carry a tooltip with their target.
// When filePaths and onFile are given, links to files the agent wrote (sandbox:, file:, or a path in the file
// listing) download the file from the conversation's file space instead.
export default function Markdown({ text, filePaths, onFile }) {
  const { t } = useTranslation();
  const fileLinks = onFile ? filePaths || NO_FILES : null;
  const html = useMemo(
    () =>
      renderMarkdown(text, {
        linkTip: (href) => t('tips.answerLink', { href }),
        headerTip: (header) => t('tips.tableHeader', { text: header }),
        fileTip: (path) => t('tips.fileLink', { path }),
        filePaths: fileLinks
      }),
    [text, t, fileLinks]
  );
  const onClick = (event) => {
    if (!onFile) return;
    const link = event.target && typeof event.target.closest === 'function' ? event.target.closest('a') : null;
    const path = link ? filePathFromHref(link.getAttribute('href')) : null;
    if (!path) return;
    event.preventDefault();
    onFile(path);
  };
  // File links are anchors, so Enter on a focused link raises the same click event.
  return <div className="markdown-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
