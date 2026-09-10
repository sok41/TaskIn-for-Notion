# TaskIn for Notion

Windows上でホットキー（既定: `Ctrl+Alt+N`）を押すと小さな入力ウィンドウが表示され、タスク名（と任意で期限）を入力するだけで、あらかじめ設定したNotionデータベースに新規ページとして自動登録される常駐アプリケーション。

詳細な仕様は [要件定義書_ホットキータスク登録アプリ.md](./要件定義書_ホットキータスク登録アプリ.md) を参照。

## 技術スタック

- Tauri 2（Rust） + React + TypeScript + Vite
- Notion API（Integration Token方式、`reqwest` でRust側から呼び出し）

## セットアップ

前提: Node.js, Rust（`rustup`）, Windows向けC++ビルドツール（Visual Studio Build Tools の「C++によるデスクトップ開発」ワークロード）, WebView2ランタイム。

```bash
npm install
npm run tauri dev
```

初回起動時（または未設定時）は自動で設定画面が開く。Notion側の準備手順は設定画面内に案内を表示している。

## ビルド

```bash
npm run tauri build
```

## プロジェクト構成

```
src/                  React（フロントエンド）
  windows/
    Popup.tsx          ホットキーで開く入力ポップアップ
    Settings.tsx        設定画面（Integration Token / DB URL / ホットキー / 自動起動）
  api.ts               Rustコマンド呼び出しのラッパー
  types.ts             共有の型定義

src-tauri/            Rust（バックエンド）
  src/
    lib.rs             アプリ初期化・トレイ・グローバルホットキー・ウィンドウ制御
    settings.rs         設定の永続化（ローカルJSON、平文）・DB URLからのID抽出
    notion.rs            Notion APIとの通信（スキーマ検出・ページ登録）
```

## 開発運用

GitHubへのpush後、Claude Codeに `開発ログを記録して` のように手動で依頼すると、
Notionの開発ログページ配下に対応内容を要約した子ページが追加される
（`.claude/skills/dev-log/SKILL.md` 参照）。push自体をトリガーにした自動実行は行わない。
