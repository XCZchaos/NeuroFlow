param(
    [string]$BackendUrl = "http://127.0.0.1:8819",
    [string]$KnowledgeRoot = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($KnowledgeRoot)) {
    $KnowledgeRoot = Join-Path $projectRoot "docs\knowledge"
}

try {
    Invoke-RestMethod -Uri "$BackendUrl/ping" -TimeoutSec 5 | Out-Null
} catch {
    throw "NeuroFlow backend is unavailable at $BackendUrl. Start Qdrant, Ollama, and the Go backend first."
}

$files = @(Get-ChildItem -LiteralPath $KnowledgeRoot -Recurse -File -Filter "*.md" | Where-Object { $_.Name -ne "README.md" -and -not $_.Name.StartsWith("_") })
if ($files.Count -eq 0) {
    throw "No indexable Markdown files were found under $KnowledgeRoot"
}

$completed = 0
foreach ($file in $files) {
    Write-Host "[$($completed + 1)/$($files.Count)] Indexing $($file.FullName)"
    # The upload endpoint stores a copy by filename. Prefix the relative path so files from
    # different providers (for example MNE and EEGLAB) cannot overwrite one another.
    $relativeName = $file.FullName.Substring($KnowledgeRoot.TrimEnd('\').Length + 1)
    $uploadName = $relativeName.Replace('\', '__').Replace('/', '__')
    & curl.exe --fail --silent --show-error -X POST -F "file=@$($file.FullName);filename=$uploadName" "$BackendUrl/upload" | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "Indexing failed: $($file.FullName)"
    }
    $completed++
}

Write-Host "Done: submitted $completed knowledge files. Each level-one heading becomes an atomic vector entry."
