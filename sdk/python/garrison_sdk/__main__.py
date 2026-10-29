"""Interactive Garrison SDK console. Credentials are prompted, never printed or saved."""
import getpass
import json
import sys
from .client import GarrisonClient


ARCHITECT_DEPLOYMENT = 'agent-architect-sdk'
FAKE_HARNESS_PROFILE = 'hrn_builtin_fake'


def select_architect_prompt(client, prompt=None):
    """Select an architect prompt (identifier or name; default the first listed, the built-in) for an agent architect,
    creating an architect on the fake harness when none exists."""
    prompts = client.studio_drafts.list_architect_prompts()['objects']
    if not prompts:
        raise ValueError('The server lists no architect prompts.')
    architects = client.studio_drafts.list_architects(max_results=1)['objects']
    if architects:
        architect_id = architects[0]['id']
    else:
        architect_id = client.studio_drafts.create_architect({'name': ARCHITECT_DEPLOYMENT, 'harnessProfileId': FAKE_HARNESS_PROFILE})['id']
    return client.studio_drafts.set_architect_prompt(architect_id, prompt or prompts[0]['id'])


def main():
    client = GarrisonClient(sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8700')
    print('Garrison SDK console. Type help; Ctrl+C cancels the active request or stream.')
    def secret(prompt):
        if sys.stdin.isatty():
            return getpass.getpass(prompt)
        value = sys.stdin.readline()
        if not value:
            raise EOFError('Credential input ended.')
        return value.rstrip('\r\n')
    def show(value):
        print(json.dumps(value, ensure_ascii=False))
    try:
        while True:
            try:
                line = input('garrison> ' if sys.stdin.isatty() else '')
                parts = line.split(maxsplit=2)
                if not parts:
                    continue
                command = parts[0].lower()
                if command in ('quit', 'exit'):
                    break
                if command == 'help':
                    print('health | login <tenant> <email> | keys | tenant <id> | agents | runs | invoke <agent> <input> | run <id> | events <id> | operations <id> | watch <id> | pipelines | pipeline-runs | pipeline-reviews | start-pipeline <pipeline> <input> | triggers | fire-trigger <trigger> | notification-endpoints | apply <file> | apps | studio-draft <app> | architect-prompts | architects | architect [prompt] | chat <slug> <message> | quit')
                elif command == 'health': show(client.health())
                elif command == 'login':
                    client.login(parts[2], secret('Password: '), parts[1])
                    print('Signed in. Tenant:', client.tenant_id)
                elif command == 'keys':
                    client.login_with_keys(secret('Access key: '), secret('Secret key: '))
                    print('Signed in. Tenant:', client.tenant_id)
                elif command == 'tenant': client.tenant_id = parts[1]
                elif command == 'agents': show(client.agents.list())
                elif command == 'runs': show(client.runs.list())
                elif command == 'invoke': show(client.agents.invoke(parts[1], parts[2], wait=False))
                elif command == 'run': show(client.runs.get(parts[1]))
                elif command == 'operations': show(client.runs.operations(parts[1]))
                elif command == 'events': show(client.runs.events(parts[1]))
                elif command == 'triggers': show(client.triggers.list())
                elif command == 'fire-trigger': show(client.triggers.fire(parts[1]))
                elif command == 'notification-endpoints': show(client.notification_endpoints.list())
                elif command == 'pipelines': show(client.pipelines.list())
                elif command == 'pipeline-runs': show(client.pipeline_runs.list())
                elif command == 'pipeline-reviews': show(client.pipeline_reviews.list())
                elif command == 'start-pipeline': show(client.pipelines.start(parts[1], parts[2]))
                elif command == 'apply':
                    with open(parts[1], encoding='utf-8') as handle:
                        applied = client.manifests.apply(handle.read())
                    show({k: applied.get(k) for k in ('id', 'documentCount', 'createdCount', 'updatedCount', 'unchangedCount', 'failedCount')})
                elif command == 'apps': show(client.apps.list())
                elif command == 'studio-draft': show(client.studio_drafts.create('Console draft of ' + parts[1], from_app=parts[1]))
                elif command == 'architect-prompts':
                    for entry in client.studio_drafts.list_architect_prompts()['objects']:
                        show({k: entry.get(k) for k in ('id', 'name', 'isBuiltIn', 'isDefault', 'currentVersion', 'deployments')})
                elif command == 'architects':
                    for entry in client.studio_drafts.list_architects()['objects']:
                        show(entry)
                elif command == 'architect': show(select_architect_prompt(client, parts[1] if len(parts) > 1 else None))
                elif command == 'chat':
                    gateway = client.app_gateway(parts[1])
                    gateway.start_session()
                    started = gateway.start_conversation(parts[2])
                    for _ in gateway.stream_turn(started['conversationId'], started['turn']['runId']): pass
                    show(gateway.wait_for_turn(started['conversationId'], started['turn']['runId']))
                    gateway.end_session()
                elif command == 'watch':
                    for frame in client.runs.stream(parts[1]): show(frame)
                else: print('Unknown command. Type help.')
            except KeyboardInterrupt:
                print('\nCancelled.')
            except EOFError: break
            except IndexError: print('Missing arguments. Type help.')
            except Exception as error: print('Error:', error)
    finally:
        client.transport.session.close()


if __name__ == '__main__':
    main()
