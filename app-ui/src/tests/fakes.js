// Test doubles: an EventSource that tests drive by hand, and a fetch that answers from a route table.

export class FakeEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.closed = false;
    this.onopen = null;
    this.onerror = null;
    FakeEventSource.instances.push(this);
  }

  addEventListener(name, fn) {
    (this.listeners[name] = this.listeners[name] || []).push(fn);
  }

  close() {
    this.closed = true;
  }

  open() {
    if (this.onopen) this.onopen({});
  }

  emit(name, data, id) {
    const message = { data: JSON.stringify(data), lastEventId: id === undefined ? '' : String(id) };
    for (const fn of this.listeners[name] || []) fn(message);
  }

  fail() {
    if (this.onerror) this.onerror({});
  }

  static reset() {
    FakeEventSource.instances = [];
  }

  static last() {
    return FakeEventSource.instances[FakeEventSource.instances.length - 1];
  }
}

export function jsonResponse(status, body) {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text),
    text: async () => text,
    blob: async () => new Blob([text])
  };
}

/**
 * A fetch mock. routes maps "METHOD /path" (path without the query) to a body, a [status, body] pair (an array
 * whose first item is a number), or a function (url, init) returning either. Every call is recorded in fetch.calls.
 */
export function mockFetch(routes) {
  const fn = async (url, init = {}) => {
    const method = (init.method || 'GET').toUpperCase();
    const path = String(url).replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    fn.calls.push({ url: String(url), method, path, init, body: init.body ? JSON.parse(init.body) : undefined });
    let route = routes[`${method} ${path}`];
    if (route === undefined) return jsonResponse(404, { error: 'NotFound', code: 'NotFound', message: 'No mock for ' + method + ' ' + path });
    if (typeof route === 'function') route = await route(url, init);
    if (Array.isArray(route) && route.length === 2 && typeof route[0] === 'number') return jsonResponse(route[0], route[1]);
    return jsonResponse(200, route);
  };
  fn.calls = [];
  return fn;
}
