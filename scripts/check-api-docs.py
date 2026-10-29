#!/usr/bin/env python3
"""Check that the API references describe the running server (AD12.4).

Compares a live server's OpenAPI document with REST_API.md and the docs it links for route tables, its MCP tools/list
with MCP_API.md, and its WebSocket channel names with WEBSOCKETS_API.md. Prints what is missing and exits 1 when
anything is.

Usage: scripts/check-api-docs.py [--url http://127.0.0.1:8700] [--mcp-url http://127.0.0.1:8701/mcp] [--api-key KEY]
"""
import argparse
import glob
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:8700')
parser.add_argument('--mcp-url', default='http://127.0.0.1:8701/mcp')
parser.add_argument('--api-key', default='garrisonadmin')
args = parser.parse_args()


def norm(path):
    path = re.sub(r'^/v1\.0/api/tenants/\{[^}]+\}', '', path)
    path = re.sub(r'^/v1\.0/api', '', path)
    return re.sub(r'\{[^}]+\}', '{}', path)


docs = (ROOT / 'REST_API.md').read_text() + ''.join(Path(p).read_text() for p in glob.glob(str(ROOT / 'docs' / '*.md')))
docs = re.sub(r'\{[^}]+\}', '{}', docs)
missing = []

with urllib.request.urlopen(args.url.rstrip('/') + '/openapi.json') as response:
    openapi = json.load(response)
for path, methods in sorted(openapi.get('paths', {}).items()):
    n = norm(path)
    if n and n not in docs:
        missing.append('REST ' + '/'.join(m.upper() for m in methods) + ' ' + path)

def mcp(method, params, session=None, notify=False):
    payload = {'jsonrpc': '2.0', 'method': method, 'params': params}
    if not notify:
        payload['id'] = 1
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'x-api-key': args.api_key}
    if session:
        headers['Mcp-Session-Id'] = session
    request = urllib.request.Request(args.mcp_url, data=json.dumps(payload).encode(), headers=headers)
    with urllib.request.urlopen(request) as response:
        return response.headers.get('Mcp-Session-Id') or session, response.read().decode()


session, _ = mcp('initialize', {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'check-api-docs', 'version': '0.2.0'}})
mcp('notifications/initialized', {}, session, notify=True)
_, body = mcp('tools/list', {}, session)
match = re.search(r'\{.*\}', body, re.S)
tools = [t['name'] for t in json.loads(match.group(0)).get('result', {}).get('tools', [])] if match else []
mcp_doc = (ROOT / 'MCP_API.md').read_text()
for name in tools:
    if name.startswith('garrison_') and name not in mcp_doc:
        missing.append('MCP tool ' + name)

handler = (ROOT / 'src/Garrison.Server/WebSockets/LiveUpdatesHandler.cs').read_text()
channels = set(re.findall(r'StartsWith\("([a-z-]+):"', handler)) | {'runs', 'nodes', 'approvals'}
ws_doc = (ROOT / 'WEBSOCKETS_API.md').read_text()
for channel in sorted(channels):
    if channel not in ws_doc:
        missing.append('WebSocket channel ' + channel)

print('%d REST paths, %d MCP tools, %d channels checked' % (len(openapi.get('paths', {})), len(tools), len(channels)))
for item in missing:
    print('MISSING ' + item)
sys.exit(1 if missing else 0)
