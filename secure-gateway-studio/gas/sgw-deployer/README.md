# 🌐 Secure Gateway Deployer — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **Google スプレッドシート + Apps Script (GAS)** 構成で、スプレッドシートの上部メニューまたは Web App から **Chrome Enterprise Premium Secure Gateway Deployer**（4ステップ構成ウィザード・強制上書きモード・サンプルVM作成・デプロイ管理・削除）を実行できる単独パッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| `appsscript.json` | Apps Script マニフェスト（Default Cloud Project 用 `enabledAdvancedServices`・Google Cloud / Chrome Policy OAuth スコープ定義） |
| `Code.gs` | スプレッドシート上部メニュー `🌐 Secure Gateway`、`doGet` Web App、自動 Quota Project 検出付き `UrlFetchApp` プロキシ、構成・監査シート自動出力 |
| `Index.html` | モーダル UI 本体（新規セットアップ・デプロイ管理・受入証跡・ガイド） |

## 特徴（Apps Script 6分制限とローカルPoC証明書への対応）

- **GCP プロジェクト番号の手動紐付け不要**: Apps Script の Default Cloud Project でそのまま OAuth 認可が通り、デプロイ対象の GCP プロジェクト ID を `X-Goog-User-Project` として自動付与・API 自動有効化します。
- **6分実行制限の回避**: デプロイのステップ制御ループはモーダル側で動作し、1リクエストごとに `google.script.run.sgsProxyFetch`（約0.5〜2秒）を呼び出すため、VM 起動やゲートウェイ作成が数分かかっても Apps Script の6分制限に抵触しません。
- **ブラウザ内 WebCrypto による証明書生成**: ローカル PoC 用の ECDSA P-256 ルート CA 証明書・サーバー TLS 証明書はモーダル内の WebCrypto (`crypto.subtle`) で生成します。
- **シートへの自動記録**: プリフライトや適用を実行すると、スプレッドシート内の `🌐 SGW 構成・リソース一覧` および `📜 SGW 実行・監査ログ` シートにリソース計画と実行結果が自動出力されます。

## 使い方（CERA 2.0 方式）

1. 配布用テンプレート（`go/sgw-deployer` または `https://docs.google.com/spreadsheets/d/1fAzabI3NbQjY_zZWYwv-J_vGtJqE20cq09qSYDgttjc/copy`）を開き、**［コピーを作成］** をクリックします。
2. 上部メニュー **`🌐 Secure Gateway` ＞ `🚀 Secure Gateway 新規セットアップを開く`**（または事前構築済み Apps Script プロジェクト `1y4RFjFCVAS68x4CcZe5KZ9YnO9WN5jF6WzpZ_bjPUtbdQ_zBOeG0rHKt` の `installOnTargetSpreadsheet()`）を実行します。
