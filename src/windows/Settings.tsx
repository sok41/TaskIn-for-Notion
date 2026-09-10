import { useEffect, useState } from "react";
import { enable as enableAutostart, disable as disableAutostart } from "@tauri-apps/plugin-autostart";
import {
  detectDatabaseSchema,
  extractDatabaseId,
  getSettings,
  saveSettings,
  updateGlobalShortcut,
} from "../api";
import type { AppSettings } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
  integration_token: "",
  database_id: "",
  title_property: "",
  date_property: null,
  hotkey: "Ctrl+Alt+N",
  autostart_enabled: true,
};

type SaveState = "idle" | "saving" | "success" | "error";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [databaseUrlInput, setDatabaseUrlInput] = useState("");
  const [dateProperties, setDateProperties] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectMessage, setDetectMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setDatabaseUrlInput(s.database_id);
      if (s.date_property) setDateProperties([s.date_property]);
    });
  }, []);

  const handleDetect = async () => {
    setDetecting(true);
    setDetectMessage(null);
    try {
      const databaseId = await extractDatabaseId(databaseUrlInput);
      const schema = await detectDatabaseSchema(settings.integration_token, databaseId);
      setSettings((prev) => ({
        ...prev,
        database_id: databaseId,
        title_property: schema.title_property,
        date_property: schema.date_properties[0] ?? null,
      }));
      setDateProperties(schema.date_properties);
      setDetectMessage({ text: `接続を確認しました（タイトル項目: ${schema.title_property}）`, ok: true });
    } catch (err) {
      setDetectMessage({ text: typeof err === "string" ? err : "接続の確認に失敗しました", ok: false });
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    setSaveState("saving");
    setSaveMessage("");
    try {
      await saveSettings(settings);
      await updateGlobalShortcut(settings.hotkey);
      if (settings.autostart_enabled) {
        await enableAutostart();
      } else {
        await disableAutostart();
      }
      setSaveState("success");
      setSaveMessage("設定を保存しました");
    } catch (err) {
      setSaveState("error");
      setSaveMessage(typeof err === "string" ? err : "設定の保存に失敗しました");
    }
  };

  return (
    <div className="settings">
      <h1>TaskIn for Notion - 設定</h1>
      <p className="settings__lead">
        ホットキーで開くポップアップから、Notionデータベースへタスクを登録するための連携設定です。
      </p>

      <section className="settings__section">
        <label htmlFor="token">Integration Token</label>
        <input
          id="token"
          type="password"
          placeholder="secret_..."
          value={settings.integration_token}
          onChange={(e) => setSettings((s) => ({ ...s, integration_token: e.target.value }))}
        />
      </section>

      <section className="settings__section">
        <label htmlFor="database">データベースURL</label>
        <input
          id="database"
          type="text"
          placeholder="https://www.notion.so/xxxx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={databaseUrlInput}
          onChange={(e) => setDatabaseUrlInput(e.target.value)}
        />
        <div className="settings__actions">
          <button
            type="button"
            className="settings__button"
            onClick={handleDetect}
            disabled={detecting || !databaseUrlInput.trim() || !settings.integration_token.trim()}
          >
            {detecting ? "確認中..." : "接続テスト / プロパティ検出"}
          </button>
        </div>
        {detectMessage && (
          <div className={`settings__message ${detectMessage.ok ? "settings__message--success" : "settings__message--error"}`}>
            {detectMessage.text}
          </div>
        )}
      </section>

      {dateProperties.length > 1 && (
        <section className="settings__section">
          <label htmlFor="date-property">期限として使う日付プロパティ</label>
          <select
            id="date-property"
            value={settings.date_property ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, date_property: e.target.value || null }))}
          >
            {dateProperties.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="settings__section">
        <label htmlFor="hotkey">ホットキー</label>
        <input
          id="hotkey"
          type="text"
          placeholder="Ctrl+Alt+N"
          value={settings.hotkey}
          onChange={(e) => setSettings((s) => ({ ...s, hotkey: e.target.value }))}
        />
      </section>

      <section className="settings__section settings__row">
        <label htmlFor="autostart" style={{ marginBottom: 0 }}>
          Windows起動時に自動起動する
        </label>
        <label className="switch">
          <input
            id="autostart"
            type="checkbox"
            checked={settings.autostart_enabled}
            onChange={(e) => setSettings((s) => ({ ...s, autostart_enabled: e.target.checked }))}
          />
          <span className="switch__track" />
        </label>
      </section>

      <section className="settings__section">
        <label>Notion側の準備手順</label>
        <div className="settings__help">
          <ol>
            <li>
              <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer">
                Notionの「My integrations」
              </a>
              で新規Integrationを作成し、表示された Internal Integration Secret をコピーして上の欄に貼り付ける
            </li>
            <li>タスクを登録したいNotionデータベースを開く</li>
            <li>
              右上の「•••」メニュー →「コネクト」から、作成したIntegrationを選んでこのデータベースと共有する
            </li>
            <li>データベースのURLをコピーし、上の「データベースURL」欄に貼り付けて「接続テスト」を押す</li>
          </ol>
        </div>
      </section>

      <div className="settings__actions">
        <button
          type="button"
          className="settings__button settings__button--primary"
          onClick={handleSave}
          disabled={saveState === "saving"}
        >
          {saveState === "saving" ? "保存中..." : "保存"}
        </button>
      </div>
      {saveMessage && (
        <div className={`settings__message ${saveState === "error" ? "settings__message--error" : "settings__message--success"}`}>
          {saveMessage}
        </div>
      )}
    </div>
  );
}
