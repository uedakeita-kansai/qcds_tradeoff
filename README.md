# QCDSトレードオフ・シミュレーター

## 1. アプリケーション概要

このアプリケーションは、プロジェクトや個人の計画における**QCDS（Quality: 品質, Cost: コスト, Delivery: 納期, Scope: スコープ）**の複雑なトレードオフ関係を、直感的かつ多角的にシミュレーションするための思考支援ツールです。

ユーザーはスライダーを操作することで各要素の配分を変更でき、その結果がリアルタイムで分析パネルに反映されます。様々なプリセットモデル（例：ソフトウェア開発、イベント企画）を切り替えることで、状況に応じた最適なバランスを探求できます。

## 2. ローカルでの実行方法

このアプリケーションは特別なビルドツールやサーバーを必要としません。以下の手順で簡単に実行できます。

1.  このリポジトリのファイルをすべてダウンロードし、同じフォルダに配置します。
2.  `index.html` ファイルをお使いのWebブラウザ（Google Chrome, Firefox, Safariなど）で開きます。

これだけでアプリケーションが起動し、使用を開始できます。

## 3. GitHub Pagesでの公開手順

このアプリケーションは静的なファイルのみで構成されているため、GitHub Pagesを利用して簡単にWeb上に公開できます。

1.  **GitHubリポジトリの作成**:
    * GitHub上で新しいリポジトリを作成します。

2.  **コードのPush**:
    * ダウンロードした `index.html`, `style.css`, `script.js`, `README.md` の4ファイルを、作成したリポジトリにPushします。
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git)
    git push -u origin main
    ```

3.  **GitHub Pagesの設定**:
    * リポジトリのページに移動し、「Settings」タブをクリックします。
    * 左側のサイドバーから「Pages」を選択します。
    * 「Branch」のドロップダウンメニューで `main` を選択し、フォルダは `/(root)` のまま「Save」ボタンをクリックします。

数分待つと、`https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/` のようなURLでアプリケーションが公開されます。

