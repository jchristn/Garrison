// Runtime configuration. The dashboard image's entrypoint rewrites this file from GARRISON_API_URL at container start.
// An empty apiUrl means the gateway is on this origin (nginx proxies /v1.0/ to the Garrison server).
// allowCustomServer is for the operator console's sign-in page; the app UI ignores it.
window.GARRISON_CONFIG = window.GARRISON_CONFIG || { apiUrl: '', allowCustomServer: false };
