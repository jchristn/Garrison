# Master keys and expiry policies

Encrypted values contain a key-version byte. `Security.MasterKey` and `Security.MasterKeyVersion` select the active write key. `Security.PreviousMasterKeys` maps older version numbers to read-only keys in the protected server settings file. Keys are never returned by the settings API.

## Rotate the encryption master key

1. Back up the database and retain the old key securely. Generate a new random 32-byte base64 key outside the dashboard.
2. Distribute a key ring to every replica before changing the active version. During a rolling transition each replica must be able to read both versions. Use `PreviousMasterKeys` for read-only versions, including the next version while the old version is active.
3. Set the new active key and a previously unused version (1 through 255) on every replica; retain the old key in `PreviousMasterKeys`. Restart replicas to load the ring. Do not reuse a version for different key material.
4. As a system administrator, call `POST /v1.0/api/settings/keys/rotate`. No request body or keys are sent. The response contains `keyVersion`, `scanned`, `rotated`, `conflicts`, and `failed` counts. The pass covers credentials, harness secrets, webhook trigger signing secrets, and notification signing secrets. Secret values and external signing keys stay unchanged.
5. Repeat until `rotated`, `conflicts`, and `failed` are all zero. A conflict means another writer changed the record during the pass; the pass never overwrites that change. Unreadable values require the missing/correct key or investigation. Interrupted passes are resumable by calling the endpoint again.
6. Stop writers using old active keys before declaring rotation complete. Remove the old read key only after a clean pass on the current database; keep it with backups that still contain old ciphertext. Restart replicas and verify credential authentication and secret-dependent runs.

The pass authenticates current-version ciphertext too, updates key-version and fingerprint metadata, and uses bounded pages. It does not rotate the authentication signing key or third-party credentials. Artifact download tickets derive a separate key from the master key and signing key; existing tickets can expire when those settings change, so request a new download link.

## Expiry policies

The following `Auth` settings are editable through the normal settings API and take effect live:

| Setting | Default | Range and meaning |
|---|---|---|
| `CredentialDefaultLifetimeDays` | 0 | 0 to 36500; 0 leaves expiry unspecified. Applies to newly API-created credentials, not bootstrap credentials. |
| `CredentialMaxLifetimeDays` | 0 | 0 to 36500; 0 means no ceiling. If set, omitted expiry is bounded and an explicitly later expiry is rejected. |
| `RunTokenLifetimeMinutes` | 1440 | 1 to 10080; run-token expiry is the earlier of this ceiling and the execution deadline. Configure it for the longest supported run. |

Credential expiry must be in the future. Credential sessions never outlive their credential. Credential checks still enforce later expiry/active-state changes and run tokens are additionally fenced by execution epoch and active lease. Expired tokens cannot refresh themselves. Changing a policy does not rewrite existing credentials: inspect and update them explicitly.

For Compose, keep the key ring in a protected settings file outside the repository, for example under `~/.garrison/`, and mount it over `/etc/garrison/garrison.json` with a local Compose override. Copy the normal server settings before adding `Security.MasterKeyVersion` and `Security.PreviousMasterKeys`, so the database and listener settings stay present. `GARRISON_MASTER_KEY` from the ignored `docker/.env` still supplies the active key. The version and previous-key ring are settings-file fields; they do not have environment-variable overrides. Restrict the file to the operator account and apply the same read ring to every replica before changing its active key.
