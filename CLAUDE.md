# CLAUDE.md

TaskIn for Notion — Windowsでホットキーを押すとNotionにタスクを即登録できる常駐アプリ。
詳細仕様は [要件定義書_ホットキータスク登録アプリ.md](./local_docs/要件定義書_ホットキータスク登録アプリ.md) が正。実装で仕様に迷ったら必ずこのファイルを先に確認する。このファイルは`local_docs/`配下にありgit管理対象外（`.gitignore`参照）なので、リポジトリをクローンしただけの環境には存在しない点に注意。

## 技術スタックと構成

- Tauri 2（Rust）+ React + TypeScript + Vite
- フロントエンドは単一の`index.html`から、`Tauri`のウィンドウlabel（`popup` / `settings`）で表示コンポーネントを出し分ける（[src/main.tsx](src/main.tsx)）。ルーターは使っていない。
- Notion APIとの通信は**すべてRust側**（[src-tauri/src/notion.rs](src-tauri/src/notion.rs)、`reqwest`使用）で行う。フロントエンドから直接Notion APIを叩かない（CORS回避、Tokenの扱いを一箇所に集約するため）。
- 設定（Integration Token / Database ID / 検出したプロパティ名 / ホットキー / 自動起動可否）は[src-tauri/src/settings.rs](src-tauri/src/settings.rs)がアプリ設定フォルダ配下の`settings.json`に平文で保存する（要件5.5どおり、当面は暗号化しない）。

## 重要な設計判断

- **タイトル/日付プロパティ名の自動検出**: Notion Database Titleプロパティの名前は固定でないため、設定画面で「接続テスト」を押すと`detect_database_schema`コマンドがデータベーススキーマを取得し、`type: "title"`のプロパティ名と`type: "date"`のプロパティ一覧を検出して`settings.json`に保存する。要件定義書には明記されていない補足仕様なので、変更する場合は要件定義書と食い違いがないか確認する。
- **ウィンドウは閉じずに隠す**: popup/settingsウィンドウは`WindowEvent::CloseRequested`を`prevent_close`し、`hide()`のみ行う（[src-tauri/src/lib.rs](src-tauri/src/lib.rs)）。常駐アプリなのでウィンドウ破棄・再生成コストを避ける設計。
- **ポップアップの再表示時はイベントでリセット**: ウィンドウは使い回すため、ホットキー押下のたびに`popup:reset`イベントをemitし、フロント側で入力欄をクリア＆フォーカスする。

## よく使うコマンド

```bash
npm install          # 依存関係インストール
npm run tauri dev    # 開発起動（要: Rust + MSVC Build Tools + WebView2）
npm run tauri build  # リリースビルド
npx tsc --noEmit     # フロントエンドの型チェック
cd src-tauri && cargo check   # Rust側の構文・型チェック
cd src-tauri && cargo test    # settings.rsの単体テストなど
```

## 開発運用

- GitHubへのpush後、ユーザーから手動で依頼されたら[.claude/skills/dev-log/SKILL.md](.claude/skills/dev-log/SKILL.md)に従って開発ログをNotionに記録する。push自体をトリガーにした自動実行はしない。
- リポジトリ: https://github.com/sok41/TaskIn-for-Notion.git

## スコープ外（要件定義書 7章）

以下は現時点で意図的に実装しない。関連する提案が来た場合は要件定義書のスコープ外であることを伝える。

- ステータス・進捗管理
- 複数Notionデータベースからの選択（登録先は1つに固定）
- 登録以外のNotion操作（編集・削除など）
