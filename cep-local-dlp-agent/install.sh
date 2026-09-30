#!/bin/sh
# CEP Local DLP Agent — One-Line BYOD Installer for macOS & Linux
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/install.sh | sh

set -e

REPO_RAW_BASE="https://raw.githubusercontent.com/masudad/Google/main/cep-local-dlp-agent/dist"
INSTALL_DIR="$HOME/.cep-local-dlp-agent/bin"
TARGET_BIN="$INSTALL_DIR/cep-dlp-agent"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    if [ "$ARCH" = "arm64" ]; then
      BIN_NAME="cep-dlp-agent-darwin-arm64"
    else
      BIN_NAME="cep-dlp-agent-darwin-amd64"
    fi
    ;;
  Linux)
    BIN_NAME="cep-dlp-agent-linux-amd64"
    ;;
  *)
    echo "❌ Unsupported OS: $OS (Use install.ps1 on Windows PowerShell)"
    exit 1
    ;;
esac

echo "============================================================"
echo " CEP Local DLP Agent — BYOD ワンステップ・インストーラー"
echo " 検出環境: $OS ($ARCH) -> $BIN_NAME"
echo "============================================================"

mkdir -p "$INSTALL_DIR"

# もしカレントディレクトリに git pull 済みの dist/ バイナリがあればそれを使用し、なければ GitHub から直接取得
if [ -f "./dist/$BIN_NAME" ]; then
  echo "[1/3] ローカルの ./dist/$BIN_NAME をコピーしています..."
  cp "./dist/$BIN_NAME" "$TARGET_BIN"
elif [ -f "./cep-local-dlp-agent/dist/$BIN_NAME" ]; then
  echo "[1/3] ローカルの ./cep-local-dlp-agent/dist/$BIN_NAME をコピーしています..."
  cp "./cep-local-dlp-agent/dist/$BIN_NAME" "$TARGET_BIN"
else
  echo "[1/3] GitHub から最新バイナリ ($BIN_NAME) をダウンロードしています..."
  curl -fL --progress-bar "$REPO_RAW_BASE/$BIN_NAME" -o "$TARGET_BIN"
fi

chmod +x "$TARGET_BIN"
if [ "$OS" = "Darwin" ]; then
  xattr -cr "$TARGET_BIN" 2>/dev/null || true
fi

echo "[2/3] 自動起動および cep-dlp:// スキームを登録し、バックグラウンド起動しています..."
"$TARGET_BIN" install "$@"

echo "[3/3] ローカルエージェント (http://127.0.0.1:8843/healthz) の起動を確認中..."
i=0
while [ $i -lt 10 ]; do
  if curl -fsS "http://127.0.0.1:8843/healthz" >/dev/null 2>&1; then
    echo ""
    echo "✅ セットアップ完了！CEP Local DLP Agent が稼働中です (http://127.0.0.1:8843)"
    echo "   Chrome 拡張機能の画面は自動的に「保護有効 (ON)」へ切り替わります。"
    exit 0
  fi
  sleep 0.5
  i=$((i + 1))
done

echo "⚠️ インストールは完了しましたが、ヘルスチェック応答を待機中です。ログ: ~/.cep-local-dlp-agent/agent.log"
