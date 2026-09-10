$ErrorActionPreference = 'Stop'
$previousMirror = $env:ELECTRON_MIRROR
Push-Location (Join-Path $PSScriptRoot '..')
try {
    # Keep TLS verification enabled. Only use the mirror for this install.
    $env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
    npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw "Electron installation failed (exit $LASTEXITCODE)." }
} finally {
    $env:ELECTRON_MIRROR = $previousMirror
    Pop-Location
}
