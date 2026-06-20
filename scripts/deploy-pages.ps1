# Skrip deploy ke GitHub Pages branch gh-pages.
# Jalankan dari root project: pwsh ./scripts/deploy-pages.ps1
# Auto-load Supabase env dari secrets file kalau tidak diset via param atau env.
param(
  [string]$SupabaseUrl = $env:VITE_SUPABASE_URL,
  [string]$SupabaseAnon = $env:VITE_SUPABASE_ANON_KEY
)

$secretsFile = Join-Path $env:USERPROFILE ".openclaw\secrets\kbc-supabase.env"
if ($secretsFile -and (Test-Path $secretsFile)) {
  Get-Content $secretsFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
      $k, $v = $matches[1], $matches[2]
      if (-not (Get-Item -Path "env:$k" -ErrorAction SilentlyContinue)) {
        Set-Item -Path "env:$k" -Value $v
      }
    }
  }
  if (-not $SupabaseUrl)  { $SupabaseUrl  = $env:VITE_SUPABASE_URL  }
  if (-not $SupabaseAnon) { $SupabaseAnon = $env:VITE_SUPABASE_ANON_KEY }
}

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot/.."
Set-Location $root

Write-Host "==> Build production..." -ForegroundColor Cyan
$env:VITE_BASE = "/kbc-pendampingan-piloting/"
if ($SupabaseUrl) { $env:VITE_SUPABASE_URL = $SupabaseUrl }
if ($SupabaseAnon) { $env:VITE_SUPABASE_ANON_KEY = $SupabaseAnon }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build gagal" }

Write-Host "==> Siapkan dist..." -ForegroundColor Cyan
Copy-Item dist/index.html dist/404.html -Force
New-Item -Path dist/.nojekyll -ItemType File -Force | Out-Null

# Copy data directory (codes.json dll) ke dist
$dataDir = Join-Path $root "data"
if (Test-Path $dataDir) {
  New-Item -Path dist/data -ItemType Directory -Force | Out-Null
  Copy-Item -Recurse -Path "$dataDir/*" -Destination dist/data -Force
}

Write-Host "==> Push ke gh-pages..." -ForegroundColor Cyan
$tmpDir = Join-Path $env:TEMP "kbc-pages-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $tmpDir | Out-Null
Copy-Item -Recurse -Path "dist/*" -Destination $tmpDir
Push-Location $tmpDir
git init -q -b gh-pages
git -c user.email=subariyantoss05@gmail.com -c user.name=Subariyanto add -A
git -c user.email=subariyantoss05@gmail.com -c user.name=Subariyanto commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -q
git push --force https://github.com/Subariyanto/kbc-pendampingan-piloting.git gh-pages:gh-pages
Pop-Location
Remove-Item -Recurse -Force $tmpDir

Write-Host "✅ Deploy selesai. Cek https://subariyanto.github.io/kbc-pendampingan-piloting/" -ForegroundColor Green
