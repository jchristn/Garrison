#!/usr/bin/env python3
"""Paired administrator versus fenced, journaled MCP dispatch latency in the isolated effect cluster."""
import argparse
import datetime
import json
import math
import os
import re
from pathlib import Path
import time
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:48740')
    parser.add_argument('--samples', type=int, default=200)
    parser.add_argument('--warmup', type=int, default=10)
    parser.add_argument('--max-overhead-ms', type=float, default=0, help='Optional caller-selected paired p99 budget; zero records measurements without a latency gate')
    parser.add_argument('--results', default='k8s/tests/results/gateway-p99-d060.json')
    options = parser.parse_args()
    if not 1 <= options.samples <= 1000 or not 0 <= options.warmup <= 100:
        raise ValueError('Samples must be 1..1000 and warmup 0..100.')
    if not math.isfinite(options.max_overhead_ms) or options.max_overhead_ms < 0:
        raise ValueError('The optional latency budget must be finite and nonnegative.')
    key = os.environ.get('GARRISON_EFFECT_ADMIN_KEY', 'garrison-effect-chaos-development-key')
    def api(path, body=None):
        request = urllib.request.Request(options.url + path,
            data=None if body is None else json.dumps(body).encode(),
            headers={'x-api-key': key, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    def metrics():
        request = urllib.request.Request(options.url + '/metrics', headers={'x-api-key': key})
        with urllib.request.urlopen(request, timeout=30) as response:
            text = response.read().decode()
        values = {}
        for line in text.splitlines():
            if line.startswith(('garrison_gateway_overhead_duration_seconds', 'garrison_application_operation_duration_seconds')):
                name, number = line.rsplit(' ', 1)
                values[name] = float(number)
        return values
    before = metrics()
    tenant = api('/v1.0/api/tenants?maxResults=1000')['objects'][0]['id']
    base = '/v1.0/api/tenants/' + tenant
    stamp = str(int(time.time()))
    noop = api(base + '/harness-profiles', {'name': 'gateway-noop-' + stamp, 'harnessType': 'Generic',
        'executable': '/bin/cat', 'promptDelivery': 'Stdin', 'outputParser': 'PlainText', 'resultSource': 'Stdout', 'successPolicy': 'ExitCode', 'successExitCodes': [0]})
    child = api(base + '/agents', {'name': 'gateway-child-' + stamp})
    api(base + '/deployments', {'name': child['name'] + '-default', 'agentId': child['id'], 'harnessProfileId': noop['id'], 'effectPolicy': 'AtMostOnce'})
    arguments = ['--mode', 'gateway', '--config', '{{run.configDir}}/mcp.json', '--control-key', key,
                 '--tenant', '{{tenant.id}}', '--child', child['name'], '--count', str(options.samples), '--warmup', str(options.warmup)]
    profile = api(base + '/harness-profiles', {'name': 'gateway-parent-' + stamp, 'harnessType': 'Generic',
        'executable': 'garrison-effect-fixture', 'promptDelivery': 'Stdin', 'outputParser': 'PlainText', 'resultSource': 'Stdout', 'successPolicy': 'ExitCode',
        'mcpConfigFormat': 'ClaudeJson', 'mcpConfigFileName': 'mcp.json', 'successExitCodes': [0],
        'files': [{'baseDirectory': 'Config', 'pathTemplate': 'mcp.json', 'contentTemplate': '{{> builtin/claude-code-mcp-config}}', 'isSecret': True, 'mode': '600'}],
        'defaultTimeoutSeconds': 180, 'arguments': [{'template': value} for value in arguments]})
    parent = api(base + '/agents', {'name': 'gateway-parent-' + stamp, 'delegationMode': 'AllowList', 'delegationAllowList': [child['name']]})
    api(base + '/deployments', {'name': parent['name'] + '-default', 'agentId': parent['id'], 'harnessProfileId': profile['id'], 'effectPolicy': 'Journaled', 'timeoutSeconds': 180})
    run = api(base + '/agents/' + parent['id'] + '/invoke', {'input': 'Paired gateway latency acceptance fixture.', 'wait': False})
    deadline = time.monotonic() + 240
    while time.monotonic() < deadline and run['status'] not in {'Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected'}:
        time.sleep(0.25)
        run = api(base + '/runs/' + run['id'])
    if run['status'] != 'Succeeded':
        raise RuntimeError('Gateway fixture did not succeed: ' + json.dumps(run))
    measured = json.loads(run['resultText'])
    operations = api(base + '/runs/' + run['id'] + '/operations')
    expected = options.samples + options.warmup
    if len(operations) != expected or any(operation['state'] != 'Completed' for operation in operations):
        raise RuntimeError(f'Expected {expected} completed fenced effect operations; observed {operations}')
    measured.update(runId=run['id'], timestampUtc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        completedJournalOperations=len(operations), targetP99OverheadMs=options.max_overhead_ms or None,
        measurementScope='Paired full MCP child admission, including transport and admission; not intrinsic gateway middleware cost',
        passedLatencyTarget=None if options.max_overhead_ms <= 0 else measured['positiveDifferenceP99Ms'] < options.max_overhead_ms)
    after = metrics()
    measured['gatewayMetricDeltas'] = {name: value - before.get(name, 0) for name, value in after.items() if value - before.get(name, 0) != 0}
    count = sum(value - before.get(name, 0) for name, value in after.items() if name.startswith('garrison_gateway_overhead_duration_seconds_count'))
    seconds = sum(value - before.get(name, 0) for name, value in after.items() if name.startswith('garrison_gateway_overhead_duration_seconds_sum'))
    buckets = {}
    for name, value in after.items():
        if name.startswith('garrison_gateway_overhead_duration_seconds_bucket'):
            match = re.search(r'le="([^"]+)"', name)
            if match:
                bound = float(match.group(1))
                buckets[bound] = buckets.get(bound, 0) + value - before.get(name, 0)
    p99_bound = next((bound for bound in sorted(buckets) if buckets[bound] >= count * 0.99), None) if count else None
    measured['gatewayOwnedTiming'] = {'count': count, 'meanMs': seconds * 1000 / count if count else None,
        'p99HistogramUpperBoundMs': p99_bound * 1000 if p99_bound is not None and p99_bound != float('inf') else None,
        'scope': 'Gateway-owned authorization, fencing and journal stages; excludes awaited tool dispatch. Histogram upper bound is not an exact sample percentile.'}
    measured['gatewayOwnedTimingsByMode'] = {}
    for mode in ['run', 'operator']:
        selected = {name: value - before.get(name, 0) for name, value in after.items()
                    if name.startswith('garrison_gateway_overhead_duration_seconds') and ('mode="' + mode + '"') in name}
        mode_count = sum(value for name, value in selected.items() if '_count{' in name)
        if not mode_count:
            continue
        mode_sum = sum(value for name, value in selected.items() if '_sum{' in name)
        mode_buckets = {}
        for name, value in selected.items():
            match = re.search(r'le="([^"]+)"', name)
            if '_bucket{' in name and match:
                bound = float(match.group(1))
                mode_buckets[bound] = mode_buckets.get(bound, 0) + value
        mode_p99 = next((bound for bound in sorted(mode_buckets) if mode_buckets[bound] >= mode_count * 0.99), None)
        measured['gatewayOwnedTimingsByMode'][mode] = {'count': mode_count, 'meanMs': mode_sum * 1000 / mode_count,
            'p99HistogramUpperBoundMs': mode_p99 * 1000 if mode_p99 is not None and mode_p99 != float('inf') else None}
    measured['runDatabaseUsage'] = api(base + '/runs/' + run['id'] + '/database-usage')
    output = Path(options.results)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(measured, indent=2) + '\n')
    print(json.dumps({name: measured[name] for name in ['runId', 'count', 'baselineP99Ms', 'gatewayP99Ms', 'positiveDifferenceP99Ms', 'completedJournalOperations', 'passedLatencyTarget']}, indent=2))
    return 1 if measured['passedLatencyTarget'] is False else 0


if __name__ == '__main__':
    raise SystemExit(main())
