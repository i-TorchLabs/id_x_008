// Design tokens — 复刻 id_x_204 sme_cdc_enlist_aa_vue（naive-ui）风格。
// 主题紫 #763890，内容底 #f0f2f5，白卡描边 #efeff5。
// 所有组件 MUST 从这里取值，防止数值漂移。

export const SF_DISPLAY = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
export const SF_TEXT = '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
export const SF_MONO = '"SF Mono", Menlo, monospace';

export interface DesignTokens {
  bg: string;
  card: string;
  fg: string;
  fg2: string;
  fg3: string;
  fg4: string;
  accent: string;
  accentFg: string;
  accentSoft: string;
  error: string;
  navBg: string;
  inputBg: string;
  inputBorder: string;
  divider: string;
  shadow: string;
  badgeBg: string;
  iconContainerBg: string;
  errorBg: string;
  errorBorder: string;
  tableHeadBg: string;
}

// naive-ui 浅色主题 + 项目紫
export const tokens: DesignTokens = {
  bg: "#f0f2f5",
  card: "#ffffff",
  fg: "#1f2225",
  fg2: "rgba(0,0,0,0.75)",
  fg3: "rgba(0,0,0,0.45)",
  fg4: "rgba(0,0,0,0.25)",
  accent: "#763890",
  accentFg: "#ffffff",
  accentSoft: "rgba(118,56,144,0.12)",
  error: "#d03050",
  navBg: "#763890",
  inputBg: "#ffffff",
  inputBorder: "#e0e0e6",
  divider: "#efeff5",
  shadow: "0 1px 2px -2px rgba(0,0,0,0.08), 0 3px 6px 0 rgba(0,0,0,0.06), 0 5px 12px 4px rgba(0,0,0,0.04)",
  badgeBg: "rgba(0,0,0,0.06)",
  iconContainerBg: "transparent",
  errorBg: "rgba(208,48,80,0.08)",
  errorBorder: "rgba(208,48,80,0.25)",
  tableHeadBg: "#fafafc",
};

export const cardHighlight = "none";
export const cardShadow = tokens.shadow;

export const ease = [0.25, 0.4, 0.25, 1] as [number, number, number, number];
