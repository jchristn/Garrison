#!/usr/bin/env python3
"""Plan reproducible timing arms and record host-load/report provenance without application secrets."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import random
import sys

ARMS = [
    ("baseline", 20000, 250, 250),
    ("lease1s", 1000, 250, 250),
    ("lease5s", 5000, 250, 250),
    ("flush25", 20000, 25, 250),
    ("flush100", 20000, 100, 250),
    ("poll50", 20000, 250, 50),
    ("poll100", 20000, 250, 100),
]


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def write(path, document):
    Path(path).write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    plan = commands.add_parser("plan")
    plan.add_argument("--manifest", required=True)
    plan.add_argument("--schedule", required=True)
    plan.add_argument("--repeat", type=int, default=1)
    plan.add_argument("--seed", default="")
    plan.add_argument("--duration", type=int, default=20)
    plan.add_argument("--warmup", type=int, default=5)
    plan.add_argument("--concurrency", type=int, default=16)
    binaries = commands.add_parser("binaries")
    binaries.add_argument("--manifest", required=True)
    binaries.add_argument("--build-dir", required=True)
    binaries.add_argument("--phase", choices=["before", "after"], default="before")
    snapshot = commands.add_parser("snapshot")
    snapshot.add_argument("--manifest", required=True)
    snapshot.add_argument("--trial", type=int, required=True)
    snapshot.add_argument("--order", type=int, required=True)
    snapshot.add_argument("--phase", choices=["before", "after"], required=True)
    snapshot.add_argument("--results-dir")
    args = parser.parse_args()
    if args.command == "plan":
        if not 1 <= args.repeat <= 1000:
            parser.error("--repeat must be 1 to 1000")
        if args.duration < 1 or args.warmup < 0 or args.concurrency < 1:
            parser.error("duration/concurrency must be positive and warmup nonnegative")
        try:
            seed = int(args.seed) if args.seed else None
        except ValueError:
            parser.error("--seed must be an integer")
        rng = random.Random(seed)
        rows = []
        schedule = []
        for trial in range(1, args.repeat + 1):
            points = ARMS.copy()
            if seed is not None:
                rng.shuffle(points)
            for order, (label, lease, flush, poll) in enumerate(points, 1):
                report_label = f"timing-{label}"
                if args.repeat > 1 or seed is not None:
                    report_label += f"-trial{trial}-order{order}"
                rows.append({"trial": trial, "order": order, "arm": label,
                             "reportLabel": report_label, "leaseWaitMs": lease,
                             "eventFlushIntervalMs": flush, "eventPollMs": poll})
                schedule.append(f"{trial}\t{order}\t{label}\t{lease}\t{flush}\t{poll}\t{report_label}")
        document = {"createdUtc": now(), "randomSeed": seed, "repeats": args.repeat,
                    "randomized": seed is not None, "pythonVersion": sys.version.split()[0], "durationSeconds": args.duration,
                    "warmupSeconds": args.warmup, "concurrency": args.concurrency,
                    "notes": ["Each arm starts a fresh private SQLite stack.",
                              "Harness report options are authoritative if CLI arguments override environment defaults.",
                              "Shared-host load averages are observations, not proof of an uncontended host."],
                    "arms": rows}
        Path(args.manifest).parent.mkdir(parents=True, exist_ok=True)
        write(args.manifest, document)
        Path(args.schedule).write_text("\n".join(schedule) + "\n", encoding="utf-8")
        return
    path = Path(args.manifest)
    document = json.loads(path.read_text(encoding="utf-8"))
    if args.command == "binaries":
        root = Path(args.build_dir)
        files = []
        for project in ("Garrison.Server", "Garrison.Worker", "Garrison.FakeHarness", "Test.Benchmark"):
            directory = root / "bin" / project / "release_net10.0"
            for binary in sorted(p for p in directory.rglob("*") if p.is_file()):
                files.append({"file": str(binary.relative_to(root)), "bytes": binary.stat().st_size,
                              "sha256": hashlib.sha256(binary.read_bytes()).hexdigest()})
        if not files:
            parser.error("No Release net10.0 binary files found in --build-dir")
        document["frozenBinaries"] = {"capturedUtc": now(), "capturePhase": args.phase, "files": files}
        write(path, document)
        return
    row = next(r for r in document["arms"] if r["trial"] == args.trial and r["order"] == args.order)
    row[args.phase] = {"timestampUtc": now(), "loadAverage1_5_15": list(os.getloadavg()),
                       "logicalCpuCount": os.cpu_count()}
    if args.phase == "after" and args.results_dir:
        reports = []
        for report in sorted(Path(args.results_dir).glob("*" + row["reportLabel"] + ".json")):
            raw = report.read_bytes()
            content = json.loads(raw)
            started = content.get("provenance", {}).get("startedUtc")
            if started and datetime.datetime.fromisoformat(started.replace("Z", "+00:00")) < datetime.datetime.fromisoformat(row["before"]["timestampUtc"]):
                continue
            reports.append({"file": report.name, "sha256": hashlib.sha256(raw).hexdigest(),
                            "options": {k: v for k, v in content.get("options", {}).items()
                                        if k in ("duration-seconds", "warmup-seconds", "concurrency", "mode", "stack-details", "label")}})
        row["reports"] = reports
    write(path, document)


if __name__ == "__main__":
    main()
