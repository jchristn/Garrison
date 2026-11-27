# Runs the gerbil keeper example (examples/autonomous/gerbil) end to end against a running Garrison server and worker
# (AA12.3). The same checks as run-autonomy-example.sh; run-autonomy-example.bat calls this script.
#
# With the fake variant (the default) it plays walkthrough 11.1 one tick at a time: healthy (Quiet, the interval
# doubles), down (Attention, the interval resets), still-down (a non-blocking escalation to the on-call role), and
# answered (the answer "wait" wakes the keeper, which records it in memory). With -Variant claude-code it applies the
# Claude Code deployment, wakes the keeper once, and reports how the tick ended.
#
# Parameters default to GARRISON_URL, GARRISON_TENANT, GARRISON_TOKEN, GARRISON_EMAIL, GARRISON_PASSWORD,
# GARRISON_VARIANT, and GARRISON_WAIT, else http://127.0.0.1:8700, default, no token, admin@garrison, no password,
# fake, and 120 seconds. A password or a token is required. -Cleanup deletes the gerbil-keeper mandate at the end.
param(
    [string]$Url = $(if ($env:GARRISON_URL) { $env:GARRISON_URL } else { "http://127.0.0.1:8700" }),
    [string]$Tenant = $(if ($env:GARRISON_TENANT) { $env:GARRISON_TENANT } else { "default" }),
    [string]$Token = $env:GARRISON_TOKEN,
    [string]$Email = $(if ($env:GARRISON_EMAIL) { $env:GARRISON_EMAIL } else { "admin@garrison" }),
    [string]$Password = $env:GARRISON_PASSWORD,
    [ValidateSet("fake", "claude-code")][string]$Variant = $(if ($env:GARRISON_VARIANT) { $env:GARRISON_VARIANT } else { "fake" }),
    [int]$Wait = $(if ($env:GARRISON_WAIT) { [int]$env:GARRISON_WAIT } else { 120 }),
    [switch]$Cleanup
)

$ErrorActionPreference = "Stop"
$Example = Join-Path (Split-Path -Parent $PSScriptRoot) "examples/autonomous/gerbil"
$Url = $Url.TrimEnd("/")
$Api = "$Url/v1.0/api/tenants/$Tenant"
$script:Passed = 0
$script:Failed = 0
$script:Warned = 0

function Pass([string]$Name) { $script:Passed++; Write-Host "PASS  $Name" }
function Fail([string]$Name, [string]$Detail) { $script:Failed++; Write-Host "FAIL  $Name"; Write-Host "      $Detail" }
function Warn([string]$Name, [string]$Detail) { $script:Warned++; Write-Host "WARN  $Name"; Write-Host "      $Detail" }
function Info([string]$Text) { Write-Host "      $Text" }

function Invoke-Api([string]$Method, [string]$Path, $Body = $null) {
    $headers = @{ Authorization = "Bearer $script:Token" }
    if ($null -ne $Body) {
        return Invoke-RestMethod -Method $Method -Uri "$Api$Path" -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10) -TimeoutSec 60
    }
    return Invoke-RestMethod -Method $Method -Uri "$Api$Path" -Headers $headers -TimeoutSec 60
}

function Invoke-Apply([string[]]$Files) {
    $text = ($Files | ForEach-Object { Get-Content -Raw -Path (Join-Path $Example $_) }) -join "`n---`n"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    return Invoke-RestMethod -Method Post -Uri "$Api/manifests/apply" -Headers @{ Authorization = "Bearer $script:Token" } -ContentType "application/yaml" -Body $bytes -TimeoutSec 60
}

function Test-Applied($Result, [string]$Name) {
    if ($Result.failedCount -eq 0) {
        Pass $Name
        Info (($Result.items | ForEach-Object { "$($_.kind)/$($_.name) $($_.result)" }) -join ", ")
        return $true
    }
    Fail $Name (($Result.items | Where-Object { $_.result -eq "Failed" } | ForEach-Object { "$($_.kind)/$($_.name): $($_.message)" }) -join "; ")
    return $false
}

function Get-TickIds { return @((Invoke-Api Get "/mandates/$script:Mandate/ticks?maxResults=100").objects | ForEach-Object { $_.id }) }

function Wait-Tick([string[]]$Known) {
    $deadline = (Get-Date).AddSeconds($Wait)
    while ((Get-Date) -lt $deadline) {
        $page = Invoke-Api Get "/mandates/$script:Mandate/ticks?maxResults=100"
        foreach ($tick in $page.objects) {
            if ($Known -contains $tick.id) { continue }
            if ($tick.finishedUtc) { return $tick }
        }
        Start-Sleep -Seconds 2
    }
    return $null
}

function Invoke-Wake { Invoke-Api Post "/mandates/$script:Mandate/wake" | Out-Null }

function Get-Interval { return [int](Invoke-Api Get "/mandates/$script:Mandate").currentIntervalSeconds }

function Test-Memory([string]$Key, $Tick, [string]$Name) {
    $entries = Invoke-Api Get "/memory/entries?scopeKind=Agent&scopeId=$script:Agent&maxResults=100"
    $entry = $entries.objects | Where-Object { $_.key -eq $Key } | Select-Object -First 1
    if ($entry -and $entry.writerRunId -eq $Tick.runId) { Pass $Name }
    else { Warn $Name "no memory entry $Key written by this tick; is agent memory on (GARRISON_AGENT_MEMORY_ENABLE=true)?" }
}

function Invoke-Step([string]$Scenario, [string]$Outcome, [string]$Name) {
    if (-not (Test-Applied (Invoke-Apply @("scenarios/$Scenario.yaml")) "apply scenario $Scenario")) { return $null }
    $known = Get-TickIds
    Invoke-Wake
    $tick = Wait-Tick $known
    if ($null -eq $tick) { Fail $Name "no tick finished within $Wait seconds"; return $null }
    if ($tick.outcome -eq $Outcome) { Pass $Name; Info "tick $($tick.id) woke by $($tick.wakeSource): $($tick.summary)"; return $tick }
    Fail $Name "outcome $($tick.outcome), expected ${Outcome}: $($tick.errorCode) $($tick.errorMessage) $($tick.summary)"
    return $null
}

Write-Host "Gerbil keeper example ($Variant)"
Write-Host "  REST   $Url"
Write-Host "  tenant $Tenant"
Write-Host ""

# --- Server and sign-in -------------------------------------------------------
try { $health = Invoke-RestMethod -Uri "$Url/v1.0/api/health" -TimeoutSec 10 } catch { $health = $null }
if ($health -and $health.status -eq "healthy") { Pass "server health" } else { Fail "server health" "GET $Url/v1.0/api/health did not answer healthy. Is the server running?"; exit 1 }

if (-not $Token) {
    if (-not $Password) { Write-Error "Set GARRISON_TOKEN, or GARRISON_PASSWORD (or -Password) to sign in as $Email."; exit 2 }
    $login = @{ email = $Email; password = $Password; tenantId = $Tenant } | ConvertTo-Json
    try { $script:Token = (Invoke-RestMethod -Method Post -Uri "$Url/v1.0/token" -ContentType "application/json" -Body $login -TimeoutSec 10).token } catch { $script:Token = $null }
    if ($script:Token) { Pass "sign in as $Email" } else { Fail "sign in as $Email" "POST /v1.0/token returned no token"; exit 1 }
} else {
    $script:Token = $Token
}

$nodes = @((Invoke-RestMethod -Uri "$Url/v1.0/api/nodes" -Headers @{ Authorization = "Bearer $script:Token" } -TimeoutSec 10).objects | Where-Object { $_.status -eq "Ready" }).Count
if ($nodes -ge 1) { Pass "workers ready ($nodes)" } else { Fail "workers ready" "no worker reports Ready; ticks would stay queued"; exit 1 }

# --- Apply ----------------------------------------------------------------------
if ($Variant -eq "fake") { $result = Invoke-Apply @("gerbil.yaml", "fake-harness.yaml", "scenarios/healthy.yaml") }
else { $result = Invoke-Apply @("gerbil.yaml", "claude-code.yaml") }
if (-not (Test-Applied $result "apply the gerbil ($Variant)")) { exit 1 }
$mandateJson = Invoke-Api Get "/mandates/gerbil-keeper"
$script:Mandate = $mandateJson.id
$script:Agent = $mandateJson.agentId
Info "mandate $script:Mandate, status $($mandateJson.status), next wake $($mandateJson.nextWakeUtc)"
$created = @($result.items | Where-Object { $_.kind -eq "Mandate" -and $_.result -eq "Created" }).Count -gt 0
if ($mandateJson.status -eq "Paused") { Invoke-Api Post "/mandates/$script:Mandate/resume" | Out-Null; $created = $true }

# --- Ticks ----------------------------------------------------------------------
$known = Get-TickIds
# A new mandate's first wake is due now; an existing one needs a wake.
if (-not $created) { Invoke-Wake }
$first = Wait-Tick $known
if ($null -eq $first) { Fail "first tick" "no tick finished within $Wait seconds; is the leader sweeping and a worker leasing?"; exit 1 }

if ($Variant -eq "claude-code") {
    if (@("Quiet", "Acted", "Attention", "Escalated") -contains $first.outcome) { Pass "Claude Code tick reported $($first.outcome)"; Info $first.summary }
    else { Fail "Claude Code tick" "outcome $($first.outcome): $($first.errorCode) $($first.errorMessage) run $($first.runId)" }
} else {
    if ($first.outcome -eq "Quiet") { Pass "healthy tick completes Quiet"; Info "tick $($first.id): $($first.summary)" }
    else { Fail "healthy tick completes Quiet" "outcome $($first.outcome): $($first.errorCode) $($first.errorMessage)" }
    $interval = Get-Interval
    if ($interval -ge 1800) { Pass "a quiet tick backs off (interval $interval s)" } else { Fail "a quiet tick backs off" "interval $interval" }
    Test-Memory "last-seen-healthy" $first "the tick remembered last-seen-healthy"

    if (Invoke-Step "down" "Attention" "the first 503 completes Attention") {
        $interval = Get-Interval
        if ($interval -eq 900) { Pass "Attention snaps the interval back to 900 s" } else { Fail "Attention snaps the interval back" "interval $interval" }
    }

    $escalatedTick = Invoke-Step "still-down" "Escalated" "the second 503 escalates"
    if ($escalatedTick) {
        $escalation = (Invoke-Api Get "/escalations?mandateId=$script:Mandate&status=Open&maxResults=100").objects | Where-Object { $_.mandateTickId -eq $escalatedTick.id } | Select-Object -First 1
        if ($escalation) {
            Pass "a non-blocking escalation to the on-call role"
            Info "$($escalation.id) $($escalation.mode) $($escalation.severity) to $($escalation.targetKind) $($escalation.targetName): $($escalation.question)"
            Test-Applied (Invoke-Apply @("scenarios/answered.yaml")) "apply scenario answered" | Out-Null
            $known = Get-TickIds
            $answered = Invoke-Api Post "/escalations/$($escalation.id)/answer" @{ choice = "wait"; text = "The provider is on it. Keep watching." }
            if ($answered.status -eq "Answered") { Pass "answer the escalation: wait" } else { Fail "answer the escalation" "status $($answered.status)" }
            $tick = Wait-Tick $known
            if ($null -eq $tick) { Fail "the answer wakes the keeper" "no tick finished within $Wait seconds" }
            elseif ($tick.wakeSource -eq "EscalationAnswer" -and $tick.outcome -eq "Acted") {
                Pass "the answer wakes the keeper, which records it"; Info "tick $($tick.id): $($tick.summary)"
                Test-Memory "on-call-instruction" $tick "the instruction is in memory"
            }
            else { Fail "the answer wakes the keeper" "woke by $($tick.wakeSource), outcome $($tick.outcome): $($tick.summary)" }
        } else {
            Fail "a non-blocking escalation to the on-call role" "no open escalation from tick $($escalatedTick.id)"
        }
    }
}

# --- Cleanup --------------------------------------------------------------------
if ($Cleanup) {
    try {
        Invoke-RestMethod -Method Delete -Uri "$Api/mandates/$script:Mandate`?force=true" -Headers @{ Authorization = "Bearer $script:Token" } -TimeoutSec 30 | Out-Null
        Pass "delete the gerbil-keeper mandate"
    } catch { Fail "delete the gerbil-keeper mandate" $_.Exception.Message }
} else {
    Info "The keeper keeps ticking. Pause it with POST $Api/mandates/gerbil-keeper/pause, or rerun with -Cleanup."
}

Write-Host ""
Write-Host "$script:Passed passed, $script:Warned warned, $script:Failed failed"
if ($script:Failed -gt 0) { exit 1 }
exit 0
