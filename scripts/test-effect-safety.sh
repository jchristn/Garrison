#!/usr/bin/env bash
# Scheduled effect intent boundary tests plus worker-partition policy tests, against configured database providers.
set -euo pipefail
cd "$(dirname "$0")/.."
dotnet run --project src/Test.Automated -f net10.0 -- --suites effect-journal,effect-policy,credential-broker --results "${1:-results-effect-safety.json}"
