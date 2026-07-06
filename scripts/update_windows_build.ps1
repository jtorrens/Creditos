$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$desktop = Join-Path $repo "apps\desktop"
$dbPath = Join-Path $repo "data\creditos-refactor.db"

Write-Host "=== Actualizando repositorio ==="
Set-Location $repo
git pull

Write-Host "=== Configurando DB compartida ==="
$env:CREDITOS_APP_CHANNEL = "refactor"
$env:CREDITOS_DB_PATH = $dbPath
[Environment]::SetEnvironmentVariable("CREDITOS_APP_CHANNEL", "refactor", "User")
[Environment]::SetEnvironmentVariable("CREDITOS_DB_PATH", $dbPath, "User")
Write-Host "CREDITOS_APP_CHANNEL=refactor"
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
