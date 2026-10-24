$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Push-Location $repo
try {
    bun test
    if ($LASTEXITCODE -ne 0) { throw 'Bun tests failed.' }
    bun run src/demo.ts
    if ($LASTEXITCODE -ne 0) { throw 'Demo failed.' }
} finally {
    Pop-Location
}
