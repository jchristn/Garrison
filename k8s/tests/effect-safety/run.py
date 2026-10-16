#!/usr/bin/env python3
"""External-effect pod-kill acceptance on an explicitly selected disposable cluster."""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kubeconfig', required=True)
    parser.add_argument('--context', required=True)
    parser.add_argument('--url', default='http://127.0.0.1:48740')
    parser.add_argument('--sink-url', default='http://127.0.0.1:48741')
    parser.add_argument('--namespace', default='garrison-effects')
    parser.add_argument('--results', default='k8s/tests/results/effect-safety-d060.json')
    parser.add_argument('--deploy', action='store_true')
    parser.add_argument('--deploy-only', action='store_true')
    parser.add_argument('--server-image', default='jchristn77/garrison-server:v0.1.0-alpha')
    parser.add_argument('--worker-image', default='garrison-effect-worker:d060')
    options = parser.parse_args()
    key = os.environ.get('GARRISON_EFFECT_ADMIN_KEY', 'garrison-effect-chaos-development-key')
    kubectl = ['kubectl', '--kubeconfig', options.kubeconfig, '--context', options.context, '-n', options.namespace]

    def command(*args, body=None):
        return subprocess.check_output(kubectl + list(args), input=body, text=True, stderr=subprocess.STDOUT)

    def request(path, method='GET', body=None, sink=False):
        data = None if body is None else json.dumps(body).encode()
        headers = {'Content-Type': 'application/json'}
        if not sink:
            headers['x-api-key'] = key
        address = (options.sink_url if sink else options.url) + path
        with urllib.request.urlopen(urllib.request.Request(address, data=data, method=method, headers=headers), timeout=20) as response:
            return None if response.status == 204 else json.load(response)

    def wait(description, read, predicate, timeout=90):
        deadline = time.monotonic() + timeout
        last = None
        while time.monotonic() < deadline:
            try:
                last = read()
                if predicate(last):
                    return last
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
                pass
            time.sleep(0.2)
        raise RuntimeError(f'{description} did not settle within {timeout}s; last={last}')

    if options.deploy or options.deploy_only:
        deploy(command, key, options.namespace, options.server_image, options.worker_image)
    if options.deploy_only:
        return 0
    wait('server readiness', lambda: request('/v1.0/api/health/ready'), lambda result: result is not None)
    tenant = request('/v1.0/api/tenants?maxResults=1000')['objects'][0]['id']
    base = '/v1.0/api/tenants/' + tenant
    request('/v1.0/api/settings', 'PUT', {'values': [
        {'path': 'Scheduling.LeaseDurationMs', 'value': '10000'},
        {'path': 'Scheduling.NodeHeartbeatTimeoutMs', 'value': '10000'},
        {'path': 'Scheduling.LeaseWaitMs', 'value': '1000'},
        {'path': 'Scheduling.PauseGraceMs', 'value': '1000'},
    ]})
    wait('worker registration', lambda: request('/v1.0/api/nodes?maxResults=1000'),
         lambda result: any(node['status'] == 'Ready' for node in result['objects']))
    profile = request(base + '/harness-profiles', 'POST', {
        'name': 'external-effect-fixture-' + str(int(time.time())), 'harnessType': 'Generic',
        'executable': 'garrison-effect-fixture', 'promptDelivery': 'Stdin',
        'outputParser': 'PlainText', 'resultSource': 'Stdout', 'successPolicy': 'ExitCode',
        'defaultTimeoutSeconds': 90, 'killGraceSeconds': 1,
        'arguments': [{'template': value} for value in [
            '--mode', 'effect', '--sink', 'http://effect-sink:8080',
            '--operation', '{{run.id}}', '--attempt', '{{run.attempt}}',
            '--phase', '{{deployment.parameters.phase}}']],
        'probeArguments': ['--version'], 'successExitCodes': [0],
    })
    terminal = {'Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected'}
    results = {'startedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'context': options.context, 'namespace': options.namespace, 'cases': []}
    output = Path(options.results)
    output.parent.mkdir(parents=True, exist_ok=True)
    failed = False
    stamp = str(int(time.time()))

    def state():
        return request('/state', sink=True)

    def receipts(run_id):
        return [item for item in state()['receipts'] if item['operationId'] == run_id]

    def kill_worker():
        pods = json.loads(command('get', 'pods', '-l', 'app=effect-worker', '-o', 'json'))['items']
        running = next(pod for pod in pods if pod['status'].get('phase') == 'Running')
        name, uid = running['metadata']['name'], running['metadata']['uid']
        container_id = running['status']['containerStatuses'][0]['containerID'].split('://', 1)[1]
        runtime_node = running['spec']['nodeName']
        killed_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
        command('delete', 'pod', name, '--grace-period=0', '--force', '--wait=false')
        # Force deletion removes the API record before the kubelet necessarily stops the process. Never release a
        # pre-effect barrier until the old runtime container is actually gone, or the old attempt could finish first.
        def stopped():
            result = subprocess.run(['docker', 'exec', runtime_node, 'crictl', '--runtime-endpoint',
                                     'unix:///run/k3s/containerd/containerd.sock', 'ps', '--state', 'Running',
                                     '-q', '--id', container_id], capture_output=True, text=True, check=True)
            return not result.stdout.strip()
        wait('old worker runtime termination', stopped, bool, timeout=60)
        stopped_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
        def replacement():
            return json.loads(command('get', 'pods', '-l', 'app=effect-worker', '-o', 'json'))['items']
        wait('replacement worker', replacement, lambda items: any(
            pod['metadata']['uid'] != uid and any(condition['type'] == 'Ready' and condition['status'] == 'True'
            for condition in pod['status'].get('conditions', [])) for pod in items), timeout=120)
        return {'pod': name, 'uid': uid, 'runtimeContainerId': container_id, 'killUtc': killed_utc, 'processStoppedUtc': stopped_utc}

    for policy in ['AtMostOnce', 'Journaled', 'AtLeastOnce']:
        for phase in ['before', 'after', 'complete']:
            case = {'policy': policy, 'phase': phase}
            results['cases'].append(case)
            try:
                agent = request(base + '/agents', 'POST', {'name': f'effect-{policy.lower()}-{phase}-{stamp}'})
                request(base + '/deployments', 'POST', {
                    'name': agent['name'] + '-default', 'agentId': agent['id'], 'harnessProfileId': profile['id'],
                    'effectPolicy': policy, 'maxAttempts': 3, 'timeoutSeconds': 90,
                    'parameters': [{'name': 'phase', 'value': phase}],
                })
                run = request(base + '/agents/' + agent['id'] + '/invoke', 'POST', {'input': 'External mutation acceptance fixture.', 'wait': False})
                run_id = case['runId'] = run['id']
                if phase == 'before':
                    wait('pre-effect barrier', state, lambda value: any(item['operationId'] == run_id for item in value['ready']))
                else:
                    wait('first committed external effect', lambda: receipts(run_id), lambda items: len(items) == 1)
                if phase == 'complete':
                    wait('successful initial completion', lambda: request(base + '/runs/' + run_id), lambda value: value['status'] == 'Succeeded')
                case['kill'] = kill_worker()
                if policy == 'AtLeastOnce' and phase != 'complete':
                    if phase == 'before':
                        request('/allow?operation=' + urllib.parse.quote(run_id), 'POST', {}, sink=True)
                    expected = 1 if phase == 'before' else 2
                    wait('replacement external effect', lambda: receipts(run_id), lambda items: len(items) >= expected)
                    request('/release?operation=' + urllib.parse.quote(run_id), 'POST', {}, sink=True)
                final = wait('terminal run', lambda: request(base + '/runs/' + run_id), lambda value: value['status'] in terminal, timeout=120)
                committed = receipts(run_id)
                expected = 1 if phase == 'complete' else (0 if phase == 'before' else 1)
                if policy == 'AtLeastOnce' and phase == 'after':
                    expected = 2
                elif policy == 'AtLeastOnce' and phase == 'before':
                    expected = 1
                expected_status = 'Succeeded' if phase == 'complete' or policy == 'AtLeastOnce' else 'Failed'
                assert len(committed) == expected, f'Expected {expected} external mutations, observed {committed}'
                assert final['status'] == expected_status, final
                if expected_status == 'Failed':
                    assert final['outcome'] == 'NodeLost', final
                if policy == 'AtLeastOnce' and phase != 'complete':
                    assert final['attempt'] == 2, final
                else:
                    assert final['attempt'] == 1, final
                if len(committed) == 2:
                    assert {item['attempt'] for item in committed} == {1, 2}, committed
                case.update(passed=True, finalStatus=final['status'], outcome=final['outcome'], attempts=final['attempt'], receipts=committed)
            except Exception as error:
                failed = True
                case.update(passed=False, error=str(error))
                if case.get('runId'):
                    try:
                        request(base + '/runs/' + case['runId'] + '/cancel', 'POST', {})
                        request('/release?operation=' + urllib.parse.quote(case['runId']), 'POST', {}, sink=True)
                    except Exception:
                        pass
            output.write_text(json.dumps(results, indent=2) + '\n')
            print(f"{policy} {phase}: {'PASS' if case['passed'] else 'FAIL'}", flush=True)
    # Restart the control-plane process while the worker has already committed a visible external effect.
    # The sink stays blocked until the new control plane is ready, so completion crosses the restart boundary.
    for policy in ['AtMostOnce', 'Journaled', 'AtLeastOnce']:
        case = {'policy': policy, 'phase': 'control-plane-restart-after-effect'}
        results['cases'].append(case)
        try:
            agent = request(base + '/agents', 'POST', {'name': f'control-restart-{policy.lower()}-{stamp}'})
            request(base + '/deployments', 'POST', {
                'name': agent['name'] + '-default', 'agentId': agent['id'], 'harnessProfileId': profile['id'],
                'effectPolicy': policy, 'maxAttempts': 3, 'timeoutSeconds': 90,
                'parameters': [{'name': 'phase', 'value': 'after'}],
            })
            run = request(base + '/agents/' + agent['id'] + '/invoke', 'POST', {'input': 'Control-plane restart after external effect.', 'wait': False})
            run_id = case['runId'] = run['id']
            wait('committed effect before server restart', lambda: receipts(run_id), lambda items: len(items) == 1)
            started = time.monotonic()
            command('rollout', 'restart', 'deployment/garrison-server')
            command('rollout', 'status', 'deployment/garrison-server', '--timeout=90s')
            wait('restarted server readiness', lambda: request('/v1.0/api/health/ready'), lambda value: value is not None)
            case['restartSeconds'] = time.monotonic() - started
            request('/release?operation=' + urllib.parse.quote(run_id), 'POST', {}, sink=True)
            final = wait('completion through restarted control plane', lambda: request(base + '/runs/' + run_id), lambda value: value['status'] in terminal, timeout=120)
            committed = receipts(run_id)
            assert final['status'] == 'Succeeded', final
            assert final['attempt'] == 1, final
            assert len(committed) == 1, committed
            case.update(passed=True, finalStatus=final['status'], attempts=final['attempt'], receipts=committed)
        except Exception as error:
            failed = True
            case.update(passed=False, error=str(error))
            if case.get('runId'):
                try:
                    request('/release?operation=' + urllib.parse.quote(case['runId']), 'POST', {}, sink=True)
                    request(base + '/runs/' + case['runId'] + '/cancel', 'POST', {})
                except Exception:
                    pass
        output.write_text(json.dumps(results, indent=2) + '\n')
        print(f"{policy} control-plane-restart: {'PASS' if case['passed'] else 'FAIL'}", flush=True)
    results['finishedUtc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    results['passed'] = not failed
    output.write_text(json.dumps(results, indent=2) + '\n')
    return 1 if failed else 0


def deploy(command, key, namespace, server_image, worker_image):
    resources = [
        {'apiVersion': 'v1', 'kind': 'Namespace', 'metadata': {'name': namespace}},
    ]
    server = {
        'Rest': {'Hostname': '*', 'Port': 8700, 'PublicBaseUrl': 'http://garrison-server:8700'},
        'Mcp': {'Enable': True, 'Hostname': '*', 'Port': 8701, 'Path': '/mcp', 'PublicUrl': 'http://garrison-server:8701'},
        'Database': {'Type': 'Postgresql', 'Host': 'effect-postgres', 'Port': 5432, 'DatabaseName': 'garrison', 'Username': 'garrison', 'Password': 'effect-chaos-local-only', 'MaxPoolSize': 20},
        'Auth': {'AdminApiKey': key}, 'Security': {'AllowInsecureDefaults': True},
        'Telemetry': {'Enabled': True, 'PrometheusHostname': '*', 'PrometheusPort': 9464, 'ServeMetricsOnServicePort': True, 'OtlpEnable': False},
        'Logging': {'ConsoleLogging': True, 'MinimumSeverity': 2},
    }
    worker = {'ServerUrl': 'http://garrison-server:8700', 'MaxConcurrentRuns': 4, 'ChildReserveSlots': 2,
              'HealthHostname': '*', 'HealthPort': 8710, 'WorkRoot': '/workspaces', 'LeaseWaitMs': 1000,
              'EventFlushIntervalMs': 20, 'DrainTimeoutSeconds': 2, 'ProbeIntervalSeconds': 0,
              'Telemetry': {'Enabled': False},
              'Probes': [{'HarnessType': 'Generic', 'Executable': 'garrison-effect-fixture', 'Arguments': ['--version'], 'Label': 'effect'}]}
    resources.append({'apiVersion': 'v1', 'kind': 'ConfigMap', 'metadata': {'name': 'effect-config', 'namespace': namespace},
                      'data': {'server.json': json.dumps(server), 'worker.json': json.dumps(worker)}})
    def service(name, port, target, node_port=None):
        spec = {'selector': {'app': name}, 'ports': [{'port': port, 'targetPort': target}]}
        if node_port:
            spec['type'] = 'NodePort'
            spec['ports'][0]['nodePort'] = node_port
        resources.append({'apiVersion': 'v1', 'kind': 'Service', 'metadata': {'name': name, 'namespace': namespace}, 'spec': spec})
    def deployment(name, image, container, mounts=None, volumes=None):
        container.update(name=name, image=image, imagePullPolicy='Never')
        if mounts:
            container['volumeMounts'] = mounts
        spec = {'containers': [container], 'terminationGracePeriodSeconds': 1}
        if volumes:
            spec['volumes'] = volumes
        resources.append({'apiVersion': 'apps/v1', 'kind': 'Deployment', 'metadata': {'name': name, 'namespace': namespace},
                          'spec': {'replicas': 1, 'selector': {'matchLabels': {'app': name}}, 'template': {'metadata': {'labels': {'app': name}}, 'spec': spec}}})
    deployment('effect-postgres', 'postgres:17', {'env': [
        {'name': 'POSTGRES_DB', 'value': 'garrison'}, {'name': 'POSTGRES_USER', 'value': 'garrison'},
        {'name': 'POSTGRES_PASSWORD', 'value': 'effect-chaos-local-only'}],
        'readinessProbe': {'exec': {'command': ['pg_isready', '-U', 'garrison']}, 'periodSeconds': 1}})
    service('effect-postgres', 5432, 5432)
    deployment('garrison-server', server_image, {
        'env': [{'name': 'GARRISON_SETTINGS_FILE', 'value': '/config/server.json'}, {'name': 'GARRISON_ALLOW_INSECURE_DEFAULTS', 'value': 'true'}],
        'readinessProbe': {'httpGet': {'path': '/v1.0/api/health/ready', 'port': 8700}, 'periodSeconds': 1, 'failureThreshold': 60}},
        [{'name': 'config', 'mountPath': '/config', 'readOnly': True}], [{'name': 'config', 'configMap': {'name': 'effect-config'}}])
    resources[-1]['spec']['template']['spec']['initContainers'] = [{
        'name': 'wait-postgres', 'image': 'postgres:17', 'imagePullPolicy': 'Never',
        'command': ['sh', '-c', 'until pg_isready -h effect-postgres -U garrison; do sleep 1; done']}]
    service('garrison-server', 8700, 8700, 30870)
    resources[-1]['spec']['ports'].append({'name': 'mcp', 'port': 8701, 'targetPort': 8701, 'nodePort': 30872})
    resources[-1]['spec']['ports'][0]['name'] = 'rest'
    deployment('effect-worker', worker_image, {
        'env': [{'name': 'GARRISON_WORKER_SETTINGS_FILE', 'value': '/config/worker.json'}],
        'readinessProbe': {'httpGet': {'path': '/health/ready', 'port': 8710}, 'periodSeconds': 1, 'failureThreshold': 60}},
        [{'name': 'config', 'mountPath': '/config', 'readOnly': True}], [{'name': 'config', 'configMap': {'name': 'effect-config'}}])
    deployment('effect-sink', worker_image, {'command': ['node', '/opt/garrison/effect-fixture.mjs', '--mode', 'sink'],
        'readinessProbe': {'httpGet': {'path': '/state', 'port': 8080}, 'periodSeconds': 1}})
    service('effect-sink', 8080, 8080, 30871)
    command('apply', '-f', '-', body=json.dumps({'apiVersion': 'v1', 'kind': 'List', 'items': resources}))
    for name in ['effect-postgres', 'garrison-server', 'effect-sink', 'effect-worker']:
        command('rollout', 'status', 'deployment/' + name, '--timeout=180s')


if __name__ == '__main__':
    raise SystemExit(main())
