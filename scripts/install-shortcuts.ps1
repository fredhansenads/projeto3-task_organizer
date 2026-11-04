$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
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
