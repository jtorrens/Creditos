$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$desktop = Join-Path $repo "apps\desktop"
$dbPath = Join-Path $repo "data\creditos.db"

Write-Host "=== Actualizando repositorio ==="
Set-Location $repo
$currentBranch = (git branch --show-current).Trim()
if ($currentBranch -ne "main") {
    throw "Este actualizador solo puede ejecutarse desde la rama main. Rama actual: $currentBranch"
}
git pull

Write-Host "=== Configurando DB compartida ==="
$env:CREDITOS_APP_CHANNEL = "main"
$env:CREDITOS_DB_PATH = $dbPath
[Environment]::SetEnvironmentVariable("CREDITOS_APP_CHANNEL", "main", "User")
[Environment]::SetEnvironmentVariable("CREDITOS_DB_PATH", $dbPath, "User")
Write-Host "CREDITOS_APP_CHANNEL=main"
Write-Host "CREDITOS_DB_PATH=$dbPath"

Write-Host "=== Instalando/actualizando dependencias ==="
Set-Location $desktop
npm install

Write-Host "=== Generando instalador Windows ==="
npm run dist

Write-Host ""
Write-Host "=== Build terminado ==="
Write-Host "Busca el instalador en:"
Write-Host (Join-Path $desktop "dist")
