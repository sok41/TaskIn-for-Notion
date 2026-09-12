import { useEffect, useState } from "react";
import { enable as enableAutostart, disable as disableAutostart } from "@tauri-apps/plugin-autostart";
import {
  detectDatabaseSchema,
  extractDatabaseId,
  getSettings,
  saveSettings,
  updateGlobalShortcut,
} from "../api";
import { getTranslations } from "../i18n";
import type { AppSettings, Language } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
  integration_token: "",
  database_id: "",
  title_property: "",
  date_property: null,
  hotkey: "Ctrl+Alt+N",
  autostart_enabled: true,
  language: "ja",
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
  const t = getTranslations(settings.language).settings;

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setDatabaseUrlInput(s.database_id);
      if (s.date_property) setDateProperties([s.date_property]);
    });
  }, []);

  const setLanguage = (language: Language) => setSettings((s) => ({ ...s, language }));

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
      setDetectMessage({ text: t.detectSuccess(schema.title_property), ok: true });
    } catch (err) {
      setDetectMessage({ text: typeof err === "string" ? err : t.detectGenericError, ok: false });
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
      setSaveMessage(t.saveSuccess);
    } catch (err) {
      setSaveState("error");
      setSaveMessage(typeof err === "string" ? err : t.saveGenericError);
    }
  };

  return (
    <div className="settings">
      <h1>{t.title}</h1>
      <p className="settings__lead">{t.lead}</p>

      <section className="settings__section">
        <label>{t.languageLabel}</label>
        <div className="settings__actions">
          <button
            type="button"
            className={`settings__button ${settings.language === "ja" ? "settings__button--primary" : ""}`}
            onClick={() => setLanguage("ja")}
          >
            {t.languageJa}
          </button>
          <button
            type="button"
            className={`settings__button ${settings.language === "en" ? "settings__button--primary" : ""}`}
            onClick={() => setLanguage("en")}
          >
            {t.languageEn}
          </button>
        </div>
      </section>

      <section className="settings__section">
        <label htmlFor="token">{t.tokenLabel}</label>
        <input
          id="token"
          type="password"
          placeholder="secret_..."
          value={settings.integration_token}
          onChange={(e) => setSettings((s) => ({ ...s, integration_token: e.target.value }))}
        />
      </section>

      <section className="settings__section">
        <label htmlFor="database">{t.databaseUrlLabel}</label>
        <input
          id="database"
          type="text"
          placeholder={t.databaseUrlPlaceholder}
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
            {detecting ? t.detecting : t.detectButton}
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
          <label htmlFor="date-property">{t.datePropertyLabel}</label>
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
        <label htmlFor="hotkey">{t.hotkeyLabel}</label>
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
          {t.autostartLabel}
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
        <label>{t.helpTitle}</label>
        <div className="settings__help">
          <ol>
            <li>
              {t.helpStep1Prefix}
              <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer">
                {t.helpStep1LinkText}
              </a>
              {t.helpStep1Suffix}
            </li>
            <li>{t.helpStep2}</li>
            <li>{t.helpStep3}</li>
            <li>{t.helpStep4}</li>
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
          {saveState === "saving" ? t.saving : t.saveButton}
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
