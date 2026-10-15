# =============================================================================
#  env-secrets.ps1 - Windows version of env-secrets.sh, called by update.bat
#  and factory\reset.bat. Makes sure docker\.env holds every key, password,
#  and seeded credential the Compose stack requires (compose.yaml has no
#  defaults for them, and the server refuses its public built-in defaults).
#
#  Missing values are generated with random content and appended to .env
#  (created from .env.example when absent). Existing values are never changed
#  and never printed. A value set in the environment counts as present.
#
#  Values bound to existing data (the database password, master key,
#  administrator password, and seeded credentials with the Postgres volume;
#  the Grafana password with the Grafana volume) are not generated while that
#  volume exists: the script stops and names them instead.
#
#  Usage:   powershell -NoProfile -ExecutionPolicy Bypass -File env-secrets.ps1 [-Fresh]
#  Exit code 0 when .env is complete, 1 when values must be set by hand.
# =============================================================================
param([switch]$Fresh)

$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '.env'

function New-RandomText([int]$length) {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    $bytes = New-Object byte[] ($length * 2)
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $text = New-Object System.Text.StringBuilder
    foreach ($b in $bytes) {
        if ($b -lt 248) { [void]$text.Append($alphabet[$b % 62]) }
        if ($text.Length -ge $length) { break }
    }
    if ($text.Length -lt $length) { return (New-RandomText $length) }
    return $text.ToString()
}

function New-MasterKey {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Get-Current([string]$name) {
    $value = [Environment]::GetEnvironmentVariable($name)
    if ([string]::IsNullOrEmpty($value) -and (Test-Path $envFile)) {
        $line = Get-Content $envFile | Where-Object { $_ -match "^$name=" } | Select-Object -Last 1
        if ($line) { $value = ($line -replace "^$name=", '').Trim().Trim('"').Trim("'") }
    }
    return $value
}

function Test-Volume([string]$name) {
    docker volume inspect "garrison_$name" *> $null
    return ($LASTEXITCODE -eq 0)
}

if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $PSScriptRoot '.env.example') $envFile
    Write-Host "Created $envFile from .env.example."
}

$databaseBound = $false
$grafanaBound = $false
if (-not $Fresh) {
    $databaseBound = Test-Volume 'garrison-postgres-data'
    $grafanaBound = Test-Volume 'garrison-grafana-data'
}

$missing = @()
$generated = @()
$adminPassword = $null

function Confirm-Value([string]$name, [string]$value, [bool]$bound, [string]$hint) {
    if (-not [string]::IsNullOrEmpty((Get-Current $name))) { return }
    if ($bound) { $script:missing += "  ${name}: $hint"; return }
    $content = Get-Content -Raw $envFile
    $prefix = if ($content -and -not $content.EndsWith("`n")) { "`r`n" } else { '' }
    Add-Content -Path $envFile -Value ($prefix + "$name=$value") -NoNewline:$false
    $script:generated += $name
    if ($name -eq 'GARRISON_ADMIN_PASSWORD') { $script:adminPassword = $value }
}

Confirm-Value 'GARRISON_DB_PASSWORD' (New-RandomText 32) $databaseBound 'the password the Postgres volume was created with (stacks created before keys were required used: garrison)'
Confirm-Value 'GARRISON_MASTER_KEY' (New-MasterKey) $databaseBound 'the value the database was created with; a different key makes stored secrets unreadable'
Confirm-Value 'GARRISON_ADMIN_PASSWORD' (New-RandomText 20) $databaseBound 'the administrator password the database was seeded with'
Confirm-Value 'GARRISON_DEFAULT_ACCESS_KEY' ('access_' + (New-RandomText 32)) $databaseBound "the seeded default credential's access key"
Confirm-Value 'GARRISON_DEFAULT_SECRET_KEY' ('secret_' + (New-RandomText 48)) $databaseBound "the seeded default credential's secret key"
Confirm-Value 'GARRISON_NODE_ACCESS_KEY' ('access_' + (New-RandomText 32)) $databaseBound "the seeded worker node credential's access key"
Confirm-Value 'GARRISON_NODE_SECRET_KEY' ('secret_' + (New-RandomText 48)) $databaseBound "the seeded worker node credential's secret key"
Confirm-Value 'GARRISON_AUTH_SIGNING_KEY' (New-RandomText 48) $false ''
Confirm-Value 'GARRISON_ADMIN_API_KEY' (New-RandomText 40) $false ''
Confirm-Value 'GARRISON_GRAFANA_PASSWORD' (New-RandomText 20) $grafanaBound 'the password Grafana was created with (stacks created before keys were required used: password)'

# Values left on the public built-in defaults: the server refuses to start with them (SR-08).
$publicDefaults = [ordered]@{
    'GARRISON_MASTER_KEY' = 'garrison-default-master-key-override-me'
    'GARRISON_AUTH_SIGNING_KEY' = 'garrison-default-signing-key-override-me'
    'GARRISON_ADMIN_API_KEY' = 'garrisonadmin'
    'GARRISON_ADMIN_PASSWORD' = 'password'
    'GARRISON_DEFAULT_SECRET_KEY' = 'secret_garrison_default_change_me'
    'GARRISON_NODE_SECRET_KEY' = 'secret_garrison_node_change_me'
}
$defaults = @()
foreach ($entry in $publicDefaults.GetEnumerator()) {
    if ((Get-Current $entry.Key) -ceq $entry.Value) { $defaults += "  $($entry.Key)" }
}

if ($generated.Count -gt 0) { Write-Host ("Generated random values in $envFile for: " + ($generated -join ' ')) }
if ($adminPassword) { Write-Host "  Dashboard sign-in: tenant default, admin@garrison, password $adminPassword (also in .env as GARRISON_ADMIN_PASSWORD)" }
if ($missing.Count -gt 0) {
    Write-Host "These values are missing from $envFile, and existing data depends on them, so they were not generated:"
    $missing | ForEach-Object { Write-Host $_ }
    Write-Host "Add them to $envFile and run this again, or run factory\reset.bat to delete all data and start over with new values."
    exit 1
}
if ($defaults.Count -gt 0) {
    Write-Host "These values in $envFile are the public built-in defaults, which the server refuses to start with (SR-08):"
    $defaults | ForEach-Object { Write-Host $_ }
    Write-Host 'Set new values. The signing key and the admin API key can change at any time. The administrator password and the'
    Write-Host 'seeded credentials are fixed in the database at its first start: change them through the dashboard or API, then'
    Write-Host 'here. The master key encrypts stored secrets: run factory\reset.bat to start over with a new one.'
    exit 1
}
exit 0
