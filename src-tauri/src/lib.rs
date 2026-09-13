mod notion;
mod settings;
mod update;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

/// ホットキー起動・トレイメニューから呼び出す、入力ポップアップの表示。
fn show_popup(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.emit("popup:reset", ());
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn show_settings(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// タスク登録の成否に関わらず、フロントエンドからポップアップを閉じるために呼ぶ。
#[tauri::command]
fn hide_popup_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("popup") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) {
    show_settings(&app);
}

/// 設定画面でホットキーを変更した際に、登録し直すために呼ぶ。
#[tauri::command]
fn update_global_shortcut(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    let shortcut_manager = app.global_shortcut();
    let _ = shortcut_manager.unregister_all();
    shortcut_manager
        .register(hotkey.as_str())
        .map_err(|e| format!("ホットキーの登録に失敗しました: {e}"))
}

/// システムトレイメニューの各項目。表示言語切り替え時に文言を差し替えるために保持しておく。
struct TrayMenuItems {
    new_task: MenuItem<tauri::Wry>,
    settings: MenuItem<tauri::Wry>,
    quit: MenuItem<tauri::Wry>,
}

fn tray_label(language: &str, key: &str) -> &'static str {
    let is_en = language == "en";
    match key {
        "new_task" => {
            if is_en {
                "New Task"
            } else {
                "新規タスク登録"
            }
        }
        "settings" => {
            if is_en {
                "Settings"
            } else {
                "設定"
            }
        }
        "quit" => {
            if is_en {
                "Quit"
            } else {
                "終了"
            }
        }
        _ => "",
    }
}

/// 設定画面で表示言語を変更・保存した際に、トレイメニューの文言も合わせて更新するために呼ぶ。
#[tauri::command]
fn apply_tray_language(app: tauri::AppHandle, language: String) -> Result<(), String> {
    let items = app.state::<TrayMenuItems>();
    items
        .new_task
        .set_text(tray_label(&language, "new_task"))
        .map_err(|e| e.to_string())?;
    items
        .settings
        .set_text(tray_label(&language, "settings"))
        .map_err(|e| e.to_string())?;
    items
        .quit
        .set_text(tray_label(&language, "quit"))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 二重起動時は新規プロセスを終了し、既存インスタンスのポップアップを表示する。
            show_popup(app);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        show_popup(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            settings::get_settings,
            settings::save_settings,
            settings::extract_database_id,
            notion::detect_database_schema,
            notion::register_task,
            hide_popup_window,
            open_settings_window,
            update_global_shortcut,
            apply_tray_language,
            update::check_for_updates,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // 保存済み設定を先に読み込み、トレイメニューの初期文言に反映する。
            let current_settings = settings::load(&handle);
            let language = current_settings.language.as_str();

            // システムトレイメニュー
            let new_task_item = MenuItem::with_id(
                app,
                "new_task",
                tray_label(language, "new_task"),
                true,
                None::<&str>,
            )?;
            let settings_item = MenuItem::with_id(
                app,
                "settings",
                tray_label(language, "settings"),
                true,
                None::<&str>,
            )?;
            let quit_item =
                MenuItem::with_id(app, "quit", tray_label(language, "quit"), true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&new_task_item, &settings_item, &quit_item])?;

            app.manage(TrayMenuItems {
                new_task: new_task_item,
                settings: settings_item,
                quit: quit_item,
            });

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("TaskIn for Notion")
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "new_task" => show_popup(app),
                    "settings" => show_settings(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // ホットキーを登録する。
            if let Err(e) = app
                .global_shortcut()
                .register(current_settings.hotkey.as_str())
            {
                eprintln!("グローバルホットキーの登録に失敗しました: {e}");
            }

            // 初回起動時・未設定時は設定画面へ誘導する。
            if !current_settings.is_configured() {
                show_settings(&handle);
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // ポップアップ/設定画面は閉じるボタンで破棄せず、隠すだけにして常駐を継続する。
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "popup" || window.label() == "settings" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
