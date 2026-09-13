use serde::{Deserialize, Serialize};

const REPO_OWNER: &str = "sok41";
const REPO_NAME: &str = "TaskIn-for-Notion";
/// ビルド時のCargo.tomlのversionを埋め込む(実行時に取得し直す必要はない)。
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Clone, Serialize)]
pub struct UpdateCheckResult {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub release_url: String,
}

#[derive(Debug, Deserialize)]
struct GithubRelease {
    tag_name: String,
    html_url: String,
}

/// "v1.2.3" や "1.2.3" を [1,2,3] のような数値列に変換する。
/// 不正な区切りは0として扱う簡易実装。
fn parse_version(raw: &str) -> Vec<u64> {
    raw.trim_start_matches('v')
        .split('.')
        .map(|part| {
            part.chars()
                .take_while(|c| c.is_ascii_digit())
                .collect::<String>()
        })
        .map(|digits| digits.parse::<u64>().unwrap_or(0))
        .collect()
}

fn is_newer(latest: &str, current: &str) -> bool {
    let latest_parts = parse_version(latest);
    let current_parts = parse_version(current);
    let len = latest_parts.len().max(current_parts.len());
    for i in 0..len {
        let l = latest_parts.get(i).copied().unwrap_or(0);
        let c = current_parts.get(i).copied().unwrap_or(0);
        if l != c {
            return l > c;
        }
    }
    false
}

/// 設定画面の「アップデートを確認」ボタンから呼ぶ。
/// GitHub Releasesの最新版(ドラフト・プレリリースを除く)を取得し、現在のバージョンと比較する。
#[tauri::command]
pub async fn check_for_updates() -> Result<UpdateCheckResult, String> {
    let url = format!("https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/latest");
    let res = reqwest::Client::new()
        .get(&url)
        .header("User-Agent", "TaskIn-for-Notion-UpdateChecker")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("アップデート情報の取得に失敗しました: {e}"))?;

    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Err("まだリリースが公開されていません。".to_string());
    }
    if !res.status().is_success() {
        let status = res.status();
        return Err(format!("GitHubへの問い合わせに失敗しました ({status})。"));
    }

    let release: GithubRelease = res
        .json()
        .await
        .map_err(|e| format!("応答の解析に失敗しました: {e}"))?;

    let latest_version = release.tag_name.trim_start_matches('v').to_string();
    let update_available = is_newer(&latest_version, CURRENT_VERSION);

    Ok(UpdateCheckResult {
        current_version: CURRENT_VERSION.to_string(),
        latest_version,
        update_available,
        release_url: release.html_url,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_newer_patch_version() {
        assert!(is_newer("0.1.1", "0.1.0"));
        assert!(!is_newer("0.1.0", "0.1.0"));
        assert!(!is_newer("0.1.0", "0.1.1"));
    }

    #[test]
    fn detects_newer_minor_and_major_version() {
        assert!(is_newer("0.2.0", "0.1.9"));
        assert!(is_newer("1.0.0", "0.9.9"));
    }

    #[test]
    fn handles_v_prefix() {
        assert!(is_newer("v1.2.0", "1.1.0"));
    }
}
