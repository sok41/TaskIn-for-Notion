import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Popup from "./windows/Popup";
import Settings from "./windows/Settings";
import "./styles.css";

function resolveWindowKind(): "popup" | "settings" {
  // Tauriのウィンドウlabelを最優先で使う。ブラウザ単体プレビュー時はクエリパラメータで代用する。
  const label = getCurrentWindow().label;
  if (label === "settings") return "settings";
  if (label === "popup") return "popup";

  const query = new URLSearchParams(window.location.search).get("window");
  return query === "settings" ? "settings" : "popup";
}

const kind = resolveWindowKind();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{kind === "settings" ? <Settings /> : <Popup />}</React.StrictMode>,
);
