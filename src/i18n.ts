import type { Language } from "./types";

export interface Translations {
  popup: {
    taskNamePlaceholder: string;
    dueLabel: string;
    today: string;
    tomorrow: string;
    dueDatePlaceholder: string;
    hint: string;
    submit: string;
    submitting: string;
    successMessage: string;
    genericError: string;
  };
  settings: {
    title: string;
    lead: string;
    languageLabel: string;
    languageJa: string;
    languageEn: string;
    tokenLabel: string;
    databaseUrlLabel: string;
    databaseUrlPlaceholder: string;
    detectButton: string;
    detecting: string;
    detectSuccess: (titleProperty: string) => string;
    detectGenericError: string;
    datePropertyLabel: string;
    hotkeyLabel: string;
    autostartLabel: string;
    helpTitle: string;
    helpStep1Prefix: string;
    helpStep1LinkText: string;
    helpStep1Suffix: string;
    helpStep2: string;
    helpStep3: string;
    helpStep4: string;
    saveButton: string;
    saving: string;
    saveSuccess: string;
    saveGenericError: string;
  };
}

export const translations: Record<Language, Translations> = {
  ja: {
    popup: {
      taskNamePlaceholder: "タスク名を入力",
      dueLabel: "期限",
      today: "今日",
      tomorrow: "明日",
      dueDatePlaceholder: "YYYY-MM-DD",
      hint: "Enterで登録 / Escで閉じる",
      submit: "登録",
      submitting: "登録中...",
      successMessage: "Notionに登録しました",
      genericError: "登録に失敗しました",
    },
    settings: {
      title: "TaskIn for Notion - 設定",
      lead: "ホットキーで開くポップアップから、Notionデータベースへタスクを登録するための連携設定です。",
      languageLabel: "表示言語",
      languageJa: "日本語",
      languageEn: "English",
      tokenLabel: "Integration Token",
      databaseUrlLabel: "データベースURL",
      databaseUrlPlaceholder: "https://www.notion.so/xxxx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      detectButton: "接続テスト / プロパティ検出",
      detecting: "確認中...",
      detectSuccess: (titleProperty) => `接続を確認しました（タイトル項目: ${titleProperty}）`,
      detectGenericError: "接続の確認に失敗しました",
      datePropertyLabel: "期限として使う日付プロパティ",
      hotkeyLabel: "ホットキー",
      autostartLabel: "Windows起動時に自動起動する",
      helpTitle: "Notion側の準備手順",
      helpStep1Prefix: "Notionの「",
      helpStep1LinkText: "My integrations",
      helpStep1Suffix: "」で新規Integrationを作成し、表示された Internal Integration Secret をコピーして上の欄に貼り付ける",
      helpStep2: "タスクを登録したいNotionデータベースを開く",
      helpStep3: "右上の「•••」メニュー →「コネクト」から、作成したIntegrationを選んでこのデータベースと共有する",
      helpStep4: "データベースのURLをコピーし、上の「データベースURL」欄に貼り付けて「接続テスト」を押す",
      saveButton: "保存",
      saving: "保存中...",
      saveSuccess: "設定を保存しました",
      saveGenericError: "設定の保存に失敗しました",
    },
  },
  en: {
    popup: {
      taskNamePlaceholder: "Enter a task name",
      dueLabel: "Due",
      today: "Today",
      tomorrow: "Tomorrow",
      dueDatePlaceholder: "YYYY-MM-DD",
      hint: "Enter to save / Esc to close",
      submit: "Add",
      submitting: "Adding...",
      successMessage: "Added to Notion",
      genericError: "Failed to add the task",
    },
    settings: {
      title: "TaskIn for Notion - Settings",
      lead: "Connect a Notion database so tasks entered in the hotkey popup are saved there.",
      languageLabel: "Language",
      languageJa: "日本語",
      languageEn: "English",
      tokenLabel: "Integration Token",
      databaseUrlLabel: "Database URL",
      databaseUrlPlaceholder: "https://www.notion.so/xxxx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      detectButton: "Test connection / detect properties",
      detecting: "Checking...",
      detectSuccess: (titleProperty) => `Connected successfully (title property: ${titleProperty})`,
      detectGenericError: "Failed to connect",
      datePropertyLabel: "Date property to use for due dates",
      hotkeyLabel: "Hotkey",
      autostartLabel: "Launch automatically when Windows starts",
      helpTitle: "Notion setup steps",
      helpStep1Prefix: "Create a new integration on Notion's ",
      helpStep1LinkText: "My integrations",
      helpStep1Suffix: " page, then copy the Internal Integration Secret it shows into the field above",
      helpStep2: "Open the Notion database you want to add tasks to",
      helpStep3: "From the \"•••\" menu in the top right, choose \"Connect to\" and select the integration you created",
      helpStep4: "Copy the database's URL, paste it into the \"Database URL\" field above, and press \"Test connection\"",
      saveButton: "Save",
      saving: "Saving...",
      saveSuccess: "Settings saved",
      saveGenericError: "Failed to save settings",
    },
  },
};

export function getTranslations(language: Language | string | undefined): Translations {
  return translations[language === "en" ? "en" : "ja"];
}
