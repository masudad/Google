# CEP Local DLP Agent (`cep-dlp-agent`)

Chrome Enterprise Premium (CEP) の DLP 検証サーバー（**WebProtect**: `https://safebrowsing.google.com/safebrowsing/uploads/scan`）をバックエンドの検査エンジンとして利用し、**デスクトップ版 AI アプリ / IDE（Cursor, Claude Desktop, VS Code 等）** および **一般ネイティブアプリ全般（Slack, Outlook, Teams 等）** に対して Chrome ブラウザと同一の DLP ルール・OCR・監査ログを適用する軽量ハイブリッドエージェントです。

## アーキテクチャの特徴

1. **Chrome 拡張機能不要・シングルバイナリ完結（macOS / Windows / Linux 対応）**:
   OS 上の Chrome Enterprise Core (CBCM) DM Token（Windows レジストリ、macOS `Chrome Cloud Enrollment`、Linux Enrollment ディレクトリ）および Chrome Profile メタデータを自動検出し、エージェントから直接 Scotty Multipart プロトコル（`ContentAnalysisRequest` / `ContentAnalysisResponse` Protobuf）で CEP サーバーへ問い合わせます。
2. **3層ハイブリッドフック（HTTP/HTTPS 以外の全プロトコル・ストレージにも対応）**:
   - **【第1層】OS クリップボード（テキスト ＆ ファイルコピー）＆ アクティブアプリ監視 (`pkg/oshook`)**: TLS 復号不要で、ネイティブアプリへの機密テキスト貼り付けやファイルコピー（Windows `CF_HDROP` / macOS `public.file-url`）を検知・遮断（`BLOCK` 時はクリップボードを即座に隔離し、貼り付け操作 `Ctrl+V` / `Cmd+V` 時に OS ネイティブ警告を表示）。Windows は `user32.dll` / `kernel32.dll` の Win32 API（`GetClipboardSequenceNumber`, `OpenClipboard`/`GetClipboardData`, `GetForegroundWindow`/`QueryFullProcessImageNameW`）を直接呼び出し、PowerShell 子プロセスを一切起動せずに 0.1ms 未満で監視。
   - **【第2層】マルチプロトコル・スマートプロキシ (`pkg/proxy`)**:
     - **HTTPS / HTTP**: Cursor 等のソースコード自動送信、ネイティブアプリからのファイルアップロード（`multipart/form-data`、JSON 内 Base64 埋め込み PDF/Office/画像）・API 送信（`POST` / `PUT` / `PATCH`）を捕捉・遮断。
     - **WebSocket (`ws://` / `wss://`, RFC 6455)**: `Upgrade: websocket` ハンドシェイクを検知し、クライアントからサーバーへ送信される Text (`0x1`) / Binary (`0x2`) フレームをアンマスクして CEP WebProtect で検査。`BLOCK` 時は RFC 6455 Close Frame (`1008 Policy Violation`) を返して即時遮断。
     - **SOCKS5 (`socks5://127.0.0.1:8843`, RFC 1928) 同一ポート多重化**: HTTP プロキシと同一ポート（`127.0.0.1:8843`）の先頭バイト（`0x05`）を自動判別して SOCKS5 トンネルを終端し、トンネル内部の TLS / HTTP / WebSocket / SMTP / FTP / 汎用 TCP ストリームを自動識別して検査。
     - **SMTP (`25` / `587` / `465`) / FTP (`21`) / 汎用 TCP ストリーム**: メールクライアントの SMTP `DATA` 本文・MIME 添付ファイルを検査し、`BLOCK` 時は `554 5.7.1 Message blocked by Chrome Enterprise Premium DLP` を返して送信を中止。
   - **【第3層】ストレージ ＆ CLI ファイル持ち出しガード (`pkg/egress`)**:
     - **SMB ファイル共有 (`\\server\share`, マップドドライブ `Z:`, macOS `/Volumes`, Linux `cifs`/`smb3`) / リムーバブル USB ドライブ / クラウド同期フォルダ (OneDrive, Dropbox, Box, iCloud Drive)**: OS カーネルが直接通信するため HTTP プロキシを通らない SMB（TCP 445）や USB ストレージへのファイル書き出しをリアルタイム監視し、`FILE_ATTACHED` として CEP WebProtect でスキャン。`BLOCK` 判定時は共有先・USB 上のファイルを即座に削除し、`~/.cep-local-dlp-agent/quarantine/` にローカル退避。`--watch-dirs "\\\\fileserver\\share,D:\\Sync"` で任意の UNC パス・フォルダも追加監視可能。
     - **CLI ファイル転送プロセス監視 (`scp`, `sftp`, `rsync`, `rclone`, `ftp`, `smbclient`, `robocopy`, `curl -T/-F`, `aws`, `gsutil`, `azcopy`)**: SSH ホスト鍵検証のため TLS MITM が不可能な `scp` / `sftp` / `rsync` 等のコマンドライン引数をプロセス起動時に解析し、送信元ローカルファイルを CEP WebProtect で即時スキャン。`BLOCK` 時は転送プロセスを強制終了（Kill）して漏洩を阻止。
   - **管理コンソール URL 条件との統一マッピング (`https://local-protocol.internal/<protocol>/...`)**:
     非 HTTP プロトコルもすべて正規化 URL（例: `https://local-protocol.internal/smb/fileserver/share`、`https://local-protocol.internal/usb/drive-e`、`https://local-protocol.internal/scp/external.example.com`、`https://local-protocol.internal/smtp/mail.example.com`）に変換して CEP WebProtect へ送信するため、Google 管理コンソールの既存の URL 条件ルールでプロトコル別・宛先別の制御と監査ログ記録が可能です。
3. **Smart Bypass（Quota 保護・Chrome 二重検査回避・証明書ピニング自動回避）**:
   - **ローカルプロセス識別 (`pkg/proxy/proc_inspector*.go`)**: ループバック接続元のプロセス名を特定し、`Google Chrome` / `chrome.exe`（ブラウザ内蔵 CEP で保護済み）や OS 更新プロセスの通信は自動的に TCP パススルーへバイパス。Windows は Win32 API（`GetExtendedTcpTable` / `QueryFullProcessImageNameW`）を直接呼び出すため 1ms 未満で判定（PowerShell 起動なし）。macOS / Linux は `lsof`。
   - **Chrome / Google インフラ ホストの TLS 非復号 (`chromeInfraSuffixes`)**: `clients4.google.com`（Chrome Sync）、`*.clients6.google.com`、`optimizationguide-pa` / `chromereporting-pa` / `oauthaccountmanager.googleapis.com`、`accounts.google.com`、`*.gvt1.com` などブラウザ内部通信はプロセス判定に失敗しても復号しない（多層防御）。OS プロキシのバイパスリスト（WinInet `ProxyOverride` / macOS `-setproxybypassdomains`）にも同じホストを登録し、そもそもエージェントへ届かないようにする。
   - **テレメトリ除外 (`telemetryHostSuffixes` / `telemetryPathPatterns`)**: `play.google.com/log`（Clearcut）、Datadog / Sentry / NewRelic / Segment、`a.nel.cloudflare.com`、`csp.withgoogle.com`、Microsoft/VS Code テレメトリ、`discord.com/api/v9/science`、`api.anthropic.com/api/event_logging`、`claude.ai/api/v2/rum`、`/v1/messages/count_tokens`（本文と重複）などユーザー入力を含まない通信は CEP に送らない。`application/x-protobuf` / gRPC も除外。
   - **ペイロード選別 (`pkg/proxy/filter.go`)**: `GET` / `HEAD` / `OPTIONS` および 100 Bytes 未満のハートビート通信はローカルで即スルーし、実質的なデータ送信のみを CEP へ送信。
   - **重複スキャン抑止**: 同一パス・同一ペイロードは 30 秒間キャッシュし、再送・リトライで Quota を二重消費しない。
   - **Connector 判定**: `FILE_ATTACHED` は multipart のファイルパート、または PDF / Office / ZIP / 画像などマジックバイトで実ファイルと判定できる場合のみ。JSON・フォーム・テキスト系は `BULK_DATA_ENTRY`、判別不能なバイナリはスキップ。
   - **ログのマスキング**: `agent.log` に書き出す URL はクエリ文字列（`SAPISIDHASH`、`key=`、`dd-api-key` 等）を除去（`?<auth,key=redacted>` 形式）。
   - **Quota 保護**: ローカル Token Bucket レートリミッタにより、CEP サーバーの Quota（デバイス単位 50 QPS / テナント全体 100 QPS）枯渇を防止。
   - **TLS Pinning 自動回避**: クライアントアプリが TLS 証明書ピニングによりハンドシェイクを拒否した場合、該当ホストを自動的に検出し、次回以降の接続を TCP パススルーへ自動切り替え。

## ビルド済みバイナリ (`dist/`)

外部ライブラリ依存ゼロ（Go 標準ライブラリのみ）でクロスビルドされた各 OS 向けシングルバイナリが `dist/` 配下に出力されています：

- `dist/cep-dlp-agent-darwin-arm64` (macOS Apple Silicon)
- `dist/cep-dlp-agent-darwin-amd64` (macOS Intel)
- `dist/cep-dlp-agent-windows-amd64.exe` (Windows x64)
- `dist/cep-dlp-agent-windows-arm64.exe` (Windows ARM64)
- `dist/cep-dlp-agent-linux-amd64` (Linux x64)

## クイックスタート（macOS / Windows）

### 1. ローカル DM Token の自動検出確認
```bash
./cep-dlp-agent token
```

### 2. 単体スキャン検証（Phase 1 CLI）
```bash
# テキスト（プロンプト・ペースト）の DLP 判定確認
./cep-dlp-agent scan --url "https://chatgpt.com" --text "マイナンバー: 1234-5678-9012"

# ファイル添付の DLP 判定確認（PDF / Office / 画像 OCR 対応）
./cep-dlp-agent scan --url "https://slack.com/api/files.upload" --file ./secret.pdf
```

### 3. ローカル Root CA 証明書の生成と OS 信頼ストアへのワンコマンド登録
```bash
./cep-dlp-agent ca-install
```

### 4. ハイブリッドデーモン起動（OS システムプロキシ自動設定つき）
`--system-proxy` を付与すると、起動時に macOS (`networksetup`) または Windows (`WinInet` レジストリ) のシステムプロキシを自動で有効化し、停止時（`Ctrl+C`）に自動で元の設定へ復元します。
```bash
./cep-dlp-agent daemon --listen 127.0.0.1:8843 --system-proxy
```

## BYOD（非管理端末・MDM なし）向け展開モード

MDM でバイナリやマシンレベル DM トークンを配布できない BYOD PC 向けに、**① 管理者権限不要のユーザー領域自動起動インストーラー** と **② Chrome プロファイル強制配布用の Companion 拡張機能 (`extension/`)** を備えています。

### 1. ユーザー領域への自動起動登録 & `cep-dlp://` スキーム登録（管理者権限不要）
```bash
# 初回1回のみ実行（macOS LaunchAgents / Windows HKCU Run / Linux systemd --user へ登録）
./cep-dlp-agent install

# アンインストール（自動起動解除 & プロキシ復元）
./cep-dlp-agent uninstall
```
- **macOS**: `~/Library/LaunchAgents/com.google.cep.local-dlp-agent.plist` および `~/Applications/CEP Local DLP Agent.app`（`cep-dlp://start` カスタム URL スキーム）を自動生成・起動します。
- **Windows**: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` および `HKCU\Software\Classes\cep-dlp` をユーザー権限のみで登録・バックグラウンド起動します。

### 2. BYOD Companion Chrome 拡張機能 (`extension/`)
Google 管理コンソールの「ユーザーとブラウザの設定」から BYOD の業務 Chrome プロファイルへ強制インストール（`ExtensionInstallForcelist`）することで、以下の 2 つの機能を自動化します：
1. **DM Token のゼロタッチ自動ブートストラップ**:
   `chrome.storage.managed` で配信された `dmToken` とログイン中のユーザーメール（`chrome.identity`）を `POST http://127.0.0.1:8843/__cep_agent/v1/bootstrap-token` へ自動プッシュし、BYOD 端末でもローカル設定作業なしで CEP サーバー連携を有効化します。
2. **ブラウザ Gatekeeper（未起動時の業務 Web / 生成 AI アクセス遮断）**:
   `http://127.0.0.1:8843/healthz` の死活監視を常時行い、`cep-dlp-agent` が停止している場合は `chrome.declarativeNetRequest` の動的ルールによって対象ドメイン（社内 SaaS / 生成 AI 等）へのアクセスを `onboarding.html` へ自動リダイレクトします。ユーザーは画面上の **`cep-dlp://start` ボタンを 1 クリック**するだけでエージェントを起動でき、稼働検知と同時に元のページへ自動復帰します。


### 3. 複数 Chrome プロファイル（複数テナント）環境でのトークン選択ルール
同一 PC に複数の Workspace アカウント（例: `Profile 8 = user@tenant-a`, `Profile 11 = user@tenant-b`）がある場合、エージェントは**フォルダ名の辞書順ではなく**以下の優先順位で使用するプロファイルを決定します：

1. **明示的なピン留め**（`CEP_PROFILE_EMAIL` 環境変数 / `~/.cep-local-dlp-agent/config.json` の `preferred_email` / Companion 拡張機能が動作しているプロファイルのアカウント）
2. Chrome が最後に使用したプロファイル（`Local State` → `profile.last_used`）
3. ポリシーキャッシュ（`Policy/User Policy`）の更新日時が最新のプロファイル

```bash
# 検出された全プロファイルと選択結果を確認（"selected": true が使用中）
./cep-dlp-agent token

# 特定アカウント（またはドメイン）をピン留め
./cep-dlp-agent token --profile-email admin@example.com
./cep-dlp-agent token --profile-email @example.com
```

### 4. ログの読み方とトラブルシューティング
| ログの状態 | 意味 / 対処 |
|---|---|
| `Using DM Token from chrome_profile:pinned (... user=admin@example.com)` | 拡張機能または `--profile-email` で固定されたプロファイルのトークンを使用中（正常）。 |
| `Using DM Token from chrome_profile (... user=<別テナント>)` | 旧バージョン（辞書順で最初のプロファイルを採用）。最新版へ更新し、`token --profile-email` でピン留め。 |
| `CEP DLP Verdict for https://play.google.com/log ...` / `clients4.google.com` / `*.clients6.google.com` が大量に出る | Chrome 内部通信が復号されている（旧バージョンの Windows プロセス判定不具合）。最新版では Win32 API 判定 + ホスト除外で出なくなる。 |
| `FILE_ATTACHED` が JSON / protobuf の POST に付く | 旧バージョンの Connector 判定。最新版では実ファイルのみ `FILE_ATTACHED`。 |
| `local rate limiter active ...` | 端末側 40 QPS のトークンバケットが枯渇。テレメトリ除外が効いていれば通常発生しない。 |
| `[oshook] CEP DLP Clipboard Verdict for app=Cursor url=...` | 第1層（OS クリップボード監視）がネイティブアプリ上で新しいコピー文字列を検知し、CEP WebProtect でスキャンした結果（`ACTION_UNSPECIFIED` / `WARN` / `BLOCK`）。 |
| `ACTION_UNSPECIFIED (rule="")` | どの DLP ルールにも一致せず許可。ルールに一致すると `BLOCK` / `WARN` とルール名が出力され、管理コンソールの監査ログにも記録される。 |

```bash
# 何がパススルー / 検査対象になったかを 1 接続ごとに表示（調査時のみ）
CEP_AGENT_DEBUG=1 ./cep-dlp-agent run
# Windows (PowerShell)
$env:CEP_AGENT_DEBUG = "1"; .\cep-dlp-agent.exe run
```
