# 🛡️ CEP Easy PoC & CERA — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **コンテナバインド型 Google スプレッドシート + Apps Script (GAS)** 構成で、Chrome 拡張機能のインストールや Chrome Web Store の審査を待たずに、スプレッドシートのカスタムメニューから **CEP Easy PoC** と **CERA** をフル機能で実行できるパッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| `appsscript.json` | Apps Script マニフェスト（OAuth スコープ定義） |
| `Code.gs` | スプレッドシート上部メニュー `🛡️ CEP Easy PoC`、`UrlFetchApp` プロキシ、シート自動記録処理 |
| `Index.html` | モーダル UI 本体（Easy PoC・DLP マトリクス・ライセンス管理・CERA・ガイド） |

## セットアップ手順（3分）

1. **Google スプレッドシートを新規作成**し、上部メニューの **［拡張機能］＞［Apps Script］** を開きます。
2. Apps Script エディタ左側の **［⚙ プロジェクトの設定］** を開き、以下を設定します：
   - **「「appsscript.json」マニフェスト ファイルをエディタで表示する」** にチェックを入れます。
   - **「Google Cloud Platform (GCP) プロジェクト」** で **［プロジェクトを変更］** を押し、以下の API を有効化した GCP プロジェクト番号を入力します（OAuth 同意画面は「内部」で構いません）：
     - Admin SDK API (`admin.googleapis.com`)
     - Chrome Policy API (`chromepolicy.googleapis.com`)
     - Cloud Identity API (`cloudidentity.googleapis.com`)
     - Enterprise License Manager API (`licensing.googleapis.com`)
3. エディタに戻り、以下の3ファイルを貼り付けて保存します：
   - `appsscript.json`
   - `Code.gs`（既存の `コード.gs` を置き換え）
   - **［＋］＞［HTML］** からファイル名 `Index`（`.html` は自動付与）を作成し、`Index.html` の中身を貼り付け
4. スプレッドシートを再読み込みすると、上部メニューに **`🛡️ CEP Easy PoC`** が表示されます。
5. 一度設定したスプレッドシートは、CERA と同じく URL 末尾を `/copy` に変えて配布することで、コピー先でもそのまま利用できます。
