import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getSettings, hidePopupWindow, registerTask } from "../api";
import { getTranslations } from "../i18n";
import type { Language } from "../types";

type Status = "idle" | "submitting" | "success" | "error";

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toIsoDate(d);
}

export default function Popup() {
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("ja");
  // 連続して登録する: ONの間は登録成功後もウィンドウを閉じず、入力欄だけクリアする。
  // アプリ起動直後の既定値はOFF。ポップアップの再表示(reset)では意図的に引き継ぐ。
  const [continuous, setContinuous] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const t = getTranslations(language).popup;

  const reset = () => {
    setTaskName("");
    setDueDate("");
    setStatus("idle");
    setMessage("");
    // ポップアップは使い回すため、開くたびに最新の表示言語を反映する
    getSettings()
      .then((s) => setLanguage(s.language))
      .catch(() => {});
    requestAnimationFrame(() => titleInputRef.current?.focus());
  };

  useEffect(() => {
    reset();
    const unlistenPromise = getCurrentWindow().listen("popup:reset", reset);
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => {
      if (continuous) {
        // 連続登録モード: 閉じずに入力欄だけクリアして次の入力へ進む
        setTaskName("");
        setDueDate("");
        setStatus("idle");
        setMessage("");
        requestAnimationFrame(() => titleInputRef.current?.focus());
      } else {
        hidePopupWindow();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [status, continuous]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      hidePopupWindow();
    }
  };

  const submit = async () => {
    if (!taskName.trim() || status === "submitting") return;
    setStatus("submitting");
    setMessage("");
    try {
      await registerTask(taskName.trim(), dueDate.trim() || null);
      setStatus("success");
      setMessage(t.successMessage);
    } catch (err) {
      setStatus("error");
      setMessage(typeof err === "string" ? err : t.genericError);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className="popup" onKeyDown={handleKeyDown}>
      <div className="popup__header">
        <span className="popup__header-icon">📝</span>
        <span>TaskIn for Notion</span>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          ref={titleInputRef}
          className="popup__title-input"
          placeholder={t.taskNamePlaceholder}
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          disabled={status === "submitting" || status === "success"}
          autoFocus
        />

        <hr className="popup__divider" />

        <div className="popup__due-row">
          <span className="popup__due-label">{t.dueLabel}</span>
          <button
            type="button"
            className={`pill ${dueDate === todayIso() ? "pill--active" : ""}`}
            onClick={() => setDueDate(todayIso())}
          >
            {t.today}
          </button>
          <button
            type="button"
            className={`pill ${dueDate === tomorrowIso() ? "pill--active" : ""}`}
            onClick={() => setDueDate(tomorrowIso())}
          >
            {t.tomorrow}
          </button>
          <input
            className="popup__due-input"
            placeholder={t.dueDatePlaceholder}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={status === "submitting" || status === "success"}
          />
        </div>

        <div className="popup__toggle-row">
          <label className="switch">
            <input
              type="checkbox"
              checked={continuous}
              onChange={(e) => setContinuous(e.target.checked)}
            />
            <span className="switch__track" />
          </label>
          <span className="popup__toggle-label">{t.continuousLabel}</span>
        </div>

        <div className="popup__footer">
          <span className="popup__hint">{t.hint}</span>
          <button
            type="submit"
            className="popup__submit"
            disabled={!taskName.trim() || status === "submitting" || status === "success"}
          >
            {status === "submitting" ? t.submitting : t.submit}
          </button>
        </div>

        {message && (
          <div
            className={`popup__message ${
              status === "error" ? "popup__message--error" : "popup__message--success"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
