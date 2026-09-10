use crate::settings::{self, Settings};
use serde::Serialize;
use serde_json::{json, Value};
use tauri::AppHandle;

const NOTION_VERSION: &str = "2022-06-28";
const NOTION_API_BASE: &str = "https://api.notion.com/v1";

/// Notionデータベースのスキーマから検出したプロパティ名。
#[derive(Debug, Clone, Serialize)]
pub struct DatabaseSchema {
    pub title_property: String,
    pub date_properties: Vec<String>,
}

fn client() -> reqwest::Client {
    reqwest::Client::new()
}

/// 設定画面から呼び出し、Integration TokenとDatabase IDが正しいかの確認も兼ねて
/// タイトルプロパティ・日付プロパティ候補を自動検出する。
#[tauri::command]
pub async fn detect_database_schema(
    integration_token: String,
    database_id: String,
) -> Result<DatabaseSchema, String> {
    let url = format!("{NOTION_API_BASE}/databases/{database_id}");
    let res = client()
        .get(url)
        .bearer_auth(integration_token)
        .header("Notion-Version", NOTION_VERSION)
        .send()
        .await
        .map_err(|e| format!("Notionへの接続に失敗しました: {e}"))?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!(
            "Notion APIエラー ({status})。Integration Tokenとデータベースの共有設定を確認してください。詳細: {body}"
        ));
    }

    let body: Value = res
        .json()
        .await
        .map_err(|e| format!("応答の解析に失敗しました: {e}"))?;
    let properties = body
        .get("properties")
        .and_then(|p| p.as_object())
        .ok_or_else(|| "データベースのプロパティが取得できませんでした".to_string())?;

    let mut title_property = None;
    let mut date_properties = Vec::new();
    for (name, def) in properties {
        match def.get("type").and_then(|t| t.as_str()) {
            Some("title") => title_property = Some(name.clone()),
            Some("date") => date_properties.push(name.clone()),
            _ => {}
        }
    }

    let title_property = title_property
        .ok_or_else(|| "タイトルプロパティが見つかりませんでした".to_string())?;

    Ok(DatabaseSchema {
        title_property,
        date_properties,
    })
}

/// 入力されたタスク名・期限をもとに、設定済みのNotionデータベースへ新規ページを作成する。
#[tauri::command]
pub async fn register_task(
    app: AppHandle,
    task_name: String,
    due_date: Option<String>,
) -> Result<(), String> {
    let settings: Settings = settings::load(&app);

    if !settings.is_configured() {
        return Err(
            "Notionの設定が完了していません。設定画面から連携情報を登録してください。"
                .to_string(),
        );
    }
    if task_name.trim().is_empty() {
        return Err("タスク名を入力してください。".to_string());
    }

    let title_property = if settings.title_property.trim().is_empty() {
        "Name".to_string()
    } else {
        settings.title_property.clone()
    };

    let mut properties = json!({
        title_property: {
            "title": [{ "text": { "content": task_name } }]
        }
    });

    let due_date = due_date.filter(|d| !d.trim().is_empty());
    if let (Some(date), Some(date_property)) = (due_date, settings.date_property.clone()) {
        properties[date_property] = json!({ "date": { "start": date } });
    }

    let body = json!({
        "parent": { "database_id": settings.database_id },
        "properties": properties
    });

    let res = client()
        .post(format!("{NOTION_API_BASE}/pages"))
        .bearer_auth(&settings.integration_token)
        .header("Notion-Version", NOTION_VERSION)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Notionへの接続に失敗しました。ネットワークを確認してください: {e}"))?;

    if res.status().is_success() {
        Ok(())
    } else {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        Err(format!("登録に失敗しました ({status}): {text}"))
    }
}
