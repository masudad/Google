# 🛡️ CEP Easy PoC — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **Google スプレッドシート + Apps Script (GAS)** 構成で、Chrome 拡張機能のインストールや GCP プロジェクト番号の手動設定を行わずに、スプレッドシートの上部メニューまたは Web App から **CEP Easy PoC**（および **CERA Export からの設定自動取り込み**）を実行できるパッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| `appsscript.json` | Apps Script マニフェスト（Default Cloud Project 用 `enabledAdvancedServices`・OAuth スコープ定義） |
| `Code.gs` | スプレッドシート上部メニュー `🛡️ CEP Easy PoC`、CERA スプレッドシート取込 `sgsImportCeraSpreadsheet`、自動 Quota Project 検出・Service Usage 自動有効化付き `UrlFetchApp` プロキシ、シート自動記録処理 |
| `Index.html` | モーダル UI 本体（Easy PoC・CERA Export 設定取込・DLP マトリクス・ライセンス管理・ガイド） |

## 使い方（CERA 2.0 方式・GCP プロジェクト番号の手動設定不要）

1. 配布用テンプレート（`go/cep-easy-poc` または `https://docs.google.com/spreadsheets/d/1z7Us0PHdfiagkqiqfATgoCz-cVk8qqfXp7h-8ij3tdc/copy`）を開き、**［コピーを作成］** をクリックします。
2. 上部メニュー **`🛡️ CEP Easy PoC` ＞ `🚀 CEP Easy PoC コンソールを開く`** または **`📥 CERA Export から設定を取り込む`** を実行します。
3. 初回実行時に Google アカウントの OAuth 承認画面が表示されたら許可します（Apps Script の Default Cloud Project 上で Admin SDK / Cloud Identity / License Manager 等が動作し、Chrome Policy API 等で Quota Project が必要な場合はアクセス可能な GCP プロジェクトを自動検出して有効化します）。

## 既知の制限（端末条件付き DLP ルール）

- Cloud Identity は、コンテキストアウェア アクセスレベルを条件に持つ DLP ルール（BYOD 限定・社給端末限定・Android / iOS BYOD など）を保存する際、**操作者の認証情報で Access Context Manager からそのレベルを読み直して検証**します。Apps Script の Default Cloud Project では Access Context Manager API を有効化できないため、この検証が通らず、該当ルールだけが `code 13 (INTERNAL)` で未適用になります（端末条件のないルールと Chrome ポリシーは通常どおり適用されます）。
- コンソールは事前に `Credential probe` を実行し、該当ルールを試行せずに理由と対処を Skipped 欄に表示します。既存ルールは変更前の定義のまま残ります。
- 対処: (1) 拡張機能 ＞ Apps Script ＞ プロジェクトの設定 ＞ **GCP プロジェクトを変更** で Access Context Manager API を有効化済みの標準 GCP プロジェクト番号を入力し、再認可してから再適用する（このスプレッドシート 1 冊にだけ効きます） (2) 該当ルールだけ管理コンソール（ルール ＞ データ保護）でアクセスレベル条件を指定して作成する (3) Chrome 拡張機能版で Section 2 を適用する。
