[CmdletBinding()]
param(
    [ValidateSet('Start', 'Stop', 'Status')]
    [string]$Action = 'Start',
    [switch]$Background
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$airPath = Join-Path $projectRoot '.tools\bin\air.exe'
$runtimeDirectory = Join-Path $projectRoot '.cache\air'
$statePath = Join-Path $runtimeDirectory 'watcher.json'
$stdoutPath = Join-Path $runtimeDirectory 'watcher.stdout.log'
$stderrPath = Join-Path $runtimeDirectory 'watcher.stderr.log'

function Get-OwnedWatcher {
    if (-not (Test-Path -LiteralPath $statePath)) { return $null }
    $saved = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $watcher = Get-Process -Id $saved.ProcessId -ErrorAction SilentlyContinue
    if ($null -eq $watcher) { return $null }
    # PID 可能被系统复用；路径与启动时间都一致，才认定是此脚本的进程。
    if ($watcher.Path -ne $airPath -or $watcher.StartTime.ToUniversalTime().Ticks.ToString() -ne $saved.StartTicks) {
        throw 'Watcher identity changed. Refusing to manage an unrelated process.'
    }
    return $watcher
}

$existingWatcher = Get-OwnedWatcher
if ($Action -eq 'Status') {
    [pscustomobject]@{ Running = ($null -ne $existingWatcher); ProcessId = $(if ($existingWatcher) { $existingWatcher.Id } else { $null }); Log = $stdoutPath }
    return
}
if ($Action -eq 'Stop') {
    if ($existingWatcher) {
        # Windows 上 Air 的构建命令还包含子进程。仅终止已核验的 Air 进程树，
        # 不按端口或进程名称批量结束其他 Go 服务。
        & taskkill.exe /PID $existingWatcher.Id /T /F
        if ($LASTEXITCODE -ne 0) { throw 'Unable to stop the Air process tree.' }
    } else { Write-Host 'No managed Air watcher is running.' }
    return
}
if ($existingWatcher) { Write-Host "Air is already running (PID $($existingWatcher.Id)). Log: $stdoutPath"; return }
if (-not (Test-Path -LiteralPath $airPath)) {
    throw 'Air is not installed. Set GOBIN to this project''s .tools\bin, then run: go install github.com/air-verse/air@latest'
}

$goCommand = Get-Command go.exe -ErrorAction SilentlyContinue
$goPath = if ($goCommand) { $goCommand.Source } else { 'C:\Program Files\Go\bin\go.exe' }
if (-not (Test-Path -LiteralPath $goPath)) { throw 'Go is not installed or cannot be found.' }

# 仅读取 host/port，避免打印配置中的密钥。已有后端占用端口时先明确报错，
# 不静默结束用户通过其他终端启动的程序。
$configPath = if ($env:NEUROFLOW_CONFIG_FILE) { $env:NEUROFLOW_CONFIG_FILE } else { Join-Path $projectRoot 'config\config.json' }
$localConfig = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$serverPort = if ($localConfig.server.port) { [int]$localConfig.server.port } else { 8819 }
$serverHost = if ($localConfig.server.host -and $localConfig.server.host -ne '0.0.0.0') { $localConfig.server.host } else { '127.0.0.1' }
$socket = New-Object System.Net.Sockets.TcpClient
$occupied = $false
try {
    $connecting = $socket.BeginConnect($serverHost, $serverPort, $null, $null)
    if ($connecting.AsyncWaitHandle.WaitOne(700)) { try { $socket.EndConnect($connecting); $occupied = $true } catch {} }
} finally { $socket.Dispose() }
if ($occupied) { throw "Port $serverPort already has a listener. Stop the existing backend before starting Air." }

New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
$originalPath = $env:PATH
$originalCache = $env:GOCACHE
try {
    $env:PATH = (Split-Path -Parent $goPath) + ';' + $env:PATH
    $env:GOCACHE = Join-Path $projectRoot '.tmp-go-cache'
    if ($Background) {
        # 后台运行保留日志；不弹出多余控制台窗口。以后可用 -Action Stop 结束。
        $watcher = Start-Process -FilePath $airPath -ArgumentList '-c', '.air.toml' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
        @{ ProcessId = $watcher.Id; StartTicks = $watcher.StartTime.ToUniversalTime().Ticks.ToString() } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
        Write-Host "Air started (PID $($watcher.Id)). Building backend; inspect $stdoutPath for readiness."
    } else {
        Write-Host 'Watching Go source. Save changes to rebuild; Ctrl+C stops Air and its backend.'
        Push-Location $projectRoot
        try { & $airPath -c .air.toml } finally { Pop-Location }
    }
} finally {
    $env:PATH = $originalPath
    $env:GOCACHE = $originalCache
}
