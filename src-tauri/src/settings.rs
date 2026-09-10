use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// アプリの設定情報。
/// 個人利用を前提に、当面は平文でローカルファイルに保存する。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default)]
    pub integration_token: String,
    #[serde(default)]
    pub database_id: String,
    /// Notion側で検出したタイトルプロパティ名(例: "名前" "Name")
    #[serde(default)]
    pub title_property: String,
    /// Notion側で検出/選択した期限用の日付プロパティ名
    #[serde(default)]
    pub date_property: Option<String>,
    #[serde(default = "default_hotkey")]
    pub hotkey: String,
    #[serde(default = "default_true")]
    pub autostart_enabled: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            integration_token: String::new(),
            database_id: String::new(),
            title_property: String::new(),
            date_property: None,
            hotkey: default_hotkey(),
            autostart_enabled: default_true(),
        }
    }
}

fn default_hotkey() -> String {
    "Ctrl+Alt+N".to_string()
}

fn default_true() -> bool {
    true
}

impl Settings {
    /// Notion登録に最低限必要な情報が揃っているか。
    pub fn is_configured(&self) -> bool {
        !self.integration_token.trim().is_empty() && !self.database_id.trim().is_empty()
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("設定フォルダの取得に失敗しました: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("設定フォルダの作成に失敗しました: {e}"))?;
    Ok(dir.join("settings.json"))
}

pub fn load(app: &AppHandle) -> Settings {
    let path = match settings_path(app) {
        Ok(p) => p,
        Err(_) => return Settings::default(),
    };
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Settings::default(),
    }
}

pub fn save(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app)?;
    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("設定のシリアライズに失敗しました: {e}"))?;
    fs::write(&path, content).map_err(|e| format!("設定の保存に失敗しました: {e}"))
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Settings {
    load(&app)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    save(&app, &settings)
}

/// NotionデータベースのURL(またはID文字列)からデータベースIDを抽出する。
/// 例: https://www.notion.so/myspace/xxxx-1a2b3c4d...?v=... -> "1a2b3c4d..."(32桁hex)
#[tauri::command]
pub fn extract_database_id(input: String) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("URLまたはIDを入力してください。".to_string());
    }

    let without_query = trimmed.split('?').next().unwrap_or(trimmed);
    let last_segment = without_query.rsplit('/').next().unwrap_or(without_query);

    // セグメント全体がハイフン付きUUID形式などの場合、hex文字だけを抜き出して判定する
    let hex_only: String = last_segment
        .chars()
        .filter(|c| c.is_ascii_hexdigit())
        .collect();
    if hex_only.len() == 32
        && last_segment
            .chars()
            .all(|c| c.is_ascii_hexdigit() || c == '-')
    {
        return Ok(hex_only);
    }

    // "ページタイトル-<32桁ID>" 形式を想定し、末尾32文字を取り出す
    if last_segment.len() >= 32 {
        let tail = &last_segment[last_segment.len() - 32..];
        if tail.chars().all(|c| c.is_ascii_hexdigit()) {
            return Ok(tail.to_string());
        }
    }

    Err("有効なデータベースIDを抽出できませんでした。データベースのURLを確認してください。".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_id_from_plain_url() {
        let url = "https://www.notion.so/myspace/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d?v=abcd";
        assert_eq!(
            extract_database_id(url.to_string()).unwrap(),
            "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
        );
    }

    #[test]
    fn extracts_id_from_titled_url() {
        let url = "https://www.notion.so/myspace/Task-DB-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d";
        assert_eq!(
            extract_database_id(url.to_string()).unwrap(),
            "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
        );
    }

    #[test]
    fn rejects_invalid_input() {
        assert!(extract_database_id("not a url".to_string()).is_err());
    }
}
