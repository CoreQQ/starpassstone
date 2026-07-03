// Whitelisted site-setting keys (SEO overrides + announcement banner).
// Shared by the admin settings API and the metadata/layout readers.

export const SETTING_KEYS = [
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "ogTitle",
  "ogDescription",
  "announcement",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
