import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, DatabaseSchema } from "./types";

export const getSettings = () => invoke<AppSettings>("get_settings");

export const saveSettings = (settings: AppSettings) =>
  invoke<void>("save_settings", { settings });

export const extractDatabaseId = (input: string) =>
  invoke<string>("extract_database_id", { input });

export const detectDatabaseSchema = (integrationToken: string, databaseId: string) =>
  invoke<DatabaseSchema>("detect_database_schema", { integrationToken, databaseId });

export const registerTask = (taskName: string, dueDate: string | null) =>
  invoke<void>("register_task", { taskName, dueDate });

export const hidePopupWindow = () => invoke<void>("hide_popup_window");

export const openSettingsWindow = () => invoke<void>("open_settings_window");

export const updateGlobalShortcut = (hotkey: string) =>
  invoke<void>("update_global_shortcut", { hotkey });
