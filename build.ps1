# Empaqueta la extensión para subirla a la Chrome Web Store / Edge Add-ons.
# Uso:  powershell -File build.ps1   ->  dist\image-zip-collector-<versión>.zip
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$version = (Get-Content manifest.json -Raw | ConvertFrom-Json).version
$include = @("manifest.json", "background.js", "content.js", "content.css", "offscreen.html", "offscreen.js",
             "popup.html", "popup.js", "zip.js", "icons", "_locales")

New-Item -ItemType Directory -Force dist | Out-Null
$out = "dist\image-zip-collector-$version.zip"
if (Test-Path $out) { Remove-Item $out }
Compress-Archive -Path $include -DestinationPath $out
Write-Host "Paquete listo: $out"
