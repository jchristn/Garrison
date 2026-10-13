"""Interactive Garrison SDK console. Credentials are prompted, never printed or saved."""
import getpass
import json
import sys
from .client import GarrisonClient


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
                    print('health | login <tenant> <email> | keys | tenant <id> | agents | runs | invoke <agent> <input> | run <id> | events <id> | watch <id> | quit')
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
                elif command == 'events': show(client.runs.events(parts[1]))
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
