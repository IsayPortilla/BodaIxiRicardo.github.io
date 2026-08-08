# Opcional: copia de respaldo local del Google Sheet.
# La invitación lee el Excel en vivo desde la web; este JSON solo se usa si falla la red.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/actualizar-invitados.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "data\invitados.json"
$url = "https://opensheet.elk.sh/1acN7pMqKXQIa6km4ka4mMbBG36K4XEOxfmqIRGG7XKQ/Hoja%201"

New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null
Write-Host "Descargando invitados..."
Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
$len = (Get-Item $out).Length
Write-Host "Listo: data/invitados.json ($len bytes)"
Write-Host "Sube este archivo a GitHub para que el sitio público use la lista actualizada."
