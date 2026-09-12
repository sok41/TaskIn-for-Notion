export type Language = "ja" | "en";

export interface AppSettings {
  integration_token: string;
  database_id: string;
  title_property: string;
  date_property: string | null;
  hotkey: string;
  autostart_enabled: boolean;
  language: Language;
}

export interface DatabaseSchema {
  title_property: string;
  date_properties: string[];
}
