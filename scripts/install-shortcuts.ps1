param([string]$NodeExecutable)
$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$runtimePath = Join-Path $projectPath '.notebook\runtime'
$localNode = Join-Path $runtimePath 'node.exe'
if (-not $NodeExecutable) {
    if (Test-Path -LiteralPath $localNode) { $NodeExecutable = $localNode }
    else {
        $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
        if ($nodeCommand) { $NodeExecutable = $nodeCommand.Source }
    }
}
if (-not $NodeExecutable -or -not (Test-Path -LiteralPath $NodeExecutable -PathType Leaf)) {
    throw 'Informe uma instalacao Node.js com -NodeExecutable "C:\caminho\node.exe".'
}
$NodeExecutable = (Resolve-Path -LiteralPath $NodeExecutable).Path
$nodeVersion = & $NodeExecutable --version
if ($LASTEXITCODE -ne 0 -or [version]($nodeVersion.TrimStart('v')) -lt [version]'22.12.0') {
    throw 'O sistema precisa de Node.js 22.12 ou superior.'
}
New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
if ($NodeExecutable -ne $localNode) {
    Copy-Item -LiteralPath $NodeExecutable -Destination $localNode -Force
}
Write-Output 'Node.js preparado na pasta privada do projeto.'
$desktopPath = [Environment]::GetFolderPath('Desktop')
$shortcutShell = New-Object -ComObject WScript.Shell
foreach ($item in @(
    @{ Name = 'Minha Rotina Escolar'; Target = 'Iniciar sistema.cmd' },
    @{ Name = 'Backup - Minha Rotina Escolar'; Target = 'Fazer backup.cmd' },
    @{ Name = 'Encerrar - Minha Rotina Escolar'; Target = 'Encerrar sistema.cmd' }
)) {
    $linkPath = Join-Path $desktopPath ($item.Name + '.lnk')
    if (Test-Path -LiteralPath $linkPath) {
        $existing = $shortcutShell.CreateShortcut($linkPath)
        if ($existing.TargetPath -ne (Join-Path $projectPath $item.Target)) {
            throw "Ja existe um atalho diferente em $linkPath. Ele foi preservado."
        }
    }
    $shortcut = $shortcutShell.CreateShortcut($linkPath)
    $shortcut.TargetPath = Join-Path $projectPath $item.Target
    $shortcut.WorkingDirectory = $projectPath
    $shortcut.Description = $item.Name
    $shortcut.Save()
    Write-Output "Atalho preparado: $linkPath"
}
