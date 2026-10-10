// Normalizes API errors into localized, operator-facing messages.

/**
 * Localized message for an error. Prefers a translation for the stable error code, then the server message.
 * @param {Function} t i18next translate function.
 * @param {unknown} err Error (ApiError or any Error).
 * @returns {string}
 */
export function errorMessage(t, err) {
  if (!err) return t('common.errors.loadFailed');
  const code = err.code;
  if (code) {
    const key = `errorCodes.${code}`;
    const translated = t(key, { defaultValue: '' });
    if (translated && translated !== key) return translated;
  }
  if (err.status === 0) return t('errorCodes.NetworkError');
  return err.message || t('common.errors.loadFailed');
}

/**
 * Detail suffix for an error: request ID and required permission when present.
 * @param {Function} t i18next translate function.
 * @param {unknown} err Error.
 * @returns {string}
 */
export function errorDetail(t, err) {
  const parts = [];
  if (err?.requiredPermission) parts.push(t('common.errors.requiredPermission', { permission: err.requiredPermission, resource: err.resourceType || '' }));
  if (err?.requestId) parts.push(t('common.errors.requestId', { id: err.requestId }));
  return parts.join(' ');
}

/** True when the error indicates the endpoint does not exist on this server yet. */
export function isMissingEndpoint(err) {
  return err?.status === 404 && (err?.code === 'RouteNotFound' || err?.code === 'Http404');
}
