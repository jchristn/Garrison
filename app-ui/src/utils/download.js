// File downloads from the conversation file space. The preferred path asks the gateway for a short-lived download
// URL (absolute, no credentials needed) and lets the browser fetch it, so large files stream straight to disk. When
// that fails for any reason other than a lost session, the bytes are fetched with the session and saved from a
// Blob URL instead.

/** The file name part of a file space path. */
export function fileName(path) {
  const parts = String(path || '').split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'download';
}

function clickLink(href, name) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Download a file (current version unless version is given). Returns 'url' or 'content' for the path taken. */
export async function downloadFile(client, conversationId, path, version) {
  const name = fileName(path);
  try {
    const link = await client.downloadUrl(conversationId, path, version);
    if (link && link.url) {
      clickLink(link.url, name);
      return 'url';
    }
  } catch (err) {
    if (err && err.status === 401) throw err;
  }
  const blob = await client.fileContent(conversationId, path, version);
  const href = URL.createObjectURL(blob);
  clickLink(href, name);
  setTimeout(() => URL.revokeObjectURL(href), 30000);
  return 'content';
}
