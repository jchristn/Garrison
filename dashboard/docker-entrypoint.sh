#!/bin/sh
# Runs before nginx starts (nginx image /docker-entrypoint.d hook).
# GARRISON_API_URL: URL the browser uses for the API; empty means same origin (nginx proxies /v1.0).
# GARRISON_API_UPSTREAM: where nginx proxies /v1.0 and /openapi.json. Default http://garrison-server:8700.
set -e
UPSTREAM="${GARRISON_API_UPSTREAM:-http://garrison-server:8700}"
RESOLVER=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)
case "${RESOLVER}" in
  *:*) RESOLVER="[${RESOLVER}]" ;;
esac
cat > /etc/nginx/garrison-upstream.inc <<INC
resolver ${RESOLVER:-127.0.0.11} valid=30s ipv6=off;
set \$garrison_api "${UPSTREAM}";
INC
cat > /usr/share/nginx/html/config.js <<CONFIG
window.GARRISON_CONFIG = { apiUrl: "${GARRISON_API_URL:-}" };
CONFIG
