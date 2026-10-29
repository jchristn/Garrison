#!/usr/bin/env python3
import subprocess,json,urllib.request,time,pathlib,os,argparse,shutil
parser=argparse.ArgumentParser(description='Verify SDK consoles against a server and fake-harness worker.')
parser.add_argument('--base-url',default='http://127.0.0.1:8700')
parser.add_argument('--python',default='python3')
args=parser.parse_args()
root=str(pathlib.Path(__file__).resolve().parents[1]);base=args.base_url;api='/v1.0/api/tenants/default'
access=os.environ.get('GARRISON_SDK_ACCESS_KEY','access_garrison_default')
key=os.environ.get('GARRISON_SDK_SECRET_KEY','secret_garrison_default_change_me')
def request(path,method='GET',body=None):
 headers={'Content-Type':'application/json'}
 if 'token' in globals():headers['Authorization']='Bearer '+token
 req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
 with urllib.request.urlopen(req,timeout=30) as response:
  value=response.read();return json.loads(value) if value else {}
token=request('/v1.0/token','POST',{'accessKey':access,'secretKey':key})['token']
profiles=request(api+'/harness-profiles?maxResults=1000&includeBuiltIn=true')['objects'];profile=next(p for p in profiles if p['name']=='builtin/fake')
bundle=root+'/examples/agentic-apps/support-triage/support-triage.yaml'
def architect_deployments():
 return {d['id'] for d in request(api+'/studio/architects?maxResults=1000&search=agent-architect-sdk')['objects'] if d['name']=='agent-architect-sdk'}
architects_before=architect_deployments();drafts=[]
agent=request(api+'/agents','POST',{'name':'console-fixture-'+str(int(time.time()))});deployment=None
try:
 deployment=request(api+'/deployments','POST',{'name':agent['name'],'agentId':agent['id'],'harnessProfileId':profile['id']})
 run=request(api+'/agents/'+agent['id']+'/invoke','POST',{'input':'console streaming fixture','wait':False})
 commands=[('csharp',['dotnet','run','--project','sdk/csharp/Garrison.Sdk.Console','-f','net10.0','--',base],bundle),('python',[args.python,'-m','garrison_sdk',base],bundle),('js',['node','sdk/js/bin/console.mjs',base],bundle),('go',['docker','run','--rm','-i','-v',root+'/sdk/go:/src','-v',root+'/examples:/examples:ro','-w','/src','golang:1.23','go','run','./cmd/console',base.replace('127.0.0.1','host.docker.internal')],'/examples/agentic-apps/support-triage/support-triage.yaml')]
 if shutil.which('go'): commands[-1]=('go',['go','-C',root+'/sdk/go','run','./cmd/console',base],bundle)
 for name,cmd,bundle_path in commands:
  text='help\nhealth\nkeys\n'+access+'\n'+key+'\nagents\nruns\nrun '+run['id']+'\nevents '+run['id']+'\noperations '+run['id']+'\nwatch '+run['id']+'\ninvoke '+agent['id']+' console invocation from '+name+'\n'
  text+='apply '+bundle_path+'\napps\nstudio-draft support-triage\narchitect-prompts\narchitect\narchitects\nchat support-triage My invoice was charged twice.\nquit\n'
  process=subprocess.run(cmd,cwd=root,input=text.encode(),stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=300)
  output=process.stdout.decode(errors='replace');assert access not in output and key not in output,'credential leak'
  log_root=pathlib.Path(os.environ.get('GARRISON_CONSOLE_LOG_DIR','/tmp'));log_root.mkdir(parents=True,exist_ok=True)
  path=log_root/('garrison-console-'+name+'.log');path.write_text(output);os.chmod(path,0o600)
  assert process.returncode==0 and 'Signed in.' in output and 'run.completed' in output and 'Error:' not in output and 'Unknown command' not in output and 'operations <id>' in output and agent['id'] in output,(name,process.returncode)
  seen=set()
  for line in output.splitlines():
   try: created=json.loads(line)
   except ValueError: continue
   if not isinstance(created,dict): continue
   if 'failedCount' in created and 'documentCount' in created:
    assert created['failedCount']==0 and created['documentCount']>0,(name,'bundle apply',created);seen.add('apply')
   if created.get('targetApp') and created.get('items'):
    drafts.append(created['id']);seen.add('studio-draft')
   if 'isBuiltIn' in created and created.get('name')=='builtin/agent-architect':seen.add('architect-prompts')
   if created.get('architectPromptTemplateId') and created.get('deploymentId'):seen.add('architect')
   if 'architectPromptCurrentVersion' in created and created.get('id') and created.get('harnessProfileId'):seen.add('architects')
   if created.get('runId') and created.get('message')=='My invoice was charged twice.':
    assert created['status']=='Succeeded' and created.get('answer'),(name,'app chat',created);seen.add('chat')
   if created.get('inputText') != 'console invocation from '+name: continue
   deadline=time.monotonic()+30
   while created['status'] in ('Queued','Leased','Running') and time.monotonic()<deadline:
    time.sleep(0.1);created=request(api+'/runs/'+created['id'])
   assert created['status']=='Succeeded',(name,'invocation completion',created['status'])
  missing={'apply','studio-draft','architect-prompts','architect','architects','chat'}-seen
  assert not missing,(name,'studio walkthrough output missing',sorted(missing))
  print(name,'PASS health, login, lists, run/events/operations, stream completion, invocation, bundle apply, studio draft, architect prompt, architect list, app chat, quit, credential non-disclosure',flush=True)
finally:
 for draft in drafts:
  try: request(api+'/studio/drafts/'+draft,'DELETE')
  except Exception: pass
 for architect in architect_deployments()-architects_before:request(api+'/studio/architects/'+architect,'DELETE')
 if deployment:request(api+'/deployments/'+deployment['id'],'DELETE')
 request(api+'/agents/'+agent['id'],'DELETE')
 print('Temporary agent/deployment removed',flush=True)
