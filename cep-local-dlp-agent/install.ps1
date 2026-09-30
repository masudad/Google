# CEP Local DLP Agent — One-Line BYOD Installer for Windows PowerShell
# Usage:
#   irm https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/install.ps1 | iex

$ErrorActionPreference = "Stop"

$RepoRawBase = "https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/dist"
$InstallDir = Join-Path $HOME ".cep-local-dlp-agent\bin"
$TargetBin = Join-Path $InstallDir "cep-dlp-agent.exe"

$Arch = $env:PROCESSOR_ARCHITECTURE
if ($Arch -eq "ARM64") {
    $BinName = "cep-dlp-agent-windows-arm64.exe"
} else {
    $BinName = "cep-dlp-agent-windows-amd64.exe"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " CEP Local DLP Agent — BYOD ワンステップ・インストーラー (Windows)" -ForegroundColor Cyan
Write-Host " 検出環境: Windows ($Arch) -> $BinName"
Write-Host "============================================================" -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

if (Test-Path ".\dist\$BinName") {
    Write-Host "[1/3] ローカルの .\dist\$BinName をコピーしています..."
    Copy-Item ".\dist\$BinName" $TargetBin -Force
} elseif (Test-Path ".\cep-local-dlp-agent\dist\$BinName") {
    Write-Host "[1/3] ローカルの .\cep-local-dlp-agent\dist\$BinName をコピーしています..."
    Copy-Item ".\cep-local-dlp-agent\dist\$BinName" $TargetBin -Force
} else {
    Write-Host "[1/3] GitHub から最新バイナリ ($BinName) をダウンロードしています..."
    Invoke-WebRequest -Uri "$RepoRawBase/$BinName" -OutFile $TargetBin -UseBasicParsing
}

Unblock-File -Path $TargetBin -ErrorAction SilentlyContinue

Write-Host "[2/3] 自動起動および cep-dlp:// スキームを登録し、バックグラウンド起動しています..."
& $TargetBin install

Write-Host "[3/3] ローカルエージェント (http://127.0.0.1:8843/healthz) の起動を確認中..."
for ($i = 0; $i -lt 10; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:8843/healthz" -TimeoutSec 1
        if ($resp.ok) {
            Write-Host ""
            Write-Host "✅ セットアップ完了！CEP Local DLP Agent が稼働中です (http://127.0.0.1:8843)" -ForegroundColor Green
            Write-Host "   Chrome 拡張機能の画面は自動的に「保護有効 (ON)」へ切り替わります。"
            return
        }
    } catch {}
    Start-Sleep -Milliseconds 500
}

Write-Host "⚠️ インストールは完了しました。Chrome 拡張機能の「今すぐ再確認」を押してください。" -ForegroundColor Yellow
