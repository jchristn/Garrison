# D063: representative network workspace-cache acceptance

P12.46 was validated on 2026-10-16 with three bounded repeated workloads through production `WorkspacePreparer` and `WorkspaceSnapshot`. All nine Git preparation arms and three prepared snapshot transfers/restores passed exact work-tree identity checks. This satisfies the requested representative small-scale acceptance; it does not establish production fleet performance.

## Reproduction and isolation

```sh
benchmarks/workspace-cache-network.sh benchmarks/.run/workspace-cache-network-d063.json 512 8192 3 25 16
```

The reusable probe builds with isolated .NET 10 artifacts and runs a disposable HTTPS smart Git endpoint over real loopback TCP/TLS. Each response has a 25 ms delay and body transfer is paced at a target 16 MiB/s per connection. This represents modest controlled transport cost, rather than a geographically remote network. A probe-only ephemeral certificate is trusted through child-process Git configuration and curl's explicit CA file; system trust is unchanged. The server correctly decodes compressed Git protocol requests before passing them to `git http-backend`, while accounting for their original transported body bytes.

The deterministic fixture contains 512 random data files plus three small metadata/script files: 515 files and 4,194,413 work-tree bytes. Each of three rounds creates a distinct cold mirror, then reuses it for the warm arm. The prepared arm captures the production work-only snapshot, transfers the actual ZIP over HTTPS, and restores it into a replacement workspace. A SHA-256 digest covers sorted relative paths, lengths, content and Unix file modes, including hidden files and an executable script, excluding `.git`. Every arm produced `10ACBF1B422E2FA545C3EB03A3F8932FAE5DB2B71B8B677FD3996C2F360A81CF`.

## Results

Times are milliseconds. Byte counts below are actual HTTP response bodies, excluding headers and TCP/TLS framing; the JSON separately records request bodies and received Git pack payload.

| Arm | Round 1 | Round 2 | Round 3 | Response body bytes per round |
| --- | ---: | ---: | ---: | ---: |
| Uncached preparation | 884.0 | 812.8 | 827.8 | 4,215,316 |
| Cold mirror preparation | 970.9 | 991.6 | 958.7 | 4,215,599 |
| Warm mirror preparation | 372.2 | 396.8 | 399.9 | 566 |
| Prepared capture | 73.4 | 64.9 | 63.5 | Local capture |
| Prepared HTTPS transfer | 578.2 | 581.9 | 579.2 | 8,996,958 to 8,996,998 |
| Prepared restore | 100.3 | 94.4 | 94.9 | Local restore |

All three warm preparations reported a mirror cache hit, received zero Git pack bytes, and still contacted the remote to check repository state. Cold/uncached preparations each received 4,214,686 pack bytes. Warm preparation was faster in every observed round, while creating a cold mirror added overhead compared with an uncached clone. These are three fixed-order repetitions on a shared development host, without statistical significance or a production speedup claim.

Prepared capture plus transfer plus restore took approximately 738 to 752 ms. The roughly 9 MB archive was larger than the 4.2 MB clone payload because a prepared workspace also contains Git metadata/database. Prepared restoration is an alternative with an explicit storage/transfer tradeoff; this fixture does not show it universally outperforming clone or a warm mirror. Exact restored tree identity and modes passed in all three rounds, and measured HTTPS snapshot body bytes equaled the transferred archive size.

## Evidence and scope

- [Sanitized measurements](../../benchmarks/evidence/d063/workspace-cache-network.json) retain all rounds, timings, byte accounting and identity digests.
- [Provenance](../../benchmarks/evidence/d063/workspace-cache-provenance.json) records the command, tool versions and probe source hashes. The isolated probe compiled with zero warnings and errors.
- [Reusable runner](../../benchmarks/workspace-cache-network.sh), [production-path probe](../../benchmarks/probes/WorkspaceCacheNetworkProbe.cs), and [disposable HTTPS endpoint](../../benchmarks/probes/cache-network-server.py) permit repetition without a deployed Garrison stack.

Existing `worker-executor/git-mirror-cache` coverage additionally checks independent clone contents, absence of Git alternates, mirror deletion safety and mutation isolation. Existing snapshot/security coverage remains in the shared worker suite. The historical local SSH-command-shim experiment remains separately documented; its byte and timing results are not substituted for this real HTTPS transport run.

No runtime defaults were changed. This experiment does not cover WAN loss, concurrent cache eviction, production repository diversity or fleet-scale throughput. Its temporary server, repositories, TLS material, Git configuration and build artifacts were removed. The original Compose deployment was untouched.
