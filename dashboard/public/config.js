// Runtime configuration. The container entrypoint rewrites this file from environment variables.
// apiUrl: the API the browser calls; empty means this origin. allowCustomServer: true when GARRISON_CSP_CONNECT_SRC
// allows extra origins, which shows "Use a different server" on the sign-in page.
window.GARRISON_CONFIG = window.GARRISON_CONFIG || { apiUrl: '', allowCustomServer: false };
