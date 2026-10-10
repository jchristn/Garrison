<#
.SYNOPSIS
  Checks a Garrison install end to end with the quick start agents. PowerShell twin of validate.sh.

.DESCRIPTION
  For every agent: invoke it over REST, MCP, and A2A. Then: ask the delegating agent to call another agent and confirm
  the child run in the run tree, follow a run's server-sent event stream, check the run telemetry fields, and query the
  analytics endpoint. Prints PASS or FAIL per check and exits with code 1 when anything fails.
  Works with Windows PowerShell 5.1 and PowerShell 7. examples\validate.bat runs it with the execution policy bypassed.

.EXAMPLE
  examples\validate.bat
  examples\validate.bat -Url http://127.0.0.1:9700 -McpUrl http://127.0.0.1:9701/mcp
  examples\validate.bat -Agents "echo" -SkipDelegation
#>
param(
  # REST base URL. Default: GARRISON_URL, else http://127.0.0.1:8700
  [string]$Url = $(if ($env:GARRISON_URL) { $env:GARRISON_URL } else { 'http://127.0.0.1:8700' }),
  # MCP endpoint. Default: GARRISON_MCP_URL, else the REST host on port 8701 with path /mcp
  [string]$McpUrl = $env:GARRISON_MCP_URL,
  [string]$Tenant = $(if ($env:GARRISON_TENANT) { $env:GARRISON_TENANT } else { 'default' }),
  [string]$Email = $(if ($env:GARRISON_EMAIL) { $env:GARRISON_EMAIL } else { 'admin@garrison' }),
  [string]$Password = $(if ($env:GARRISON_PASSWORD) { $env:GARRISON_PASSWORD } else { 'password' }),
  # Space-separated agent names.
  [string]$Agents = $(if ($env:GARRISON_AGENTS) { $env:GARRISON_AGENTS } else { 'planner coder echo' }),
  [string]$Delegator = $(if ($env:GARRISON_DELEGATOR) { $env:GARRISON_DELEGATOR } else { 'planner' }),
  [string]$Delegate = $(if ($env:GARRISON_DELEGATE) { $env:GARRISON_DELEGATE } else { 'echo' }),
  # Longest wait for one run, in seconds.
  [int]$Wait = $(if ($env:GARRISON_WAIT) { [int]$env:GARRISON_WAIT } else { 240 }),
  [switch]$SkipDelegation
)

$ErrorActionPreference = 'Stop'
$Url = $Url.TrimEnd('/')
if (-not $McpUrl) { $McpUrl = ([Uri]$Url).GetLeftPart([UriPartial]::Scheme) + ([Uri]$Url).Host + ':8701/mcp' }
$Api = "$Url/v1.0/api/tenants/$Tenant"
$AgentList = @($Agents -split '\s+' | Where-Object { $_ })
$ToolWait = [Math]::Min($Wait, 90)
$Prompt = 'Reply with one short sentence that includes the word READY.'

$script:Passed = 0
$script:Failed = 0
$script:Failures = @()
function Pass([string]$name) { $script:Passed++; Write-Host "PASS  $name" }
function Fail([string]$name, [string]$why) { $script:Failed++; $script:Failures += $name; Write-Host "FAIL  $name"; Write-Host "      $why" }
function Info([string]$text) { Write-Host "      $text" }

function Call([string]$method, [string]$uri, $body = $null, [hashtable]$headers = @{}, [int]$timeout = 30) {
  $h = @{}
  if ($script:Token) { $h['Authorization'] = "Bearer $($script:Token)" }
  foreach ($k in $headers.Keys) { $h[$k] = $headers[$k] }
  $request = @{ Method = $method; Uri = $uri; Headers = $h; TimeoutSec = $timeout; UseBasicParsing = $true }
  if ($null -ne $body) { $request['Body'] = [Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 10 -Compress)); $request['ContentType'] = 'application/json' }
  try { return Invoke-WebRequest @request }
  catch {
    # Error responses (4xx, 5xx) still carry a JSON body worth showing.
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { return [pscustomobject]@{ Content = $_.ErrorDetails.Message; Headers = @{} } }
    return $null
  }
}
function Json($response) { if ($response -and $response.Content) { try { return ($response.Content | ConvertFrom-Json) } catch { return $null } } return $null }
function SseJson([string]$text) {
  $data = @($text -split "`n" | Where-Object { $_ -like 'data:*' })
  if ($data.Count -gt 0) { return ($data[-1].Substring(5).Trim() | ConvertFrom-Json) }
  return ($text | ConvertFrom-Json)
}
function Describe($run) {
  if (-not $run) { return 'no response' }
  $id = if ($run.id) { $run.id } else { $run.runId }
  $text = "$($run.resultText)$($run.result)$($run.errorMessage)" -replace '\s+', ' '
  if ($text.Length -gt 80) { $text = $text.Substring(0, 80) }
  return "run $id status $($run.status) model $($run.servedModel) ttft $($run.timeToFirstTokenMs)ms exec $($run.executionMs)ms result: $text"
}
function WaitRun([string]$id) {
  $deadline = (Get-Date).AddSeconds($Wait)
  do {
    $run = Json (Call GET "$Api/runs/$id")
    if ($run -and @('Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected') -contains $run.status) { return $run }
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  return $run
}

Write-Host 'Garrison validation'
Write-Host "  REST   $Url"
Write-Host "  MCP    $McpUrl"
Write-Host "  tenant $Tenant   user $Email   agents: $($AgentList -join ' ')"
Write-Host ''

# --- Server and sign-in -------------------------------------------------------
$health = Json (Call GET "$Url/v1.0/api/health" -timeout 10)
if ($health -and $health.status -eq 'healthy') { Pass 'server health' }
else { Fail 'server health' "GET $Url/v1.0/api/health did not answer healthy. Is the stack running and is the URL right?"; exit 1 }

$script:Token = $null
$signin = Json (Call POST "$Url/v1.0/token" @{ email = $Email; password = $Password; tenantId = $Tenant } -timeout 10)
if ($signin -and $signin.token) { $script:Token = $signin.token; Pass "sign in as $Email" }
else { Fail "sign in as $Email" 'POST /v1.0/token returned no token. Check -Email, -Password, and -Tenant.'; exit 1 }

$nodes = Json (Call GET "$Url/v1.0/api/nodes" -timeout 10)
$ready = @($nodes.objects | Where-Object { $_.status -eq 'Ready' }).Count
if ($ready -ge 1) { Pass "workers ready ($ready)" } else { Fail 'workers ready' 'no worker node reports Ready in GET /v1.0/api/nodes; runs would stay queued' }

$deployments = Json (Call GET "$Api/deployments?maxResults=1000")
foreach ($agent in $AgentList) {
  $list = Json (Call GET "$Api/agents?maxResults=100&search=$([Uri]::EscapeDataString($agent))")
  $found = @($list.objects | Where-Object { $_.name -eq $agent }) | Select-Object -First 1
  if (-not $found) { Fail "agent $agent has an active deployment" "no agent named $agent in tenant $Tenant; apply examples/multi-agent.yaml first"; continue }
  $count = @($deployments.objects | Where-Object { $_.agentId -eq $found.id -and $_.active }).Count
  if ($count -ge 1) { Pass "agent $agent has an active deployment" }
  else { Fail "agent $agent has an active deployment" "agent $agent exists but has no active deployment, so invoking it would be rejected" }
}

# --- REST ----------------------------------------------------------------------
$lastRun = $null
foreach ($agent in $AgentList) {
  $run = Json (Call POST "$Api/agents/$agent/invoke" @{ input = $Prompt; wait = $true; waitSeconds = $Wait } -timeout ($Wait + 30))
  if ($run -and @('Queued', 'Leased', 'Running') -contains $run.status) { $run = WaitRun $run.id }
  if ($run -and $run.status -eq 'Succeeded') { Pass "REST invoke $agent"; Info (Describe $run); if (-not $lastRun) { $lastRun = $run.id } }
  else { Fail "REST invoke $agent" (Describe $run) }
}

# --- MCP -----------------------------------------------------------------------
$mcpHeaders = @{ Accept = 'application/json, text/event-stream' }
$init = Call POST $McpUrl @{ jsonrpc = '2.0'; id = 1; method = 'initialize'; params = @{ protocolVersion = '2025-06-18'; capabilities = @{}; clientInfo = @{ name = 'garrison-validate'; version = '1' } } } $mcpHeaders 15
$session = $null
if ($init) { $session = @($init.Headers['MCP-Session-Id'])[0] }
if ($session) {
  Pass 'MCP initialize'
  $mcpHeaders['MCP-Session-Id'] = $session
  $null = Call POST $McpUrl @{ jsonrpc = '2.0'; method = 'notifications/initialized' } $mcpHeaders 10
  $listed = @()
  $listResponse = Call POST $McpUrl @{ jsonrpc = '2.0'; id = 2; method = 'tools/call'; params = @{ name = 'garrison_list_agents'; arguments = @{ maxResults = 100 } } } $mcpHeaders 30
  if ($listResponse) { $listed = @(((SseJson $listResponse.Content).result.content[0].text | ConvertFrom-Json).agents | ForEach-Object { $_.name }) }
  $missing = @($AgentList | Where-Object { $listed -notcontains $_ })
  if ($missing.Count -eq 0) { Pass 'MCP garrison_list_agents' } else { Fail 'MCP garrison_list_agents' "missing: $($missing -join ' ')" }
  $n = 10
  foreach ($agent in $AgentList) {
    $n++
    $response = Call POST $McpUrl @{ jsonrpc = '2.0'; id = $n; method = 'tools/call'; params = @{ name = 'garrison_invoke_agent'; arguments = @{ tenantId = $Tenant; agent = $agent; input = $Prompt; waitSeconds = $ToolWait } } } $mcpHeaders ($ToolWait + 30)
    $summary = $null
    if ($response) { try { $summary = (SseJson $response.Content).result.content[0].text | ConvertFrom-Json } catch { $summary = $null } }
    if ($summary -and -not $summary.finished) { $summary = WaitRun $summary.runId }
    if ($summary -and $summary.status -eq 'Succeeded') { Pass "MCP invoke $agent"; Info (Describe $summary) }
    else { Fail "MCP invoke $agent" (Describe $summary) }
  }
}
else { Fail 'MCP initialize' "no MCP-Session-Id from $McpUrl. Is -McpUrl right?" }

# --- A2A -----------------------------------------------------------------------
foreach ($agent in $AgentList) {
  $card = Json (Call GET "$Url/v1.0/a2a/$Tenant/$agent/.well-known/agent-card.json" -timeout 10)
  if ($card -and $card.name) { Pass "A2A agent card $agent" } else { Fail "A2A agent card $agent" 'no card; is exposure.a2a true on the agent?' }
  $messageId = "validate-$agent-$([Guid]::NewGuid().ToString('N'))"
  $body = @{ jsonrpc = '2.0'; id = '1'; method = 'SendMessage'; params = @{ message = @{ role = 'ROLE_USER'; messageId = $messageId; parts = @(@{ text = $Prompt }) } } }
  $reply = Json (Call POST "$Url/v1.0/a2a/$Tenant/$agent" $body -timeout ($ToolWait + 30))
  $state = $reply.result.task.status.state
  if ($state -eq 'TASK_STATE_SUBMITTED' -or $state -eq 'TASK_STATE_WORKING') {
    $run = WaitRun $reply.result.task.id
    if ($run.status -eq 'Succeeded') { $state = 'TASK_STATE_COMPLETED' }
  }
  if ($state -eq 'TASK_STATE_COMPLETED') { Pass "A2A SendMessage $agent"; Info "task $($reply.result.task.id)" }
  else { Fail "A2A SendMessage $agent" "state $state" }
}

# --- Streaming -----------------------------------------------------------------
$streamAgent = if ($AgentList -contains $Delegate) { $Delegate } else { $AgentList[0] }
$started = Json (Call POST "$Api/agents/$streamAgent/invoke" @{ input = 'Count from one to five.'; wait = $false })
if ($started -and $started.id) {
  $stream = Call GET "$Api/runs/$($started.id)/events/stream" $null @{ Accept = 'text/event-stream' } ($Wait + 10)
  $text = if ($stream) { [string]$stream.Content } else { '' }
  $lines = $text -split "`n"
  $events = @($lines | Where-Object { $_ -like 'event: run.event*' }).Count
  $final = $null
  for ($i = 0; $i -lt $lines.Count - 1; $i++) {
    if ($lines[$i] -like 'event: run.completed*') { $final = ($lines[$i + 1].Substring(5).Trim() | ConvertFrom-Json).status }
  }
  if ($events -ge 1 -and $final -eq 'Succeeded') { Pass "SSE event stream ($streamAgent`: $events events, final status $final)" }
  else { Fail 'SSE event stream' "run $($started.id): $events events, last status $final" }
}
else { Fail 'SSE event stream' "could not start a run of $streamAgent" }

# --- Delegation ----------------------------------------------------------------
if (-not $SkipDelegation) {
  $ask = "Use the garrison_invoke_agent tool to invoke the agent named $Delegate with the input ping. Then reply with the result text that $Delegate returned."
  $run = Json (Call POST "$Api/agents/$Delegator/invoke" @{ input = $ask; wait = $true; waitSeconds = $Wait } -timeout ($Wait + 30))
  if ($run -and @('Queued', 'Leased', 'Running') -contains $run.status) { $run = WaitRun $run.id }
  if ($run -and $run.status -eq 'Succeeded') { Pass "delegating run $Delegator"; Info (Describe $run) } else { Fail "delegating run $Delegator" (Describe $run) }
  if ($run -and $run.id) {
    $children = Json (Call GET "$Api/runs/$($run.id)/children")
    $child = @($children.objects | Where-Object { $_.agentName -eq $Delegate }) | Select-Object -First 1
    if ($child -and $child.parentRunId -eq $run.id) { Pass "run tree: $Delegator -> $Delegate"; Info "child $($child.id) depth $($child.depth) chain $($child.callChain) status $($child.status)" }
    else { Fail "run tree: $Delegator -> $Delegate" "no child run of $Delegate under $($run.id); the agent may not have called the tool" }
  }
}

# --- Telemetry -----------------------------------------------------------------
if ($lastRun) {
  $run = Json (Call GET "$Api/runs/$lastRun")
  $fields = @('queueMs', 'totalMs', 'executionMs', 'timeToFirstTokenMs', 'inputTokens', 'outputTokens', 'servedModel')
  $missing = @($fields | Where-Object { $null -eq $run.$_ })
  if ($missing.Count -eq 0) {
    Pass 'run telemetry fields'
    Info "queue $($run.queueMs)ms ttft $($run.timeToFirstTokenMs)ms streaming $($run.streamingMs)ms exec $($run.executionMs)ms total $($run.totalMs)ms tokens in $($run.inputTokens) out $($run.outputTokens) cost $($run.costUsd) model $($run.servedModel)"
  }
  else { Fail 'run telemetry fields' "run $lastRun is missing: $($missing -join ' ')" }
}
else { Fail 'run telemetry fields' 'no successful REST run to inspect' }

$analytics = Json (Call GET "$Api/analytics/runs?groupBy=agent")
if ($analytics -and $analytics.totals.runs -ge 1) { Pass "analytics endpoint ($($analytics.totals.runs) runs in the last 24 hours; agents: $(@($analytics.series | ForEach-Object { $_.label }) -join ' '))" }
else { Fail 'analytics endpoint' 'GET analytics/runs returned no runs' }

Write-Host ''
Write-Host "$($script:Passed) passed, $($script:Failed) failed"
if ($script:Failed -gt 0) { foreach ($f in $script:Failures) { Write-Host "  failed: $f" }; exit 1 }
exit 0
