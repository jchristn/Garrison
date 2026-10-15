#!/usr/bin/env bash
# =============================================================================
#  env-secrets.sh - make sure docker/.env holds every key, password, and seeded
#  credential the Compose stack requires (compose.yaml has no defaults for
#  them, and the server refuses its public built-in defaults).
#
#  Missing values are generated with random content and appended to .env
#  (created from .env.example when absent). Existing values are never changed
#  and never printed. A value set in the shell environment counts as present.
#
#  Some values are bound to data that already exists: the database password,
#  master key, administrator password, and seeded credentials are fixed when
#  the Postgres volume is created, and the Grafana password when the Grafana
#  volume is. If such a volume exists and its values are missing, generating
#  new ones would lock the stack out of its own data, so the script stops and
#  names the variables to set instead.
#
#  Usage:   ./env-secrets.sh            used by update.sh
#           ./env-secrets.sh --fresh    used by factory/reset.sh after the volumes are deleted
#  Exit code 0 when .env is complete, 1 when values must be set by hand.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
FRESH=0
[ "${1:-}" = "--fresh" ] && FRESH=1

rand() {
  local value=""
  while [ "${#value}" -lt "$1" ]; do
    value="${value}$(openssl rand -base64 64 | tr -dc 'A-Za-z0-9')"
  done
  printf '%s' "${value:0:$1}"
}

current() {
  local name="$1" value="${!1:-}"
  if [ -z "${value}" ] && [ -f "${ENV_FILE}" ]; then
    value="$(grep -E "^${name}=" "${ENV_FILE}" | tail -n 1 | cut -d= -f2- | tr -d '"'"'"' \r')"
  fi
  printf '%s' "${value}"
}

volume_exists() {
  docker volume inspect "garrison_$1" >/dev/null 2>&1
}

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate keys. Install it, or set the values in ${ENV_FILE} yourself."
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  cp "${SCRIPT_DIR}/.env.example" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}" 2>/dev/null || true
  echo "Created ${ENV_FILE} from .env.example."
fi

DATABASE_BOUND=0
GRAFANA_BOUND=0
if [ "${FRESH}" = "0" ]; then
  volume_exists garrison-postgres-data && DATABASE_BOUND=1
  volume_exists garrison-grafana-data && GRAFANA_BOUND=1
fi

MISSING=""
DEFAULTS=""
GENERATED=""
ADMIN_PASSWORD_GENERATED=""

ensure() {
  local name="$1" value="$2" bound="$3" hint="$4"
  if [ -n "$(current "${name}")" ]; then return 0; fi
  if [ "${bound}" = "1" ]; then
    MISSING="${MISSING}  ${name}: ${hint}\n"
    return 0
  fi
  # Append with a leading newline guard, in case .env does not end with one.
  if [ -s "${ENV_FILE}" ] && [ -n "$(tail -c 1 "${ENV_FILE}")" ]; then echo >> "${ENV_FILE}"; fi
  printf '%s=%s\n' "${name}" "${value}" >> "${ENV_FILE}"
  GENERATED="${GENERATED} ${name}"
  if [ "${name}" = "GARRISON_ADMIN_PASSWORD" ]; then ADMIN_PASSWORD_GENERATED="${value}"; fi
}

DB_HINT="the value the database was created with"
ensure GARRISON_DB_PASSWORD "$(rand 32)" "${DATABASE_BOUND}" "the password the Postgres volume was created with (stacks created before keys were required used: garrison)"
ensure GARRISON_MASTER_KEY "$(openssl rand -base64 32)" "${DATABASE_BOUND}" "${DB_HINT}; a different key makes stored secrets unreadable"
ensure GARRISON_ADMIN_PASSWORD "$(rand 20)" "${DATABASE_BOUND}" "the administrator password the database was seeded with"
ensure GARRISON_DEFAULT_ACCESS_KEY "access_$(rand 32)" "${DATABASE_BOUND}" "the seeded default credential's access key"
ensure GARRISON_DEFAULT_SECRET_KEY "secret_$(rand 48)" "${DATABASE_BOUND}" "the seeded default credential's secret key"
ensure GARRISON_NODE_ACCESS_KEY "access_$(rand 32)" "${DATABASE_BOUND}" "the seeded worker node credential's access key"
ensure GARRISON_NODE_SECRET_KEY "secret_$(rand 48)" "${DATABASE_BOUND}" "the seeded worker node credential's secret key"
ensure GARRISON_AUTH_SIGNING_KEY "$(rand 48)" 0 ""
ensure GARRISON_ADMIN_API_KEY "$(rand 40)" 0 ""
ensure GARRISON_GRAFANA_PASSWORD "$(rand 20)" "${GRAFANA_BOUND}" "the password Grafana was created with (stacks created before keys were required used: password)"

# Values left on the public built-in defaults: the server refuses to start with them (SR-08).
public_default() {
  local name="$1" default="$2"
  if [ "$(current "${name}")" = "${default}" ]; then
    DEFAULTS="${DEFAULTS}  ${name}\n"
  fi
}
public_default GARRISON_MASTER_KEY garrison-default-master-key-override-me
public_default GARRISON_AUTH_SIGNING_KEY garrison-default-signing-key-override-me
public_default GARRISON_ADMIN_API_KEY garrisonadmin
public_default GARRISON_ADMIN_PASSWORD password
public_default GARRISON_DEFAULT_SECRET_KEY secret_garrison_default_change_me
public_default GARRISON_NODE_SECRET_KEY secret_garrison_node_change_me

if [ -n "${GENERATED}" ]; then
  echo "Generated random values in ${ENV_FILE} for:${GENERATED}"
fi
if [ -n "${ADMIN_PASSWORD_GENERATED}" ]; then
  echo "  Dashboard sign-in: tenant default, admin@garrison, password ${ADMIN_PASSWORD_GENERATED} (also in .env as GARRISON_ADMIN_PASSWORD)"
fi
if [ -n "${MISSING}" ]; then
  printf 'These values are missing from %s, and existing data depends on them, so they were not generated:\n%b' "${ENV_FILE}" "${MISSING}"
  echo "Add them to ${ENV_FILE} and run this again, or run factory/reset.sh to delete all data and start over with new values."
  exit 1
fi
if [ -n "${DEFAULTS}" ]; then
  printf 'These values in %s are the public built-in defaults, which the server refuses to start with (SR-08):\n%b' "${ENV_FILE}" "${DEFAULTS}"
  echo "Set new values. The signing key and the admin API key can change at any time. The administrator password and the"
  echo "seeded credentials are fixed in the database at its first start: change them through the dashboard or API, then"
  echo "here. The master key encrypts stored secrets: run factory/reset.sh to start over with a new one."
  exit 1
fi
exit 0
