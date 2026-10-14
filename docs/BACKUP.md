# Backup and Restore

A Garrison backup has two halves, and a restore needs both: the database, and the master key the database was written with. Everything else is either reproducible from this repository (manifests, settings, images) or scratch space that nobody should miss (worker workspaces, Prometheus, Loki, and Tempo data).

| What | Where | Back it up? |
|---|---|---|
| Database | PostgreSQL (`garrison-postgres` in the turnkey overlays, your managed database in production) or a Sqlite file | Yes, on a schedule |
| Master key | `master-key` in Secret `garrison-secrets` (`GARRISON_MASTER_KEY`) | Yes, once, somewhere other than the database backups |
| Token signing key, node and default credentials, admin API key | The rest of `garrison-secrets` and `garrison-node-credential` | Recommended; a restore works without them, with the side effects described below |
| Harness credentials | Secret `garrison-harness-credentials`, copied into the database by the bootstrap Job | Covered by the database backup |
| Settings and manifests | `k8s/` in git, plus cluster settings in the database | Git, plus the database backup |
| Worker workspaces | Worker PVCs | No. They are per-run scratch space |

## The master key decides whether a restore is useful

Every stored secret (model API keys, OAuth tokens, MCP server headers, credential secret keys) is encrypted with AES-256-GCM under the master key before it reaches the database. A dump therefore contains ciphertext, not credentials, and it is only as useful as the key that goes with it. Restore a database next to the wrong master key and Garrison starts normally, lists every secret, and then fails each run that needs one, because nothing decrypts.

So keep the master key the way you would keep a root CA key: export it once, store it in a password manager or your cloud's secret manager, and keep it apart from the dumps. Someone who steals a dump without the key gets prompts, run history, and request logs (which are sensitive enough on their own), but no credentials.

```bash
kubectl -n garrison get secret garrison-secrets -o jsonpath='{.data.master-key}' | base64 -d > garrison-master-key.txt
# store it, then: shred -u garrison-master-key.txt   (or rm -P on macOS)
```

What happens to the other keys after a restore into a fresh install with newly generated Secrets:

- **Signing key** (`signing-key`). Bearer tokens issued before the restore no longer validate. People sign in again; nothing is lost.
- **Default and node credentials** (`default-access-key`, `default-secret-key`, `garrison-node-credential`). On every start the server makes sure the credentials named in its environment exist with those secret keys, creating them when the access key is unknown. Workers keep working with the new Secret, and the restored credentials stay as they were.
- **Administrator password** (`admin-password`). Only used to seed `admin@garrison` the first time. After a restore, the password is whatever it was in the backup.

Rotating the master key is not the same as losing it, but today Garrison has no re-encryption command, so treat the key as permanent for the life of the database.

## PostgreSQL

### Turnkey installs (in-cluster Postgres)

For a one-off backup, run `pg_dump` inside the Postgres pod and copy the file out. Custom format (`-Fc`) is compressed and lets `pg_restore` pick tables later.

```bash
kubectl -n garrison exec garrison-postgres-0 -- pg_dump -U garrison -d garrison -Fc --no-owner --no-privileges -f /tmp/garrison.dump
kubectl -n garrison cp garrison-postgres-0:/tmp/garrison.dump ./garrison-$(date -u +%Y%m%dT%H%M%SZ).dump
kubectl -n garrison exec garrison-postgres-0 -- rm /tmp/garrison.dump
```

For a schedule, add `k8s/components/postgres-backup` to your overlay. It runs a CronJob at 03:17 every night that dumps to the PersistentVolumeClaim `garrison-postgres-backups`, reads each dump back with `pg_restore --list` before giving it its final name, and deletes dumps older than 14 days (`GARRISON_BACKUP_KEEP_DAYS`). It also adds a network policy so the Job can reach Postgres, which otherwise admits only the server.

```yaml
# your overlay's kustomization.yaml
resources:
  - ../../overlays/k3s
components:
  - ../../components/postgres-backup
```

```bash
kubectl -n garrison create job --from=cronjob/garrison-postgres-backup garrison-backup-now   # run one now
kubectl -n garrison logs job/garrison-backup-now
```

A PVC in the same cluster protects you from a bad migration or an accidental delete, not from losing the cluster. Copy the dumps somewhere else as well, for example with a second container that uploads to object storage, or a backup tool such as Velero that snapshots the volume. Helm users can copy `cronjob.yaml`, `pvc.yaml`, and `networkpolicy.yaml` from the component and apply them next to the release.

### Managed PostgreSQL

On RDS, Aurora, Cloud SQL, or Azure Database for PostgreSQL, use the provider's automated backups with point-in-time recovery and set the retention you need. They are consistent, cheap, and restore to any second inside the window, which `pg_dump` cannot do. A restore creates a new instance, so the steps are: restore to a new instance, update Secret `garrison-db` with the new host, and restart the server (`kubectl -n garrison rollout restart deployment/garrison-server`).

Keep an occasional `pg_dump` anyway when you want a portable copy, to move between providers or regions, or to load production data into a test cluster. The CronJob above works against a managed database once its `PG*` variables point at Secret `garrison-db` (the comment at the top of `cronjob.yaml` shows the change). Use a `pg_dump` at least as new as the server's major version.

### Restoring

Stop everything that writes before restoring: the server replicas, and the workers too, so they do not report completions for runs that the restored database has never heard of or has in a different state.

```bash
kubectl -n garrison scale deployment/garrison-server --replicas=0
kubectl -n garrison scale statefulset/garrison-worker --replicas=0

kubectl -n garrison cp ./garrison-20261010T031700Z.dump garrison-postgres-0:/tmp/restore.dump
kubectl -n garrison exec garrison-postgres-0 -- pg_restore -U garrison -d garrison \
  --clean --if-exists --no-owner --no-privileges --exit-on-error --single-transaction /tmp/restore.dump
kubectl -n garrison exec garrison-postgres-0 -- rm /tmp/restore.dump

kubectl -n garrison scale deployment/garrison-server --replicas=1     # your usual count, or let the HPA take over
kubectl -n garrison scale statefulset/garrison-worker --replicas=2
```

`--single-transaction` means a failed restore leaves the database as it was instead of half replaced. For a managed database, run the same `pg_restore` from any pod or machine that can reach it, or restore the provider snapshot as described above.

If the restore lands in a new cluster, create `garrison-secrets` with the original master key before the server starts for the first time. `generate-secrets.sh` keeps an existing Secret, so create it first and let the script fill in the rest:

```bash
kubectl create namespace garrison
kubectl -n garrison create secret generic garrison-secrets \
  --from-file=master-key=garrison-master-key.txt \
  --from-literal=signing-key="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 48)" \
  --from-literal=admin-api-key="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 40)" \
  --from-literal=admin-password=unused-after-restore \
  --from-literal=db-password="<the database password>" \
  --from-literal=default-access-key="access_$(openssl rand -hex 16)" \
  --from-literal=default-secret-key="secret_$(openssl rand -hex 24)"
k8s/scripts/generate-secrets.sh      # keeps garrison-secrets, creates the node credential and the rest
```

Runs that were `Leased` or `Running` when the backup was taken come back in that state with no worker attached. The leader notices that their leases have expired within about half a minute and requeues them or fails them with `NodeLost`, following each run's `maxAttempts` and `effectPolicy`, exactly as if their worker had crashed.

The server migrates the schema forward when it starts (`Database.ManageSchema`), so a dump from an older Garrison restores into a newer one. The reverse does not work: restore a dump only into the version that wrote it or a later one.

## Sqlite

Sqlite is for one control-plane replica on one machine: development, Docker Compose without Postgres, or a small single-node install. Garrison runs it in WAL mode, which matters for backups, because recent writes may still sit in `garrison.db-wal` next to the main file. Copying only `garrison.db` from a running server can give you a file that is missing the last few seconds or is inconsistent.

The simplest safe backup is a copy with the server stopped. Garrison checkpoints the WAL on a clean shutdown, but copy the `-wal` and `-shm` files as well if they exist, and keep the three together.

```bash
# stop the server first (docker compose stop garrison-server, or stop the process)
cp data/garrison.db backup/garrison.db
for ext in -wal -shm; do [ -f "data/garrison.db$ext" ] && cp "data/garrison.db$ext" "backup/garrison.db$ext"; done
```

To back up while the server runs, use Sqlite's online backup API through the `sqlite3` shell, or `VACUUM INTO`, which also compacts the copy. Both produce a single consistent file:

```bash
sqlite3 data/garrison.db ".backup 'backup/garrison-$(date -u +%Y%m%dT%H%M%SZ).db'"
sqlite3 data/garrison.db "VACUUM INTO 'backup/garrison-$(date -u +%Y%m%dT%H%M%SZ).db'"
```

To restore, stop the server, move the current `garrison.db`, `garrison.db-wal`, and `garrison.db-shm` aside, put the backup in place as `garrison.db` (with its own `-wal` and `-shm` only if you copied them together), and start the server with the same `GARRISON_MASTER_KEY` as before. A stale `-wal` file left next to a restored database is the classic way to corrupt it, so never mix files from different copies.

## Checking a restore

A restore you have not tested is a hope. Restore into a scratch namespace or a throwaway cluster now and then, and run through this list:

1. `curl -fsS http://<server>/v1.0/api/health` answers, and the server log shows no migration errors and no `Security.MasterKey is the built-in default` warning (unless you meant it).
2. Sign in to the dashboard and check that tenants, agents, deployments, and recent runs are there with the counts you expect.
3. Prove the master key matches: open Configuration, Secrets, and use a secret, or run an agent whose deployment binds one. A wrong key shows up as runs failing to compile with a decryption error rather than as an error at startup.
4. Run `k8s/scripts/smoke-test.sh` to push a run through the scheduler, a worker, and completion.
5. For Sqlite backups, `sqlite3 backup.db 'PRAGMA integrity_check;'` should print `ok`. For PostgreSQL dumps, `pg_restore --list garrison.dump` should list every table without errors (the backup CronJob does this for every dump).
