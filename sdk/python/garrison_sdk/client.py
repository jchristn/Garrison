"""Garrison REST client. Responses are returned as dictionaries with the server's camelCase field names."""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, List, Optional
from urllib.parse import quote, urlencode

import requests

DEFAULT_BASE_URL = "http://127.0.0.1:8700"
TERMINAL_STATUSES = {"Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected"}


class GarrisonError(Exception):
    """Raised when the API returns a non-success status. Carries the parsed error body when present."""

    def __init__(self, status_code: int, body: str):
        self.status_code = status_code
        self.body = body
        self.error: Optional[Dict[str, Any]] = None
        try:
            self.error = json.loads(body) if body else None
        except ValueError:
            self.error = None
        detail = ""
        if isinstance(self.error, dict):
            detail = f" {self.error.get('code', '')}: {self.error.get('message', '')}"
        elif body:
            detail = f": {body[:300]}"
        super().__init__(f"Garrison API returned {status_code}{detail}")

    @property
    def code(self) -> Optional[str]:
        return self.error.get("code") if isinstance(self.error, dict) else None


def _clean(params: Optional[Dict[str, Any]]) -> Dict[str, str]:
    if not params:
        return {}
    out: Dict[str, str] = {}
    for key, value in params.items():
        if value is None or value == "":
            continue
        if isinstance(value, bool):
            out[key] = "true" if value else "false"
        elif isinstance(value, datetime):
            out[key] = value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        else:
            out[key] = str(value)
    return out


def _seg(value: str) -> str:
    if not value:
        raise ValueError("identifier is required")
    return quote(str(value), safe="")


class Transport:
    """HTTP transport: authentication, signing, JSON, errors, and server-sent events."""

    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = 600.0, session: Optional[requests.Session] = None):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = session or requests.Session()
        self.mode = "none"
        self.token: Optional[str] = None
        self.access_key: Optional[str] = None
        self.secret_key: Optional[str] = None
        self.admin_api_key: Optional[str] = None
        self.tenant_id: Optional[str] = None

    def tenant_path(self, suffix: str) -> str:
        if not self.tenant_id:
            raise ValueError("set tenant_id on the client (or log in) before calling tenant-scoped APIs")
        return f"/v1.0/api/tenants/{_seg(self.tenant_id)}{suffix}"

    def _headers(self, method: str, path: str, query: str, body: Optional[bytes]) -> Dict[str, str]:
        headers: Dict[str, str] = {}
        if self.mode == "token" and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        elif self.mode == "keys":
            headers["x-access-key"] = self.access_key or ""
            headers["x-secret-key"] = self.secret_key or ""
        elif self.mode == "signed":
            date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            nonce = secrets.token_hex(16)
            canonical = "\n".join([
                method.upper(), path, query, self.tenant_id or "", date, nonce,
                hashlib.sha256(body or b"").hexdigest(),
            ])
            signature = hmac.new((self.secret_key or "").encode(), canonical.encode(), hashlib.sha256).hexdigest()
            headers.update({"x-access-key": self.access_key or "", "x-date": date, "x-nonce": nonce, "x-signature": signature})
            if self.tenant_id:
                headers["x-tenant-id"] = self.tenant_id
        elif self.mode == "admin":
            headers["x-api-key"] = self.admin_api_key or ""
            if self.tenant_id:
                headers["x-tenant-id"] = self.tenant_id
        return headers

    def _prepare(self, method: str, path: str, params: Optional[Dict[str, Any]], body: Any, content_type: Optional[str]):
        query = urlencode(_clean(params), quote_via=quote)
        data: Optional[bytes] = None
        headers: Dict[str, str] = {}
        if body is not None:
            if isinstance(body, (str, bytes)):
                data = body.encode() if isinstance(body, str) else body
                headers["Content-Type"] = content_type or "application/json"
            else:
                data = json.dumps(body).encode()
                headers["Content-Type"] = "application/json"
        headers.update(self._headers(method, path, query, data))
        url = self.base_url + path + (f"?{query}" if query else "")
        return url, data, headers

    def request(self, method: str, path: str, params: Optional[Dict[str, Any]] = None, body: Any = None,
                content_type: Optional[str] = None, raw: bool = False) -> Any:
        url, data, headers = self._prepare(method, path, params, body, content_type)
        response = self.session.request(method, url, data=data, headers=headers, timeout=self.timeout)
        if response.status_code >= 400:
            raise GarrisonError(response.status_code, response.text)
        if raw:
            return response.text
        if not response.content:
            return None
        return response.json()

    def stream(self, path: str, params: Optional[Dict[str, Any]] = None) -> Iterator[Dict[str, Any]]:
        url, _, headers = self._prepare("GET", path, params, None, None)
        headers["Accept"] = "text/event-stream"
        with self.session.get(url, headers=headers, stream=True, timeout=self.timeout) as response:
            if response.status_code >= 400:
                raise GarrisonError(response.status_code, response.text)
            event: Dict[str, Any] = {"event": None, "id": None, "data": []}
            for line in response.iter_lines(decode_unicode=True):
                if line is None:
                    continue
                if line == "":
                    if event["data"] or event["event"]:
                        yield {"event": event["event"] or "message", "id": event["id"], "data": "\n".join(event["data"])}
                    event = {"event": None, "id": None, "data": []}
                    continue
                if line.startswith(":"):
                    continue
                field, _, value = line.partition(":")
                value = value[1:] if value.startswith(" ") else value
                if field == "event":
                    event["event"] = value
                elif field == "id":
                    event["id"] = value
                elif field == "data":
                    event["data"].append(value)
            if event["data"]:
                yield {"event": event["event"] or "message", "id": event["id"], "data": "\n".join(event["data"])}


def _enum(max_results: Optional[int] = None, skip: Optional[int] = None, ordering: Optional[str] = None,
          search: Optional[str] = None, active_only: Optional[bool] = None, include_built_in: Optional[bool] = None) -> Dict[str, Any]:
    return {"maxResults": max_results, "skip": skip, "ordering": ordering, "search": search,
            "activeOnly": active_only, "includeBuiltIn": include_built_in}


class Resource:
    """Standard list/get/create/update/delete for a tenant-scoped collection."""

    def __init__(self, transport: Transport, segment: str):
        self._t = transport
        self._segment = segment

    def _base(self) -> str:
        return self._t.tenant_path(f"/{self._segment}")

    def _item(self, id: str) -> str:
        return f"{self._base()}/{_seg(id)}"

    def list(self, max_results: Optional[int] = None, skip: Optional[int] = None, ordering: Optional[str] = None,
             search: Optional[str] = None, active_only: Optional[bool] = None, include_built_in: Optional[bool] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._base(), _enum(max_results, skip, ordering, search, active_only, include_built_in))

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id))

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("POST", self._base(), body=body)

    def update(self, id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("PUT", self._item(id), body=body)

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", self._item(id))


class Users(Resource):
    def permissions(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/permissions")


class Credentials(Resource):
    """Credentials. create() returns {credential, accessKey, secretKey}; the secret is shown once."""

    def rotate(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/rotate")

    def permissions(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/permissions")


class Roles(Resource):
    def clone(self, id: str, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/clone", body={"name": name, "description": description})


class Agents(Resource):
    def invoke(self, agent: str, input: str, wait: bool = True, wait_seconds: int = 60, parameters: Optional[Dict[str, str]] = None,
               deployment_id: Optional[str] = None, priority: int = 0) -> Dict[str, Any]:
        """Invoke an agent by identifier or name. With wait=True the finished run is returned when it completes in time."""
        body = {"input": input, "wait": wait, "waitSeconds": wait_seconds, "parameters": parameters or {}, "priority": priority}
        if deployment_id:
            body["deploymentId"] = deployment_id
        return self._t.request("POST", self._item(agent) + "/invoke", body=body)

    def card(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + "/card")

    def register(self, agent: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("POST", self._base() + "/register", body=agent)


class Deployments(Resource):
    def compile_preview(self, id: str, input: str = "Hello from the compile preview.", parameters: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/compile-preview", body={"input": input, "parameters": parameters or {}})

    def test(self, id: str, input: str, wait: bool = True, wait_seconds: int = 60) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/test", body={"input": input, "wait": wait, "waitSeconds": wait_seconds})


class HarnessProfiles(Resource):
    def builtin(self) -> List[Dict[str, Any]]:
        return self._t.request("GET", "/v1.0/api/harness-profiles/builtin")

    def clone(self, id: str, name: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/clone", body={"name": name})


class PromptTemplates(Resource):
    def versions(self, id: str) -> List[Dict[str, Any]]:
        return self._t.request("GET", self._item(id) + "/versions")

    def version(self, id: str, version: int) -> Dict[str, Any]:
        return self._t.request("GET", self._item(id) + f"/versions/{int(version)}")

    def restore(self, id: str, version: int) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + f"/restore/{int(version)}")

    def clone(self, id: str, name: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/clone", body={"name": name})

    def reset(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/reset")

    def render(self, id: str, context: Optional[Dict[str, Any]] = None, deployment_id: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/render", body={"context": context, "deploymentId": deployment_id})

    def render_content(self, content: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._t.request("POST", self._base() + "/render", body={"content": content, "context": context})


class McpServers(Resource):
    def test(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/test")


class Secrets(Resource):
    def set_value(self, id: str, value: str) -> Dict[str, Any]:
        return self._t.request("PUT", self._item(id) + "/value", body={"value": value})

    def rotate(self, id: str, value: str) -> Dict[str, Any]:
        return self._t.request("POST", self._item(id) + "/rotate", body={"value": value})


class Manifests:
    def __init__(self, transport: Transport):
        self._t = transport

    def apply(self, content: str, dry_run: bool = False, allow_secret_values: bool = False) -> Dict[str, Any]:
        """Apply YAML or JSON manifests (multi-document)."""
        stripped = content.lstrip()
        content_type = "application/json" if stripped.startswith(("{", "[")) else "application/yaml"
        return self._t.request("POST", self._t.tenant_path("/manifests/apply"),
                               {"dryRun": dry_run, "allowSecretValues": True if allow_secret_values else None},
                               body=content, content_type=content_type)

    def export(self) -> str:
        return self._t.request("POST", self._t.tenant_path("/manifests/export"), raw=True)

    def applies(self, max_results: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._t.tenant_path("/manifests/applies"), _enum(max_results, skip))

    def get_apply(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._t.tenant_path(f"/manifests/applies/{_seg(id)}"))


class Runs:
    def __init__(self, transport: Transport):
        self._t = transport

    def _p(self, suffix: str = "") -> str:
        return self._t.tenant_path("/runs" + suffix)

    def create(self, input: str, agent_id: Optional[str] = None, agent_name: Optional[str] = None, deployment_id: Optional[str] = None,
               parameters: Optional[Dict[str, str]] = None, priority: int = 0, wait: bool = False, wait_seconds: int = 60) -> Dict[str, Any]:
        body = {"agentId": agent_id, "agentName": agent_name, "deploymentId": deployment_id, "input": input,
                "parameters": parameters or {}, "priority": priority, "wait": wait, "waitSeconds": wait_seconds}
        return self._t.request("POST", self._p(), body={k: v for k, v in body.items() if v is not None})

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._p(f"/{_seg(id)}"))

    def list(self, status: Optional[str] = None, agent_id: Optional[str] = None, deployment_id: Optional[str] = None,
             harness_type: Optional[str] = None, node_id: Optional[str] = None, parent_run_id: Optional[str] = None,
             root_run_id: Optional[str] = None, outcome: Optional[str] = None, from_utc: Optional[datetime] = None,
             to_utc: Optional[datetime] = None, max_results: Optional[int] = None, skip: Optional[int] = None,
             ordering: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._p(), {
            "status": status, "agentId": agent_id, "deploymentId": deployment_id, "harnessType": harness_type, "nodeId": node_id,
            "parentRunId": parent_run_id, "rootRunId": root_run_id, "outcome": outcome, "fromUtc": from_utc, "toUtc": to_utc,
            "maxResults": max_results, "skip": skip, "ordering": ordering})

    def cancel(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._p(f"/{_seg(id)}/cancel"))

    def retry(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", self._p(f"/{_seg(id)}/retry"))

    def events(self, id: str, after_sequence: int = 0, limit: int = 500) -> Dict[str, Any]:
        return self._t.request("GET", self._p(f"/{_seg(id)}/events"), {"afterSequence": after_sequence, "limit": limit})

    def stream(self, id: str, after_sequence: int = 0) -> Iterator[Dict[str, Any]]:
        """Yield {'name', 'event'|'run', 'data'} items until run.completed (the last item carries the final run)."""
        for message in self._t.stream(self._p(f"/{_seg(id)}/events/stream"), {"afterSequence": after_sequence}):
            item: Dict[str, Any] = {"name": message["event"], "data": message["data"]}
            if message["event"] == "run.event":
                item["event"] = json.loads(message["data"])
            elif message["event"] == "run.completed":
                item["run"] = json.loads(message["data"])
            yield item
            if message["event"] == "run.completed":
                return

    def children(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._p(f"/{_seg(id)}/children"))

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", self._p(f"/{_seg(id)}"))

    def wait_for_completion(self, id: str, timeout: float = 300.0, poll_interval: float = 0.5) -> Dict[str, Any]:
        deadline = time.monotonic() + timeout
        while True:
            run = self.get(id)
            if run.get("status") in TERMINAL_STATUSES or time.monotonic() >= deadline:
                return run
            time.sleep(poll_interval)


class Global:
    """Platform-level collection (tenants, nodes, node pools)."""

    def __init__(self, transport: Transport, path: str):
        self._t = transport
        self._path = path

    def list(self, max_results: Optional[int] = None, skip: Optional[int] = None, search: Optional[str] = None) -> Dict[str, Any]:
        return self._t.request("GET", self._path, _enum(max_results, skip, None, search))

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", f"{self._path}/{_seg(id)}")

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("POST", self._path, body=body)

    def update(self, id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._t.request("PUT", f"{self._path}/{_seg(id)}", body=body)

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", f"{self._path}/{_seg(id)}")


class Nodes(Global):
    def cordon(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", f"{self._path}/{_seg(id)}/cordon")

    def uncordon(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", f"{self._path}/{_seg(id)}/uncordon")

    def drain(self, id: str) -> Dict[str, Any]:
        return self._t.request("POST", f"{self._path}/{_seg(id)}/drain")


class RequestHistory:
    def __init__(self, transport: Transport):
        self._t = transport

    def list(self, **filters: Any) -> Dict[str, Any]:
        """Filters: method, statusCode, pathContains, fromUtc, toUtc, pageNumber, pageSize, tenantId, userId."""
        return self._t.request("GET", "/v1.0/api/request-history", filters)

    def summary(self, from_utc: datetime, to_utc: datetime, bucket_minutes: int = 15) -> Dict[str, Any]:
        return self._t.request("GET", "/v1.0/api/request-history/summary", {"fromUtc": from_utc, "toUtc": to_utc, "bucketMinutes": bucket_minutes})

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", f"/v1.0/api/request-history/{_seg(id)}")

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", f"/v1.0/api/request-history/{_seg(id)}")

    def delete_many(self, **filters: Any) -> Dict[str, Any]:
        return self._t.request("DELETE", "/v1.0/api/request-history", filters)


class Audit:
    def __init__(self, transport: Transport):
        self._t = transport

    def list(self, **filters: Any) -> Dict[str, Any]:
        """Filters: eventType, principalId, result, fromUtc, toUtc, pageNumber, pageSize."""
        return self._t.request("GET", self._t.tenant_path("/audit"), filters)

    def get(self, id: str) -> Dict[str, Any]:
        return self._t.request("GET", self._t.tenant_path(f"/audit/{_seg(id)}"))

    def delete(self, id: str) -> Any:
        return self._t.request("DELETE", self._t.tenant_path(f"/audit/{_seg(id)}"))

    def delete_many(self, **filters: Any) -> Dict[str, Any]:
        return self._t.request("DELETE", self._t.tenant_path("/audit"), filters)


class Settings:
    def __init__(self, transport: Transport):
        self._t = transport

    def get(self) -> Dict[str, Any]:
        return self._t.request("GET", "/v1.0/api/settings")

    def update(self, values: List[Dict[str, Any]]) -> Dict[str, Any]:
        """values: [{"path": "...", "value": "..."}]"""
        return self._t.request("PUT", "/v1.0/api/settings", body={"values": values})

    def restart(self) -> Dict[str, Any]:
        return self._t.request("POST", "/v1.0/api/settings/restart")

    def test_database(self) -> Dict[str, Any]:
        return self._t.request("POST", "/v1.0/api/settings/database/test")


class GarrisonClient:
    """Garrison API client. Authenticate with login(), login_with_keys(), use_access_key(), use_signed_requests(),
    use_token(), or use_admin_api_key(), then use the module attributes."""

    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = 600.0, session: Optional[requests.Session] = None):
        t = Transport(base_url, timeout, session)
        self.transport = t
        self.tenants = Global(t, "/v1.0/api/tenants")
        self.users = Users(t, "users")
        self.credentials = Credentials(t, "credentials")
        self.roles = Roles(t, "roles")
        self.permissions = Resource(t, "permissions")
        self.role_permissions = Resource(t, "role-permissions")
        self.user_role_assignments = Resource(t, "user-role-assignments")
        self.credential_scope_assignments = Resource(t, "credential-scope-assignments")
        self.agents = Agents(t, "agents")
        self.deployments = Deployments(t, "deployments")
        self.harness_profiles = HarnessProfiles(t, "harness-profiles")
        self.prompt_templates = PromptTemplates(t, "prompt-templates")
        self.mcp_servers = McpServers(t, "mcp-servers")
        self.secrets = Secrets(t, "secrets")
        self.workspace_templates = Resource(t, "workspace-templates")
        self.artifact_stores = Resource(t, "artifact-stores")
        self.manifests = Manifests(t)
        self.runs = Runs(t)
        self.nodes = Nodes(t, "/v1.0/api/nodes")
        self.node_pools = Global(t, "/v1.0/api/node-pools")
        self.request_history = RequestHistory(t)
        self.audit = Audit(t)
        self.settings = Settings(t)

    @property
    def tenant_id(self) -> Optional[str]:
        return self.transport.tenant_id

    @tenant_id.setter
    def tenant_id(self, value: Optional[str]) -> None:
        self.transport.tenant_id = value

    def _issue(self, body: Dict[str, Any]) -> Dict[str, Any]:
        previous = self.transport.mode
        self.transport.mode = "none"
        try:
            issued = self.transport.request("POST", "/v1.0/token", body={k: v for k, v in body.items() if v is not None})
        except Exception:
            self.transport.mode = previous
            raise
        self.use_token(issued["token"], issued.get("tenantId"))
        return issued

    def login(self, email: str, password: str, tenant_id: Optional[str] = None) -> Dict[str, Any]:
        return self._issue({"email": email, "password": password, "tenantId": tenant_id})

    def login_with_keys(self, access_key: str, secret_key: str) -> Dict[str, Any]:
        return self._issue({"accessKey": access_key, "secretKey": secret_key})

    def use_token(self, token: str, tenant_id: Optional[str]) -> None:
        self.transport.mode, self.transport.token, self.transport.tenant_id = "token", token, tenant_id

    def use_access_key(self, access_key: str, secret_key: str, tenant_id: str) -> None:
        t = self.transport
        t.mode, t.access_key, t.secret_key, t.tenant_id = "keys", access_key, secret_key, tenant_id

    def use_signed_requests(self, access_key: str, secret_key: str, tenant_id: str) -> None:
        t = self.transport
        t.mode, t.access_key, t.secret_key, t.tenant_id = "signed", access_key, secret_key, tenant_id

    def use_admin_api_key(self, api_key: str, tenant_id: Optional[str] = None) -> None:
        t = self.transport
        t.mode, t.admin_api_key, t.tenant_id = "admin", api_key, tenant_id

    def token_details(self) -> Dict[str, Any]:
        return self.transport.request("GET", "/v1.0/token/details")

    def refresh(self) -> Dict[str, Any]:
        issued = self.transport.request("POST", "/v1.0/token/refresh")
        self.use_token(issued["token"], issued.get("tenantId") or self.tenant_id)
        return issued

    def logout(self) -> None:
        self.transport.request("DELETE", "/v1.0/token")
        self.transport.mode, self.transport.token = "none", None

    def health(self) -> Dict[str, Any]:
        return self.transport.request("GET", "/v1.0/api/health")

    def server_info(self) -> Dict[str, Any]:
        return self.transport.request("GET", "/v1.0/api/server-info")

    def overview(self) -> Dict[str, Any]:
        return self.transport.request("GET", self.transport.tenant_path("/overview"))

    def queue_summary(self) -> List[Dict[str, Any]]:
        return self.transport.request("GET", self.transport.tenant_path("/queue/summary"))
