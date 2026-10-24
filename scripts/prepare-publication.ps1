[CmdletBinding()]
param([switch]$Commit)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$blocked = '(?i)(senha\s*=|password\s*=|secret\s*=|token\s*=|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|C:\\Users\\eduso)'
$hits = Get-ChildItem -LiteralPath $repo -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\(\.git|node_modules|coverage|dist)\\' } |
    Select-String -Pattern $blocked
if ($hits) {
    $hits | Format-Table Path,LineNumber,Line -AutoSize
    throw 'Publication blocked: review sensitive or machine-specific content.'
}

& (Join-Path $PSScriptRoot 'test.ps1')
if ($Commit) {
    if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
        git -C $repo init -b main
    }
    git -C $repo add .
    git -C $repo diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw 'Git whitespace validation failed.' }
    git -C $repo commit -m 'feat: extract recycling operations domain rules'
    if ($LASTEXITCODE -ne 0) { throw 'Git commit failed.' }
}
