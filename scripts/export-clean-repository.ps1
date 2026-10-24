[CmdletBinding()]
param([Parameter(Mandatory)][string]$Destination)

$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $PSScriptRoot
$destinationPath = [IO.Path]::GetFullPath($Destination)
$sourcePath = [IO.Path]::GetFullPath($source)
if ($destinationPath.StartsWith($sourcePath, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Destination must be outside the source repository.'
}
if (Test-Path -LiteralPath $destinationPath) {
    throw "Destination already exists: $destinationPath"
}

New-Item -ItemType Directory -Path $destinationPath | Out-Null
Get-ChildItem -LiteralPath $sourcePath -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\(\.git|node_modules|coverage|dist)\\' } |
    ForEach-Object {
        $relative = $_.FullName.Substring($sourcePath.Length).TrimStart('\')
        $target = Join-Path $destinationPath $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
        Copy-Item -LiteralPath $_.FullName -Destination $target
    }

& (Join-Path $destinationPath 'scripts\prepare-publication.ps1') -Commit
if ($LASTEXITCODE -ne 0) { throw 'Clean export failed.' }
Write-Host "Clean repository exported to $destinationPath"
