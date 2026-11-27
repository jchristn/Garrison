// Normalizes API errors into localized, operator-facing messages.

import { translateServerText, stripCodePrefix } from './serverText';
import { EVAL_FIELD_CODES } from './evalErrors';

/**
 * Codes whose translation is generic ("The record was not found."). For these the server's own message is more
 * useful (it names the record and the reason), so it wins when the server sent one (M1-22, M1-24).
 */
const GENERIC_CODES = new Set(['NotFound', 'Conflict', 'NameConflict', 'InUse', 'ValidationFailed', 'InvalidBody', 'Http400', 'Http404', 'Http409']);

// Delete refusals carry resource names and recovery steps that a code translation cannot preserve.
const DELETE_REFUSAL_CODES = new Set(['Protected', 'BuiltInImmutable', 'RevisionPublished', 'CapabilityDerived', 'RunActive', 'PipelineRunActive', 'NodeActive', 'NodeHasRuns', 'ConversationBusy']);

function hasDeleteReason(code) {
  return DELETE_REFUSAL_CODES.has(code) || /InUse$/.test(code || '') || /^ReferencedBy/.test(code || '');
}

/**
 * Localized message for an error. Order: a translation of a known server message pattern; the server's own message
 * for generic codes and delete refusals (including reference and protection conflicts); a translation of the stable error code; the server message.
 * @param {Function} t i18next translate function.
 * @param {unknown} err Error (ApiError or any Error).
 * @returns {string}
 */
export function errorMessage(t, err) {
  if (!err) return t('common.errors.loadFailed');
  const code = err.code;
  // A body field of the wrong type (InvalidBody with InvalidType) or an unknown filter value (InvalidValue) names the
  // field; say which field and what it takes, translated, rather than the server's English sentence.
  const typed = typedFieldText(t, err);
  if (typed) return typed;
  // Only a message from a JSON error body counts as server text; a bare status line ("Not Found") does not.
  const bodyMessage = err.body && typeof err.body === 'object' ? err.body.message : null;
  const serverText = typeof bodyMessage === 'string' && bodyMessage ? stripCodePrefix(bodyMessage, code) : '';
  if (serverText) {
    const known = translateServerText(t, serverText);
    if (known !== serverText) return known;
    if (GENERIC_CODES.has(code) || hasDeleteReason(code)) return serverText;
  }
  if (code) {
    const key = `errorCodes.${code}`;
    const translated = t(key, { defaultValue: '' });
    if (translated && translated !== key) return translated;
  }
  if (err.status === 0) return t('errorCodes.NetworkError');
  return serverText || err.message || t('common.errors.loadFailed');
}

/**
 * The translated message for an error followed by the server's own text when that adds detail, for refusals whose
 * server message names what failed (a draft that could not be applied names its failing items). The two are joined
 * with a space; the server text is left out when it is what the translation already says.
 */
export function errorMessageWithDetail(t, err) {
  const message = errorMessage(t, err);
  const bodyMessage = err?.body && typeof err.body === 'object' ? err.body.message : null;
  const serverText = typeof bodyMessage === 'string' ? stripCodePrefix(bodyMessage, err?.code).trim() : '';
  if (!serverText || serverText === message || message.includes(serverText)) return message;
  return `${message} ${serverText}`;
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

/** Field codes the server attaches to 400 ValidationFailed (P9.17); `Invalid` has no translation of its own. */
export const FIELD_CODES = ['OutOfRange', 'NotAnInteger', 'NotABoolean', 'NotAllowedValue', 'TooLong', 'UnknownSetting', 'PathRequired', 'OverriddenByEnvironment', 'SettingsFileReadOnly', 'ParameterNotAllowed', 'ParameterInvalid', 'ExpiryInPast', 'InvalidUrl', 'DestinationBlocked', 'EventsRequired', 'InvalidEvent', 'InvalidCron', 'InvalidTimeZone', 'TypeImmutable', 'TargetMismatch', 'PayloadTooLarge', 'SecretUseDenied', 'GrantCeiling', 'ReservedRoleName', 'InvalidAssetPath', 'MacroFormatRefused', 'AssetHasNoFiles', 'AssetTemplateRequired', 'InvalidFilePath', 'InvalidJsonSchema', 'InvalidTags', 'TooManyRequirements', 'InvalidName', 'InvalidSlug', 'UnknownAgent', 'DuplicateMember', 'EntryNotMember', 'EdgeNotMember', 'SelfEdge', 'AppGraphCycle', 'UnreachableMember', 'UnknownEnvironment', 'InvalidEntryDeployment', 'DuplicateEnvironment', 'InvalidColor', 'UnknownAsset', 'Required', 'TooMany',
  // Change rules (AA8.12): explained by the change rule form's fieldErrorSpecial; elsewhere the server text shows.
  'UnknownLimit', 'ClassNotInRule', 'UnitNotFound', 'Duplicate', 'BoundRequired', 'MinimumAboveMaximum', 'NegativeBound', 'OrganizationNotFound', 'OrganizationNotSettable',
  // Evaluations, shadow trials, and canaries (AA9.15): explained by evalFieldErrors and the forms' fieldErrorSpecial.
  ...EVAL_FIELD_CODES];

const TYPED_CODES = ['InvalidType', 'InvalidValue'];

// The plain types JsonErrorDescriber names in "X must be <type>.", mapped to translation keys.
const PLAIN_TYPES = {
  text: 'text',
  'true or false': 'trueFalse',
  'a whole number': 'wholeNumber',
  'a number': 'number',
  'an object of names to values': 'map',
  'a list': 'list',
  'an object': 'object'
};

/**
 * A translated message for a field code the server explains in its own words (AA12.8): InvalidType ("X must be
 * a whole number.") becomes "Enter a whole number." in the user's language; InvalidValue becomes "Choose one of: A,
 * B." for a list of allowed values, "Enter a value from 0 to 1000." for a range, or a general sentence. Returns
 * null for other codes.
 */
export function fieldCodeText(t, code, message) {
  const text = typeof message === 'string' ? message.trim() : '';
  if (code === 'InvalidType') {
    const oneOf = /must be one of (.+?)\.?$/.exec(text);
    if (oneOf) return t('common.fieldCodes.InvalidValueOneOf', { values: oneOf[1] });
    if (/must be a date and time/.test(text)) return t('common.fieldCodes.InvalidTypeOf', { type: t('common.fieldTypes.dateTime') });
    if (/must be a duration/.test(text)) return t('common.fieldCodes.InvalidTypeOf', { type: t('common.fieldTypes.duration') });
    const match = /must be (.+?)\.?$/.exec(text);
    const key = match ? PLAIN_TYPES[match[1]] : null;
    return key ? t('common.fieldCodes.InvalidTypeOf', { type: t(`common.fieldTypes.${key}`) }) : t('common.fieldCodes.InvalidType');
  }
  if (code === 'InvalidValue') {
    const oneOf = /must be one of (.+?)\.?$/.exec(text);
    if (oneOf) return t('common.fieldCodes.InvalidValueOneOf', { values: oneOf[1] });
    const range = /from (-?\d+(?:\.\d+)?) to (-?\d+(?:\.\d+)?)/.exec(text);
    if (range) return t('common.fieldCodes.InvalidValueRange', { min: range[1], max: range[2] });
    return t('common.fieldCodes.InvalidValue');
  }
  return null;
}

/** "field: message" for an error whose every field code is InvalidType or InvalidValue, or null. */
function typedFieldText(t, err) {
  const codes = err?.fieldCodes;
  if (!codes || typeof codes !== 'object') return null;
  const keys = Object.keys(codes);
  if (!keys.length || !keys.every((k) => TYPED_CODES.includes(codes[k]))) return null;
  return keys.map((k) => t('common.fieldCodes.fieldMessage', { field: k, message: fieldCodeText(t, codes[k], err.fields?.[k]) })).join(' ');
}

/**
 * Per-field messages from a validation error: each field's machine code (fieldCodes) translated, falling back to
 * the server's message. `special(key, code, message)` may return a more specific translated message (for example a
 * range with the field's minimum and maximum, or the member names an app's UnreachableMember message carries), or null
 * to use the generic one.
 * @returns {Object<string, string>|null}
 */
export function fieldErrorMessages(t, err, special) {
  const fields = err?.fields;
  if (!fields || typeof fields !== 'object') return null;
  const out = {};
  for (const [key, message] of Object.entries(fields)) {
    const code = err.fieldCodes?.[key];
    let text = null;
    if (code && FIELD_CODES.includes(code)) {
      text = (special && special(key, code, message)) || t(`common.fieldCodes.${code}`, { defaultValue: '' }) || null;
    } else if (TYPED_CODES.includes(code)) {
      text = (special && special(key, code, message)) || fieldCodeText(t, code, message);
    }
    out[key] = text || message;
  }
  return out;
}

/**
 * Validation errors for list items arrive keyed by item, for example approvalRules[2].pattern. Forms show errors per
 * field, so each one is also added under its list (approvalRules) as "Item 3: message", keeping the original keys.
 * @param {Function} t i18next translate function.
 * @param {Object<string, string>|null} fields Field errors from fieldErrorMessages.
 * @returns {Object<string, string>|null}
 */
export function withListItemErrors(t, fields) {
  if (!fields) return fields;
  const out = { ...fields };
  for (const [key, message] of Object.entries(fields)) {
    const m = /^([A-Za-z0-9_]+)\[(\d+)\](?:\.[A-Za-z0-9_]+)?$/.exec(key);
    if (!m) continue;
    const text = t('common.errors.listItem', { index: Number(m[2]) + 1, message });
    out[m[1]] = out[m[1]] && out[m[1]] !== text ? `${out[m[1]]} ${text}` : text;
  }
  return out;
}
