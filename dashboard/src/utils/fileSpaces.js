// Conversation file spaces (AD3): the shared folder every turn of a conversation, and every agent it delegates to,
// reads and writes. Helpers shared by the Files tab on Conversation detail, its version and upload panels, and tests.

import { fieldErrorMessages } from './errors';

/** Error codes the server answers with 413 when a write passes a limit, and the setting that sets each limit. */
export const FILE_SPACE_LIMIT_SETTINGS = {
  FileTooLarge: 'FileSpaces.MaxFileBytes',
  FileSpaceFull: 'FileSpaces.MaxTotalBytes',
  TooManyFiles: 'FileSpaces.MaxFiles'
};

/** Default directory, relative to the run's workspace, that a deployment syncs the file space into. */
export const DEFAULT_FILE_SPACE_MOUNT_PATH = 'files';

/** How often (ms) the Files tab refreshes while the live channel is not subscribed. */
export const FILES_POLL_MS = 10000;

/** WebSocket channel that pushes files.changed for one conversation. */
export function filesChannel(conversationId) {
  return `conversation-files:${conversationId}`;
}

/**
 * Normalize GET /conversations/{id}/files into { fileSpaceId, fileCount, totalBytes, files } with files sorted by
 * path. A conversation whose space has not been created yet answers with no files and a null fileSpaceId.
 */
export function normalizeListing(listing) {
  const files = Array.isArray(listing?.files) ? [...listing.files] : [];
  files.sort((a, b) => String(a.path || '').localeCompare(String(b.path || '')));
  return { fileSpaceId: listing?.fileSpaceId || null, fileCount: Number(listing?.fileCount ?? files.filter((f) => !f.deleted).length), totalBytes: Number(listing?.totalBytes ?? 0), files };
}

/**
 * The baseVersion an upload to `path` sends: the current version of the listed file at that path, or 0 when no
 * live file has it (new files, and paths whose file was deleted, start from 0). The server keeps a write whose
 * base is stale under a conflict name instead of overwriting.
 */
export function baseVersionFor(path, files) {
  const wanted = String(path || '').trim();
  const match = (files || []).find((f) => f && !f.deleted && f.path === wanted);
  return match ? Number(match.currentVersion) || 0 : 0;
}

/** Body for POST /conversations/{id}/files: trimmed path, base64 content, the media type when known, and the base version. */
export function fileUploadBody(entry, baseVersion) {
  const body = { path: String(entry?.path || '').trim(), contentBase64: entry?.contentBase64 || '', baseVersion: Number(baseVersion) || 0 };
  if (entry?.mediaType) body.mediaType = entry.mediaType;
  return body;
}

/** The setting that limits a 413 write: the error body's setting, the code's known setting, or one named in the message. */
export function fileLimitSetting(err) {
  if (!err || err.status !== 413) return '';
  const body = err.body && typeof err.body === 'object' ? err.body : {};
  if (body.setting) return body.setting;
  if (FILE_SPACE_LIMIT_SETTINGS[err.code]) return FILE_SPACE_LIMIT_SETTINGS[err.code];
  const m = /\((FileSpaces\.[A-Za-z]+)\)/.exec(String(body.message || err.message || ''));
  return m ? m[1] : '';
}

/** The message for a refused path (400 InvalidFilePath on path), translated through the field codes, or ''. */
export function pathFieldError(t, err) {
  const fields = fieldErrorMessages(t, err);
  return (fields && fields.path) || '';
}

/** Result of one upload for the result list: { requestedPath, path, version, conflict }. */
export function uploadOutcome(entry, res) {
  const requestedPath = res?.requestedPath || String(entry?.path || '').trim();
  return { requestedPath, path: res?.path || requestedPath, version: Number(res?.version) || 0, conflict: !!res?.conflict };
}

/**
 * Who wrote a version: writtenBy (the agent's name for a run, the principal's name for an upload), falling back to
 * the writing run's identifier, or '' when the server did not say.
 */
export function versionWriter(version) {
  if (!version) return '';
  return version.writtenBy || version.runId || '';
}

/** True when a files.changed message is for this conversation. */
export function isFilesChanged(message, conversationId) {
  return message?.type === 'files.changed' && (!message.conversationId || message.conversationId === conversationId);
}
