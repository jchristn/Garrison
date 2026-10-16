#!/usr/bin/env python3
"""Check the optional NotDory MCP layer using synthetic filesystem memory, then remove its scope."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--env-file', type=Path, default=Path('docker/.env'))
parser.add_argument('--container', default='garrison-server')
parser.add_argument('--mcp-url', default='http://notdory-mcp:8720/mcp')
parser.add_argument('--keep-fixture', action='store_true')
args = parser.parse_args()
values = {}
if args.env_file.exists():
    values = dict(line.split('=', 1) for line in args.env_file.read_text().splitlines()
                  if '=' in line and not line.lstrip().startswith('#'))
key = os.environ.get('NOTDORY_ACCESS_KEY') or values.get('NOTDORY_ACCESS_KEY', '').strip().strip('\"').strip("'")
if not key:
    raise SystemExit('Set NOTDORY_ACCESS_KEY or supply an env file containing it.')
session = None
seq = 0

def rpc(method,params,notification=False):
 global session,seq
 seq+=1
 body={'jsonrpc':'2.0','method':method,'params':params}
 if not notification:body['id']=seq
 cmd=['docker','exec','-i',args.container,'curl','-fsS','-D','-','-X','POST',args.mcp_url,'-H','Content-Type: application/json','-H','Accept: application/json, text/event-stream','-H','x-access-key: '+key,'--data-binary','@-']
 if session:cmd.extend(['-H','Mcp-Session-Id: '+session])
 result=subprocess.run(cmd,input=json.dumps(body),text=True,capture_output=True,check=False)
 if result.returncode:raise RuntimeError("MCP HTTP transport failure: " + method + ", curl exit " + str(result.returncode))
 headers,text=result.stdout.replace('\r\n','\n').split('\n\n',1)
 for line in headers.splitlines():
  if line.lower().startswith('mcp-session-id:'):session=line.split(':',1)[1].strip()
 if not text.strip():return None
 if text.startswith('event:') or text.startswith('data:'):text=next(line[5:].strip() for line in text.splitlines() if line.startswith('data:'))
 data=json.loads(text)
 if 'error' in data:raise RuntimeError('MCP error code '+str(data['error'].get('code')))
 return data.get('result')

def call(name,args):
 data=rpc('tools/call',{'name':name,'arguments':args})
 if data.get('isError'):raise RuntimeError('Tool failed: '+name)
 text='\n'.join(c.get('text','') for c in data.get('content',[]))
 try:
  value=json.loads(text)
  if isinstance(value,dict) and value.get('success') is False:raise RuntimeError('NotDory rejected tool '+name+' with status '+str(value.get('statusCode')))
  return value.get('data',value) if isinstance(value,dict) else value
 except json.JSONDecodeError:return text

rpc('initialize',{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'garrison-memory-smoke','version':'1'}})
rpc('notifications/initialized',{},True)
call('whoami',{})
tools=rpc('tools/list',{})
assert all(n in [x['name'] for x in tools['tools']] for n in ['scope_create','memory_upsert','memory_search'])
fixture_id=uuid.uuid4().hex
scope=call('scope_create',{'name':'garrison-d060-smoke-'+fixture_id[:8],'storeProvider':'Filesystem','filesystemLayout':'Hierarchy','targetPath':'/app/data/memory/garrison-d060-smoke/'+fixture_id})
assert isinstance(scope,dict) and 'id' in scope, 'Scope response shape: '+str(list(scope) if isinstance(scope,dict) else type(scope))
call('memory_upsert',{'scopeId':scope['id'],'category':'integration','slug':'garrison-memory-smoke','title':'Garrison integration smoke','body':'garrison-d060-memory-smoke persists across separate MCP calls'})
found=call('memory_search',{'scopeId':scope['id'],'queryText':'garrison-d060-memory-smoke','mode':'Keyword'})
assert 'garrison-d060-memory-smoke' in json.dumps(found),'Memory was not retrieved'
# A new MCP session must see the same memory, independent of the first session's state.
session = None
rpc('initialize',{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'garrison-memory-second-session','version':'1'}})
rpc('notifications/initialized',{},True)
found = call('memory_search',{'scopeId':scope['id'],'queryText':'garrison-d060-memory-smoke','mode':'Keyword'})
assert 'garrison-d060-memory-smoke' in json.dumps(found), 'Second session lost memory'
if not args.keep_fixture:
 call('scope_delete',{'scopeId':scope['id']})
print('PASS NotDory initialize, authenticated identity, tool catalog, filesystem scope, memory write and keyword retrieval')
