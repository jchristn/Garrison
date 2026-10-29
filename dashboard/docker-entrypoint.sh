#!/bin/sh
# Runs before nginx starts (nginx image /docker-entrypoint.d hook).
# GARRISON_API_URL: URL the browser uses for the API, in the console and the app UI; empty means same origin (nginx
#   proxies /v1.0).
# GARRISON_API_UPSTREAM: where nginx proxies /v1.0 and /openapi.json. Default http://garrison-server:8700.
# GARRISON_CSP_CONNECT_SRC: extra space-separated origins the browser may call (Content-Security-Policy connect-src),
#   for example a second Garrison server typed into the login form. The origin of GARRISON_API_URL is added for you.
set -e
UPSTREAM="${GARRISON_API_UPSTREAM:-http://garrison-server:8700}"
RESOLVER=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)
case "${RESOLVER}" in
  *:*) RESOLVER="[${RESOLVER}]" ;;
esac

# connect-src additions: the API origin (scheme://host[:port]) and its WebSocket form, plus the operator's extras.
# Only characters valid in origins are kept, so a value cannot add other directives to the policy.
CONNECT=""
API_ORIGIN=$(printf '%s' "${GARRISON_API_URL:-}" | sed -n 's#^\(https\{0,1\}://[^/?#]*\).*#\1#p')
if [ -n "${API_ORIGIN}" ]; then
  WS_ORIGIN=$(printf '%s' "${API_ORIGIN}" | sed 's#^http#ws#')
  CONNECT=" ${API_ORIGIN} ${WS_ORIGIN}"
fi
EXTRA=$(printf '%s' "${GARRISON_CSP_CONNECT_SRC:-}" | tr -cd 'A-Za-z0-9.:/*_ [-]')
if [ -n "${EXTRA}" ]; then
  CONNECT="${CONNECT} ${EXTRA}"
fi

cat > /etc/nginx/garrison-upstream.inc <<INC
resolver ${RESOLVER:-127.0.0.11} valid=30s ipv6=off;
set \$garrison_api "${UPSTREAM}";
set \$garrison_csp_connect "${CONNECT}";
INC
# The operator console and the app UI (/apps/) read the same runtime configuration.
for CONFIG_FILE in /usr/share/nginx/html/config.js /usr/share/nginx/html/apps/config.js; do
  if [ -d "$(dirname "${CONFIG_FILE}")" ]; then
    cat > "${CONFIG_FILE}" <<CONFIG
window.GARRISON_CONFIG = { apiUrl: "${GARRISON_API_URL:-}" };
CONFIG
  fi
done
