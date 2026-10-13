# 🌐 Secure Gateway Deployer — Google スプレッドシート + Apps Script 版

CERA 2.0 と同じ **コンテナバインド型 Google スプレッドシート + Apps Script (GAS)** 構成で、スプレッドシートのカスタムメニューから **Chrome Enterprise Premium Secure Gateway Deployer**（4ステップ構成ウィザード・強制上書きモード・サンプルVM作成・デプロイ管理・削除）を実行できる単独パッケージです。

## 含まれるファイル

| ファイル名 | 用途 |
| :--- | :--- |
| `appsscript.json` | Apps Script マニフェスト（Google Cloud / Chrome Policy OAuth スコープ定義） |
| `Code.gs` | スプレッドシート上部メニュー `🌐 Secure Gateway`、`UrlFetchApp` プロキシ、構成・監査シート自動出力 |
| `Index.html` | モーダル UI 本体（新規セットアップ・デプロイ管理・受入証跡・ガイド） |

## 特徴（Apps Script 6分制限とローカルPoC証明書への対応）

- **6分実行制限の回避**: デプロイのステップ制御ループはモーダル側で動作し、1リクエストごとに `google.script.run.sgsProxyFetch`（約0.5〜2秒）を呼び出すため、VM 起動やゲートウェイ作成が数分かかっても Apps Script の6分制限に抵触しません。
- **ブラウザ内 WebCrypto による証明書生成**: ローカル PoC 用の ECDSA P-256 ルート CA 証明書・サーバー TLS 証明書はモーダル内の WebCrypto (`crypto.subtle`) で生成します。
- **シートへの自動記録**: プリフライトや適用を実行すると、スプレッドシート内の `🌐 SGW 構成・リソース一覧` および `📜 SGW 実行・監査ログ` シートにリソース計画と実行結果が自動出力されます。

## セットアップ手順（3分）

1. **Google スプレッドシートを新規作成**し、**［拡張機能］＞［Apps Script］** を開きます。
2. **［⚙ プロジェクトの設定］** で **「「appsscript.json」マニフェスト ファイルをエディタで表示する」** にチェックを入れ、対象の **GCP プロジェクト番号** を設定します。
3. `appsscript.json`、`Code.gs`、および HTML ファイル `Index`（`Index.html` の内容）を貼り付けて保存します。
4. スプレッドシートを再読み込みし、上部メニュー **`🌐 Secure Gateway` ＞ `🚀 Secure Gateway 新規セットアップを開く`** から起動します。
