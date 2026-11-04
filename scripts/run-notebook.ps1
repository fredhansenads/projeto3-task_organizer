param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('start', 'stop', 'backup', 'verify', 'restore-empty')]
    [string]$Action,
    [string]$BackupFolder,
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
try {
    $projectPath = Split-Path -Parent $PSScriptRoot
    Set-Location -LiteralPath $projectPath
    # Explorer can retain an old PATH. Use the installed paths for this process only.
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
        [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:Path
    $candidates = @(
        (Join-Path $projectPath '.notebook\runtime\node.exe'),
        (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe')
    )
    $installedNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($installedNode) { $candidates += $installedNode.Source }
    $nodeExecutable = $null
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $nodeExecutable = $candidate
            break
        }
    }
    if (-not $nodeExecutable) {
        throw 'Node.js nao encontrado. Reinstale os atalhos com scripts/install-shortcuts.ps1 ou instale Node.js 22.12 ou superior.'
    }
    $nodeVersion = & $nodeExecutable --version
    if ($LASTEXITCODE -ne 0 -or [version]($nodeVersion.TrimStart('v')) -lt [version]'22.12.0') {
        throw 'O sistema precisa de Node.js 22.12 ou superior.'
    }
    $env:Path = (Split-Path -Parent $nodeExecutable) + ';' + $env:Path
    $nodeArguments = @((Join-Path $PSScriptRoot 'notebook.mjs'), $Action)
    if ($BackupFolder) { $nodeArguments += $BackupFolder }
    if ($NoBrowser) { $nodeArguments += '--no-browser' }
    & $nodeExecutable @nodeArguments
    exit $LASTEXITCODE
} catch {
    Write-Host ('Nao foi possivel iniciar: ' + $_.Exception.Message)
    exit 1
}
