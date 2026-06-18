param([switch]$Build, [switch]$Help)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($Help) {
	Write-Host @"

  MoonCode Kurulumu

  KULLANIM:
    powershell -ExecutionPolicy Bypass -File install.ps1

  Bu script:
    1. Node.js kontrolu (v20+ gerekli)
    2. Bagimliliklari yukler (npm install)
    3. Projeyi derler (npm run build)
    4. mooncode komutunu global kurar (npm install -g)
    5. Dogrulama yapar

  Not: Yonetici olarak calistirmaniz gerekmeyebilir.
       npm global kurulumu icin yonetici yetkisi gerekebilir.

"@
	exit
}

Write-Host "`n  MoonCode Kurulumu Basliyor...`n" -ForegroundColor Cyan

# 1. Node.js kontrol
try {
	$nodeVer = node -v
	$verNum = [int]($nodeVer -replace '[v.]','' -replace '(\d{2}).*','' -replace '\.\d+$','')
	if ($verNum -lt 20) { throw "Node.js v20+ gerekli, mevcut: $nodeVer" }
	Write-Host "  [OK] Node.js $nodeVer" -ForegroundColor Green
} catch {
	Write-Host "  [FAIL] Node.js bulunamadi veya cok eski!" -ForegroundColor Red
	Write-Host "  https://nodejs.org (v20+ indirin)"
	exit 1
}

# 2. CLI paketine git
$cliDir = Join-Path $ROOT "packages\cli"
if (!(Test-Path $cliDir)) {
	Write-Host "  [FAIL] packages\cli bulunamadi!" -ForegroundColor Red
	exit 1
}
Set-Location $cliDir

# 3. Bagimliliklari yukle
Write-Host "  [..] npm install yukleniyor..." -NoNewline -ForegroundColor Yellow
try {
	npm install --silent 2>&1 | Out-Null
	Write-Host "`r  [OK] npm install tamam" -ForegroundColor Green
} catch {
	Write-Host "`r  [FAIL] npm install basarisiz!" -ForegroundColor Red
	exit 1
}

# 4. Derle
Write-Host "  [..] Derleniyor (npm run build)..." -NoNewline -ForegroundColor Yellow
try {
	npm run build 2>&1 | Out-Null
	Write-Host "`r  [OK] Derleme tamam" -ForegroundColor Green
} catch {
	Write-Host "`r  [FAIL] Derleme basarisiz!" -ForegroundColor Red
	exit 1
}

# 5. Global kur
Write-Host "  [..] Global kurulum (npm install -g)..." -NoNewline -ForegroundColor Yellow
try {
	npm install -g . 2>&1 | Out-Null
	Write-Host "`r  [OK] Global kurulum tamam" -ForegroundColor Green
} catch {
	Write-Host "`r  [FAIL] Global kurulum basarisiz!" -ForegroundColor Red
	Write-Host "  Yonetici olarak calistirmayi deneyin." -ForegroundColor Yellow
	exit 1
}

# 6. Dogrula
try {
	$ver = mooncode --version 2>$null
	if ($LASTEXITCODE -eq 0) {
		Write-Host "  [OK] mooncode $ver kullanima hazir!" -ForegroundColor Green
	} else {
		throw "versiyon alinamadi"
	}
} catch {
	Write-Host "  [!] Kurulum tamam ama PATH'te mooncode bulunamadi." -ForegroundColor Yellow
	Write-Host "  Terminali kapatip acin veya PATH'i kontrol edin." -ForegroundColor Yellow
}

Write-Host @"

  KULLANIM:
    mooncode                    # CLI modu
    mooncode --web              # Web UI modu
    mooncode --help             # Yardim

  NOT: Her kod degisikliginden sonra:
    cd packages\cli
    npm run build
    npm install -g .

  VEYA sadece:
    powershell -ExecutionPolicy Bypass -File install.ps1

"@ -ForegroundColor Cyan
