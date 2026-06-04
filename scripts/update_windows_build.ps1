$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$desktop = Join-Path $repo "apps\desktop"

Write-Host "=== Actualizando repositorio ==="
Set-Location $repo
git pull

Write-Host "=== Instalando/actualizando dependencias ==="
Set-Location $desktop
npm install

Write-Host "=== Generando instalador Windows ==="
npm run dist

Write-Host ""
Write-Host "=== Build terminado ==="
Write-Host "Busca el instalador en:"
Write-Host (Join-Path $desktop "dist")
