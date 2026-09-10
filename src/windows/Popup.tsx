import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { hidePopupWindow, registerTask } from "../api";

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
  const titleInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTaskName("");
    setDueDate("");
    setStatus("idle");
    setMessage("");
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
      hidePopupWindow();
    }, 1500);
    return () => clearTimeout(timer);
  }, [status]);

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
      setMessage("Notionに登録しました");
    } catch (err) {
      setStatus("error");
      setMessage(typeof err === "string" ? err : "登録に失敗しました");
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
          placeholder="タスク名を入力"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          disabled={status === "submitting" || status === "success"}
          autoFocus
        />

        <hr className="popup__divider" />

        <div className="popup__due-row">
          <span className="popup__due-label">期限</span>
          <button
            type="button"
            className={`pill ${dueDate === todayIso() ? "pill--active" : ""}`}
            onClick={() => setDueDate(todayIso())}
          >
            今日
          </button>
          <button
            type="button"
            className={`pill ${dueDate === tomorrowIso() ? "pill--active" : ""}`}
            onClick={() => setDueDate(tomorrowIso())}
          >
            明日
          </button>
          <input
            className="popup__due-input"
            placeholder="YYYY-MM-DD"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={status === "submitting" || status === "success"}
          />
        </div>

        <div className="popup__footer">
          <span className="popup__hint">Enterで登録 / Escで閉じる</span>
          <button
            type="submit"
            className="popup__submit"
            disabled={!taskName.trim() || status === "submitting" || status === "success"}
          >
            {status === "submitting" ? "登録中..." : "登録"}
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
