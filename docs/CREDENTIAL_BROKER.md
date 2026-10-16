# Revocable provider credentials

The HTTP credential broker lets a deployment, git workspace, or remote agent use an ephemeral credential issued for one run and lease epoch. Garrison stores provider resource metadata and lifecycle records. It never writes issued bearer values into secret records or the credential lease journal.

Static API keys and git tokens remain supported as ordinary secret kinds. A copied static token cannot receive the broker's provider revocation guarantees.

## Operator configuration

Configure a provider adapter in the server settings file. These settings are not editable through tenant APIs or the dashboard, and the provider authorization token is not returned by the settings API.

```json
{
  "CredentialBroker": {
    "Enabled": true,
    "IssuerUrl": "https://credential-adapter.example/issue",
    "RevokerUrl": "https://credential-adapter.example/revoke",
    "AuthorizationToken": "<operator-provider-bearer>",
    "AllowPrivateDestinations": false,
    "MaxTtlSeconds": 3600,
    "TimeoutSeconds": 15,
    "MaxConcurrency": 4
  }
}
```

Use HTTPS for provider traffic. Private cluster endpoints require `AllowPrivateDestinations: true`; link-local and metadata addresses remain blocked. Connections validate resolved addresses, bypass proxies, and never follow redirects. Provider responses are limited to 64 KiB.

`MaxTtlSeconds` defaults to 3600 and accepts 30 through 86400. `TimeoutSeconds` defaults to 15 and accepts 1 through 120. `MaxConcurrency` bounds parallel revocations, defaults to 4, and accepts 1 through 32. Maintenance limits a revocation pass to one provider timeout and prioritizes records with fewer attempts so a failing destination does not indefinitely hide later leases.

The run must have a finite deadline within the configured maximum TTL. Configure the deployment's maximum runtime accordingly. The adapter must return a credential that covers that deadline without exceeding the requested expiry; otherwise compilation fails with `CredentialLeaseTooShort`. This release does not renew a credential during an execution. A repaired compile in the same epoch uses the same provider lease and idempotency identity.

Keep the same provider lifecycle store and revocation endpoint available while outstanding leases exist. Disabling the broker or changing it to a different provider prevents cleanup of tokens at the old provider; their bounded expiry remains the fallback.

## Tenant resource configuration

Create a secret through the normal secret API. No static credential value is accepted for kind `LeaseBroker`.

```http
POST /v1.0/api/tenants/{tenantId}/secrets
Content-Type: application/json

{
  "name": "repository-write-session",
  "kind": "LeaseBroker",
  "brokerResource": "repositories/team/project/write",
  "brokerAudience": "git"
}
```

The response contains this metadata. Bind its identifier through a deployment resource binding, a workspace's `gitCredentialSecretId`, or a remote agent's `remoteCredentialSecretId`. Templates use explicit secret aliases, such as `{{secret.repository}}`. Built-in profiles that read only a kind-specific value such as `{{secret.kind.AnthropicApiKey}}` need a cloned profile whose credential template reads the broker alias. `LeaseBroker` does not automatically masquerade as another secret kind. For git, the adapter returns a token, or the existing `username:password` credential format. For a remote agent, it returns the bearer value.

The configured adapter must authorize the requested resource and audience for `tenantId`. The control-plane authorization token identifies Garrison to the adapter; it does not grant every tenant access to every provider resource. Resource names alone are not an authorization policy.

Manifests support the same structured `brokerResource` and `brokerAudience` fields and reject a reusable `value`. Secret metadata APIs and all four SDKs expose those fields. Changing the broker resource, audience, or expiry, converting its kind, or deleting the secret attempts to revoke existing leases.

## Required provider contract

Issue and revoke requests use the operator bearer authorization and the durable lease ID in the `Idempotency-Key` header. Both requests have the same typed metadata body:

```json
{
  "leaseId": "crl_...",
  "tenantId": "ten_...",
  "runId": "run_...",
  "leaseEpoch": 7,
  "resource": "repositories/team/project/write",
  "audience": "git",
  "expiresUtc": "2026-10-15T23:00:00Z"
}
```

A successful issuance returns HTTP 2xx and:

```json
{
  "leaseId": "crl_...",
  "value": "<ephemeral-provider-value>",
  "expiresUtc": "2026-10-15T23:00:00Z"
}
```

The provider must enforce all of these properties:

- Repeated issue requests with the same lease ID return the same credential and expiry. They must not create additional credentials.
- The returned credential expires at the requested expiry and cannot remain valid beyond it.
- A successful revoke request returns HTTP 2xx only after the credential is unusable.
- Revoking an unknown lease ID records a tombstone. A delayed issue request for that ID must fail rather than recreate it.
- Revocation is idempotent. Concurrent cleanup requests for the same ID are safe.
- Tenant, resource, and audience authorization is enforced before issuance.

These are adapter requirements, including for an adapter that wraps a vault, cloud provider, or git provider. Garrison does not infer these capabilities from an arbitrary OAuth endpoint. No third-party provider is represented as supporting the contract until an adapter implements and verifies it.

## Loss, revocation, and replacement

Before dispatching issuance, Garrison durably reserves a lease identity under the run's active epoch lock. It checks the epoch and lease again before handing the returned value to the compiler. A value received after loss is refused and its reservation is revoked. Provider authentication and response bodies are excluded from errors and logs.

Completion, cancellation, suspension, compilation failure, requeue, and lease expiry trigger revocation attempts. Maintenance retries failed attempts, including an issuance whose response was lost. A new epoch cannot obtain a replacement for the same run and secret until earlier credentials are confirmed revoked or their bounded expiry has passed.

Garrison-served gateway calls stop working immediately when their run lease expires. External provider credentials stop working when the provider confirms revocation, or at expiry if revocation is unavailable. Garrison cannot promise instant revocation across an unavailable external provider. The adapter's tombstones prevent delayed issuance from reopening that window.

Snapshot continuation compiles a fresh credential for the new epoch. It does not renew or reactivate the credential saved in an older process or snapshot.

## Verification

The `credential-broker-*` suites run against SQLite and PostgreSQL with a real HTTP issuer fixture. They verify same-epoch idempotency, revocation before replacement, provider outages and retries, delayed issuance versus revocation tombstones, actual completion hooks, TTL rejection, refusal to follow redirects, metadata-only APIs, preview behavior, and compiler injection and scrubbing. Run:

```sh
GARRISON_TEST_PROVIDERS=sqlite,postgresql dotnet run --project src/Test.Automated -f net10.0 -- --suites credential-broker
```

API `Credential` lifetime defaults and session/run-token ceilings are separate from legacy `Secret` metadata. Existing non-broker secrets retain their earlier provider-specific expiry behavior; this feature does not turn static secret values into leased credentials or make their expiry metadata a universal enforcement gate. `LeaseBroker` values enforce the configured expiry/deadline contract described above.
