# Optional Clutch coordination

Database coordination remains the default and requires no extra service. To use Clutch, configure every control-plane replica with the same endpoint, access key, and deployment key prefix, then restart them:

```sh
GARRISON_LEASE_PROVIDER=Clutch
GARRISON_CLUTCH_ENDPOINT=https://clutch.example.com
GARRISON_CLUTCH_ACCESS_KEY=<operator-supplied-key>
GARRISON_CLUTCH_KEY_PREFIX=garrison-production
```

Use a different prefix for each independent Garrison deployment. Supply the access key through a secret or environment variable. The settings API masks it; it must not appear in endpoint URLs. The dashboard exposes these restart-required settings under Coordination leases. Docker Compose passes the four variables above to the server. Kubernetes operators can add them to the server environment, using `secretKeyRef` for the key. Clutch is not started automatically.

## What it coordinates

Clutch gates maintenance leadership and Codex credential refresh. Each named hold uses an exclusive Clutch lock, plus a durable Garrison database lease. The database row supplies the fencing epoch and prevents a disconnected remote holder from being replaced before its Garrison validity window ends. Run assignment remains an atomic database claim; migrations retain their database startup lock. Kubernetes warm-pod pool coordination is unchanged.

An unavailable Clutch service denies new acquisitions and renewals. There is no fallback to database-only acquisition when Clutch is selected. Existing callers stop using an expired lease according to their normal validity checks. Automatic SDK heartbeats cannot extend the Garrison deadline: an expiry sweep closes the connection unless Garrison explicitly renews the hold. A failed renewal closes the remote connection but preserves the database guard until it expires.

## Limits and verification

`Leases.RequestTimeoutMs` defaults to 5000; `SweepIntervalMs` to 250. `MaxLeaseMs` defaults to 300000 and `MaxHoldMs` to 3600000. Corresponding `GARRISON_CLUTCH_*` environment overrides use uppercase underscore names. Configure compatible limits on Clutch; incompatible first-acquirer policies deny acquisition. Maximum continuous hold requires eventual reacquisition, so choose it longer than normal renewal intervals.

Run `scripts/check-clutch-leases.sh` for real-service contention, renewal, explicit expiry, disconnect fencing, outage, and default-provider checks. It uses a temporary Clutch container on a random loopback port and removes it afterward. This local gate does not replace testing your remote service's TLS, access policy, or availability.
