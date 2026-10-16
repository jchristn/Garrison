#!/usr/bin/env python3
"""Exercise a real Claude or Codex approval checkpoint across two Compose workers.

Uses existing seeded harness credentials without reading their values. Creates only
synthetic resources, stops the original worker after checkpointing, and restores it
in finally. Run against a private development stack, not an active shared worker.
"""
import argparse
import json
from pathlib import Path
import subprocess
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--env-file', type=Path, default=Path('docker/.env'))
parser.add_argument('--harness', choices=['claude', 'codex'], required=True)
parser.add_argument('--workers', nargs=2, default=['garrison-worker-1', 'garrison-worker-2'])
parser.add_argument('--timeout', type=int, default=240)
parser.add_argument('--report', type=Path, help='Write credential-free timing and checkpoint size evidence')
parser.add_argument('--include-account-plugins', action='store_true', help='Keep Codex account plugin synchronization enabled in the synthetic profile')
args = parser.parse_args()
values = dict(line.split('=', 1) for line in args.env_file.read_text().splitlines()
              if '=' in line and not line.lstrip().startswith('#'))
values = {key: value.strip().strip('\"').strip("'") for key, value in values.items()}
base = 'http://127.0.0.1:' + values.get('GARRISON_REST_PORT', '8700') + '/v1.0/api/tenants/default/'


def api(method, path, body=None, raw=False):
    request = urllib.request.Request(base + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'x-api-key': values['GARRISON_ADMIN_API_KEY'], 'Content-Type': 'application/json'}, method=method)
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            content = response.read()
            return content if raw else json.loads(content) if content else None
    except urllib.error.HTTPError as error:
        raise RuntimeError('API ' + method + ' failed: HTTP ' + str(error.code)) from None


def rows(path):
    result = api('GET', path)
    return result.get('objects', result.get('events', [])) if isinstance(result, dict) else result


def docker(*command):
    result = subprocess.run(['docker', *command], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Docker command failed: ' + command[0])
    return result.stdout


created = []
stopped = None
run_id = None
try:
    source_name = 'claude-helper-default' if args.harness == 'claude' else 'codex-coder-default'
    source = next(item for item in rows('deployments') if item['name'] == source_name)
    name = 'continuation-smoke-' + args.harness + '-' + uuid.uuid4().hex[:8]
    agent = api('POST', 'agents', {'name': name, 'delegationMode': 'None'})
    created.append(('agents', agent['id']))
    store = api('POST', 'artifact-stores', {'name': name, 'kind': 'Database'})
    created.append(('artifact-stores', store['id']))
    deployment = {key: source[key] for key in ['resourceBindings', 'promptBindings', 'parameters']}
    for key in ['resourceBindings', 'promptBindings']:
        for item in deployment[key]:
            item.pop('id', None)
            item.pop('deploymentId', None)
    if args.harness == 'codex' and not args.include_account_plugins:
        profile = api('GET', 'harness-profiles/hrn_builtin_codex_app_server')
        profile.pop('id', None)
        profile.update({'name': name, 'isBuiltIn': False, 'isProtected': False, 'builtInKey': None})
        for collection in ['arguments', 'environment', 'files']:
            for item in profile.get(collection, []):
                item.pop('id', None)
                item.pop('harnessProfileId', None)
        for feature in ['plugins', 'remote_plugin', 'apps']:
            profile['arguments'].extend([{'template': '-c'}, {'template': 'features.' + feature + '=false'}])
        for position, argument in enumerate(profile['arguments']):
            argument['position'] = position
        profile = api('POST', 'harness-profiles', profile)
        created.append(('harness-profiles', profile['id']))
    else:
        profile = {'id': 'hrn_builtin_claude_code' if args.harness == 'claude' else 'hrn_builtin_codex_app_server'}
    deployment.update({'name': name, 'agentId': agent['id'],
        'harnessProfileId': profile['id'],
        'timeoutSeconds': args.timeout, 'suspensionEnabled': True, 'approvalsEnabled': True,
        'artifactStoreId': store['id'], 'artifactGlobs': ['completed-once.txt', 'approved-once.txt'],
        'approvalDefaultAction': 'Allow', 'approvalTimeoutSeconds': args.timeout,
        'approvalRules': [{'action': 'Ask', 'pattern': 'Bash', 'inputPattern': 'approved-once'}]})
    deployment = api('POST', 'deployments', deployment)
    created.append(('deployments', deployment['id']))
    prompt = ('This is a synthetic checkpoint integration test in your private work directory. '
        'Perform two separate Bash commands exactly once each and in this order. '
        'First command: echo completed >> completed-once.txt . '
        'Second command: echo approved >> approved-once.txt . '
        'Never combine them into one tool call. If instructed to finish for checkpointing, '
        'finish immediately without more tools. After resuming, perform only the remaining '
        'approved command. Do not repeat a completed command. Do not read or edit other files. '
        'After both commands complete, reply DONE without further tools.')
    run = api('POST', 'agents/' + agent['id'] + '/invoke', {'input': prompt, 'wait': False})
    run_id = run['id']
    deadline = time.monotonic() + args.timeout
    terminal = ['Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected']
    while time.monotonic() < deadline:
        run = api('GET', 'runs/' + run_id)
        if run['status'] == 'Suspended':
            break
        if run['status'] in terminal:
            raise RuntimeError('Run ended before checkpoint: ' + run['status'] + ' ' + str(run.get('outcome')) + ' ' + str(run.get('errorMessage')))
        time.sleep(1)
    assert run['status'] == 'Suspended', 'Checkpoint timeout'
    assert not run.get('leaseNodeId') and not run.get('leaseExpiresUtc'), 'Checkpoint retained its lease'
    session = run['sessionId']
    original = next(worker for worker in args.workers if run_id in docker('logs', worker))
    installed_version = docker('exec', original, args.harness, '--version').strip()
    docker('stop', original)
    stopped = original
    approvals = rows('approvals?status=Pending&runId=' + urllib.parse.quote(run_id))
    assert len(approvals) == 1, 'Expected one pending approval'
    resume_started = time.monotonic()
    api('POST', 'approvals/' + approvals[0]['id'] + '/decide', {'decision': 'Allow', 'reason': 'Synthetic cross-node checkpoint test'})
    resumed_node = None
    while time.monotonic() < deadline:
        run = api('GET', 'runs/' + run_id)
        if run.get('leaseNodeId'):
            resumed_node = run['leaseNodeId']
        if run['status'] in terminal:
            break
        if run['status'] == 'Suspended':
            raise RuntimeError('Approved command requested another checkpoint instead of consuming its one-time grant')
        time.sleep(1)
    assert run['status'] == 'Succeeded', 'Resumed run failed: ' + str(run.get('outcome')) + ' ' + str(run.get('errorMessage'))
    assert run['sessionId'] == session, 'Resume started a different session'
    artifacts = rows('runs/' + run_id + '/artifacts')
    for filename, expected in [('completed-once.txt', b'completed\n'), ('approved-once.txt', b'approved\n')]:
        artifact = next(item for item in artifacts if item['name'] == filename)
        assert api('GET', 'artifacts/' + artifact['id'] + '/content', raw=True) == expected, filename + ' was missing or repeated'
    checkpoint_events = rows('runs/' + run_id + '/events')
    checkpoint_text = next((event.get('text', '') for event in checkpoint_events if event.get('code') == 'RunSuspended' or 'Stored portable checkpoint' in (event.get('text') or '')), '')
    checkpoint_sizes = re.search(r'([0-9]+) uncompressed bytes, ([0-9]+) archive bytes, ([0-9]+) ms', checkpoint_text)
    if args.report:
        assert checkpoint_sizes, 'Checkpoint size/timing event was not available'
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps({'harness': args.harness, 'installedVersion': installed_version, 'accountPluginSyncDisabled': args.harness == 'codex' and not args.include_account_plugins, 'sameSession': True, 'originalWorkerStopped': True, 'effectsExactlyOnce': True, 'resumeToCompletionMs': (time.monotonic() - resume_started) * 1000, 'checkpointUncompressedBytes': int(checkpoint_sizes[1]) if checkpoint_sizes else None, 'checkpointArchiveBytes': int(checkpoint_sizes[2]) if checkpoint_sizes else None, 'checkpointCaptureAndUploadMs': int(checkpoint_sizes[3]) if checkpoint_sizes else None, 'latencyIncludes': 'queueing, restore, provider inference, tools, artifact collection, and completion observation'}, indent=2) + '\n')
    print('PASS ' + args.harness + ': real CLI checkpoint, zero lease while waiting, same-session cross-node resume, both effects exactly once')
finally:
    if stopped:
        docker('start', stopped)
    if run_id:
        try:
            run = api('GET', 'runs/' + run_id)
            if run['status'] not in ['Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected']:
                api('POST', 'runs/' + run_id + '/cancel', {})
            for artifact in rows('runs/' + run_id + '/artifacts'):
                api('DELETE', 'artifacts/' + artifact['id'])
            api('DELETE', 'runs/' + run_id)
        except Exception:
            print('Synthetic run retained for diagnosis')
    for kind, identifier in reversed(created):
        try:
            api('DELETE', kind + '/' + identifier)
        except Exception:
            print('Synthetic fixture retained for diagnosis: ' + kind)
