# 🛡️ CEP Easy PoC & CERA — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **Google スプレッドシート + Apps Script (GAS)** 構成で、Chrome 拡張機能のインストールや GCP プロジェクト番号の手動設定を行わずに、スプレッドシートの上部メニューまたは Web App から **CEP Easy PoC** と **CERA** をそのまま実行できるパッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| `appsscript.json` | Apps Script マニフェスト（Default Cloud Project 用 `enabledAdvancedServices`・OAuth スコープ定義） |
| `Code.gs` | スプレッドシート上部メニュー `🛡️ CEP Easy PoC`、`doGet` Web App、自動 Quota Project 検出・Service Usage 自動有効化付き `UrlFetchApp` プロキシ、シート自動記録処理 |
| `Index.html` | モーダル UI 本体（Easy PoC・DLP マトリクス・ライセンス管理・CERA・ガイド） |

## 使い方（CERA 2.0 方式・GCP プロジェクト番号の手動設定不要）

1. 配布用テンプレート（`go/cep-easy-poc` または `https://docs.google.com/spreadsheets/d/19xMGUHJFjF8SSiXV0kO-e8p49YqT1-xTEeo4raZMCv8/copy`）を開き、**［コピーを作成］** をクリックします。
2. 上部メニュー **`🛡️ CEP Easy PoC` ＞ `🚀 Easy PoC デプロイヤーを開く`**（または事前構築済み Apps Script プロジェクト `1flNM6SM-lSGUSssW4OYJg7KYIu00vJbAuDXGivcV9bEM4qCjMI2zrf8L` の `installOnTargetSpreadsheet()`）を実行します。
3. 初回実行時に Google アカウントの OAuth 承認画面が表示されたら許可します（Apps Script の Default Cloud Project 上で Admin SDK / Cloud Identity / License Manager 等が動作し、Chrome Policy API 等で Quota Project が必要な場合はアクセス可能な GCP プロジェクトを自動検出して有効化します）。
