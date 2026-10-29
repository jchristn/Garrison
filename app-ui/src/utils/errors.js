// Turns an AppGatewayError into translated text. Known server codes have their own message (errors.<code>); anything
// else shows the HTTP status, and a network failure says the server could not be reached.

/** Translated message for an error. t is i18next's t. */
export function errorText(t, err) {
  if (!err) return '';
  const code = err.code || (err.status === 0 ? 'NetworkError' : null);
  if (code) {
    const key = `errors.${code}`;
    const text = t(key);
    if (text && text !== key) return text;
  }
  if (err.status === 401) return t('errors.AppSessionRequired');
  return t('errors.generic', { status: err.status || 0 });
}
