import { describe, expect, it } from 'vitest';
import { isMissingEndpoint } from '../utils/errors.js';

describe('isMissingEndpoint', () => {
  it('treats 404 RouteNotFound and 405 MethodNotAllowed as a missing endpoint', () => {
    expect(isMissingEndpoint({ status: 404, code: 'RouteNotFound' })).toBe(true);
    expect(isMissingEndpoint({ status: 405, code: 'MethodNotAllowed' })).toBe(true);
  });

  it('does not treat other errors as a missing endpoint', () => {
    expect(isMissingEndpoint({ status: 404, code: 'NotFound' })).toBe(false);
    expect(isMissingEndpoint({ status: 403, code: 'Forbidden' })).toBe(false);
    expect(isMissingEndpoint(null)).toBe(false);
  });
});
