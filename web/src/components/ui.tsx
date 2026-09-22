"use client";

// UI 原语库 — 复刻 naive-ui（id_x_204 sme_cdc_enlist_aa_vue）的设计语言：
// 3px 圆角卡片/按钮、描边数据表、n-tag 状态标签、n-dialog 弹层。
import React from "react";
import { createPortal } from "react-dom";
import { SF_DISPLAY, SF_MONO, SF_TEXT, tokens } from "@/utils/tokens";

// ── Card：n-card 风格（白底 + 1px 描边 + 3px 圆角） ──
export const Card = ({
  children,
  className = "",
  style,
  noPadding,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
}) => (
  <div
    className={`overflow-hidden ${className}`}
    style={{
      background: tokens.card,
      border: `1px solid ${tokens.divider}`,
      borderRadius: "3px",
      ...style,
    }}
  >
    {noPadding ? children : <div style={{ padding: "20px" }}>{children}</div>}
  </div>
);

// ── Button：n-button 风格（3px 圆角、34px 高） ──
export const PillButton = ({
  children,
  onClick,
  disabled,
  primary,
  danger,
  small,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  type?: "button" | "submit" | "reset";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="transition-opacity duration-150 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
    style={{
      fontFamily: SF_TEXT,
      fontSize: small ? "13px" : "14px",
      fontWeight: 500,
      background: primary ? tokens.accent : "transparent",
      color: primary ? tokens.accentFg : danger ? tokens.error : tokens.fg,
      border: primary
        ? `1px solid ${tokens.accent}`
        : `1px solid ${danger ? tokens.error : tokens.inputBorder}`,
      borderRadius: "3px",
      height: small ? "28px" : "34px",
      padding: small ? "0 12px" : "0 15px",
      cursor: disabled ? "not-allowed" : "pointer",
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
    }}
  >
    {children}
  </button>
);

// ── SortOrderButton：ID 排序切换（升序 ↑ / 降序 ↓） ──
export type SortOrder = "asc" | "desc";

export const SortOrderButton = ({
  order,
  onChange,
  small,
}: {
  order: SortOrder;
  onChange: (order: SortOrder) => void;
  small?: boolean;
}) => (
  <PillButton small={small} onClick={() => onChange(order === "asc" ? "desc" : "asc")}>
    ID {order === "asc" ? "↑" : "↓"}
  </PillButton>
);

// ── Badge：n-tag 风格（3px 圆角小标签） ──
export const Badge = ({
  children,
  bg,
  color,
  border,
  mono,
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  border?: string;
  mono?: boolean;
}) => (
  <span
    className="inline-flex items-center"
    style={{
      fontFamily: mono ? SF_MONO : SF_TEXT,
      fontSize: "12px",
      fontWeight: 500,
      color: color ?? tokens.fg2,
      background: bg ?? tokens.badgeBg,
      border: border ? `1px solid ${border}` : "none",
      borderRadius: "3px",
      padding: "2px 8px",
      whiteSpace: "nowrap",
      lineHeight: 1.4,
    }}
  >
    {children}
  </span>
);

// ── FieldLabel：n-form-item 标签 ──
export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: SF_TEXT,
      fontSize: "13px",
      fontWeight: 500,
      color: tokens.fg2,
      marginBottom: "6px",
    }}
  >
    {children}
  </div>
);

// ── 输入框基础样式（n-input：白底 + #e0e0e6 描边 + 3px 圆角） ──
export const inputBaseStyle: React.CSSProperties = {
  fontFamily: SF_TEXT,
  fontSize: "14px",
  color: tokens.fg,
  backgroundColor: tokens.inputBg,
  border: `1px solid ${tokens.inputBorder}`,
  borderRadius: "3px",
  padding: "8px 12px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

// ── 页面标题 ──
export const PageTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    style={{
      fontFamily: SF_DISPLAY,
      fontSize: "18px",
      fontWeight: 600,
      color: tokens.fg,
      margin: 0,
    }}
  >
    {children}
  </h2>
);

// ── 表格样式（n-data-table bordered：全描边 + 表头 #fafafc） ──
export const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontFamily: SF_TEXT,
  fontSize: "14px",
  border: `1px solid ${tokens.divider}`,
  borderRadius: "3px",
};

export const thStyle: React.CSSProperties = {
  textAlign: "left",
  color: tokens.fg,
  fontWeight: 500,
  padding: "12px",
  background: tokens.tableHeadBg,
  borderBottom: `1px solid ${tokens.divider}`,
  borderRight: `1px solid ${tokens.divider}`,
  fontSize: "14px",
  whiteSpace: "nowrap",
};

export const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: `1px solid ${tokens.divider}`,
  borderRight: `1px solid ${tokens.divider}`,
  color: tokens.fg2,
  whiteSpace: "nowrap",
};

export const tdPrimaryStyle: React.CSSProperties = {
  ...tdStyle,
  color: tokens.fg,
  fontWeight: 500,
};

export const tdMonoStyle: React.CSSProperties = {
  ...tdStyle,
  fontFamily: SF_MONO,
  fontSize: "13px",
};

// ── 空态 ──
export const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: SF_TEXT,
      fontSize: "14px",
      color: tokens.fg3,
      textAlign: "center",
      padding: "48px 0",
    }}
  >
    {children}
  </div>
);

// ── 错误行 ──
export const ErrorText = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: SF_TEXT,
      fontSize: "13px",
      color: tokens.error,
      marginBottom: "12px",
    }}
  >
    {children}
  </div>
);

// ── LoadingDots：三点脉冲加载 ──
export const LoadingDots = ({ size = "md" }: { size?: "sm" | "md" }) => {
  const d = size === "sm" ? 4 : 6;
  return (
    <span className="iao-loading-dots" style={{ display: "inline-flex", gap: d }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: d,
            height: d,
            borderRadius: "50%",
            background: "currentColor",
            animation: `iao-dot-pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  );
};

// ── Modal：n-dialog 风格（白底 8px 圆角 + 遮罩） ──
export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: tokens.card,
          borderRadius: "8px",
          boxShadow: tokens.shadow,
          padding: "20px",
          width: "100%",
          maxWidth: width,
          maxHeight: "85vh",
          overflowY: "auto",
          margin: "0 16px",
        }}
      >
        <div
          style={{
            fontFamily: SF_TEXT,
            fontSize: "18px",
            fontWeight: 600,
            color: tokens.fg,
            marginBottom: "16px",
          }}
        >
          {title}
        </div>
        <div>{children}</div>
        {footer && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              marginTop: "20px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ── RadioButtonGroup：n-radio-group（分段按钮组） ──
export const RadioButtonGroup = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) => (
  <span style={{ display: "inline-flex" }}>
    {options.map((o, i) => {
      const active = o.value === value;
      return (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="transition-colors duration-150"
          style={{
            fontFamily: SF_TEXT,
            fontSize: "14px",
            fontWeight: active ? 500 : 400,
            height: "34px",
            padding: "0 15px",
            cursor: "pointer",
            background: active ? tokens.accent : tokens.card,
            color: active ? tokens.accentFg : tokens.fg2,
            border: `1px solid ${active ? tokens.accent : tokens.inputBorder}`,
            borderLeft: i === 0 ? undefined : "none",
            borderRadius: i === 0 ? "3px 0 0 3px" : i === options.length - 1 ? "0 3px 3px 0" : "none",
            whiteSpace: "nowrap",
          }}
        >
          {o.label}
        </button>
      );
    })}
  </span>
);

// ── DateTimePicker：英文界面日期时间选择器 ──
// 原生 datetime-local 的年/月/日文案随浏览器语言，无法页面级控制；
// 故自绘英文日历弹层。value / onChange 仍为本地 ISO "YYYY-MM-DDTHH:mm"。
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function fmtIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDisplay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const DateTimePicker = ({
  value,
  onChange,
  placeholder = "MM/DD/YYYY HH:mm",
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
}) => {
  const selected = parseIso(value);
  const [open, setOpen] = React.useState(false);
  const [popupPos, setPopupPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [viewYear, setViewYear] = React.useState(() => selected?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = React.useState(() => selected?.getMonth() ?? new Date().getMonth());
  const rootRef = React.useRef<HTMLDivElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const d = parseIso(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // 打开时按输入框视口坐标计算弹层位置（fixed 定位 + body 挂载，不受父级裁剪）
  const openPopup = () => {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const POPUP_W = 280;
      const POPUP_H = 380;
      let top = rect.bottom + 6;
      let left = rect.left;
      // 视口下缘不足时向上翻转；右缘不足时左移收回
      if (top + POPUP_H > window.innerHeight - 8) {
        top = Math.max(8, rect.top - POPUP_H - 6);
      }
      if (left + POPUP_W > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - POPUP_W - 8);
      }
      setPopupPos({ top, left });
    }
    setOpen((v) => !v);
  };

  // 点击外部关闭（弹层经 Portal 挂载在 body，需一并判定）
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        rootRef.current && !rootRef.current.contains(t) &&
        popRef.current && !popRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const first = new Date(viewYear, viewMonth, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pickDay = (day: number) => {
    const base = selected ?? new Date();
    const d = new Date(viewYear, viewMonth, day, base.getHours(), base.getMinutes());
    onChange(fmtIso(d));
  };

  const setTime = (hh: number, mm: number) => {
    const base = selected ?? new Date();
    const d = new Date(base);
    d.setHours(hh, mm, 0, 0);
    onChange(fmtIso(d));
  };

  const navBtn: React.CSSProperties = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: tokens.fg2,
    padding: "4px 10px",
    borderRadius: "3px",
    lineHeight: 1,
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input
        lang="en"
        readOnly
        style={{ ...inputBaseStyle, cursor: "pointer" }}
        placeholder={placeholder}
        value={selected ? fmtDisplay(selected) : ""}
        onClick={openPopup}
      />
      {open && createPortal(
        <div
          ref={popRef}
          style={{
            position: "fixed",
            zIndex: 1000,
            top: popupPos.top,
            left: popupPos.left,
            background: tokens.card,
            border: `1px solid ${tokens.divider}`,
            borderRadius: "8px",
            boxShadow: tokens.shadow,
            padding: "12px",
            width: "280px",
          }}
        >
          {/* 月份导航 */}
          <div className="flex items-center justify-between" style={{ marginBottom: "8px" }}>
            <button
              type="button"
              style={navBtn}
              onClick={() => {
                const d = new Date(viewYear, viewMonth - 1, 1);
                setViewYear(d.getFullYear());
                setViewMonth(d.getMonth());
              }}
            >
              ‹
            </button>
            <span style={{ fontFamily: SF_TEXT, fontSize: "14px", fontWeight: 600, color: tokens.fg }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              style={navBtn}
              onClick={() => {
                const d = new Date(viewYear, viewMonth + 1, 1);
                setViewYear(d.getFullYear());
                setViewMonth(d.getMonth());
              }}
            >
              ›
            </button>
          </div>

          {/* 星期表头 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px" }}>
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: "12px",
                  color: tokens.fg3,
                  textAlign: "center",
                  padding: "4px 0",
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const isSel =
                selected &&
                selected.getFullYear() === viewYear &&
                selected.getMonth() === viewMonth &&
                selected.getDate() === day;
              const now = new Date();
              const isToday =
                now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  className="transition-colors duration-100"
                  style={{
                    fontFamily: SF_TEXT,
                    fontSize: "13px",
                    height: "30px",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    background: isSel ? tokens.accent : "transparent",
                    color: isSel ? tokens.accentFg : tokens.fg,
                    fontWeight: isSel || isToday ? 600 : 400,
                    outline: isToday && !isSel ? `1px solid ${tokens.accent}` : "none",
                    outlineOffset: "-1px",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* 时间选择 */}
          <div
            className="flex items-center gap-2"
            style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${tokens.divider}` }}
          >
            <span style={{ fontFamily: SF_TEXT, fontSize: "13px", color: tokens.fg3 }}>Time</span>
            <select
              lang="en"
              style={{ ...inputBaseStyle, width: "auto", padding: "4px 8px", appearance: "none" }}
              value={selected ? selected.getHours() : new Date().getHours()}
              onChange={(e) => setTime(Number(e.target.value), selected?.getMinutes() ?? 0)}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
              ))}
            </select>
            <span style={{ color: tokens.fg3 }}>:</span>
            <select
              lang="en"
              style={{ ...inputBaseStyle, width: "auto", padding: "4px 8px", appearance: "none" }}
              value={selected ? selected.getMinutes() : 0}
              onChange={(e) => setTime(selected?.getHours() ?? new Date().getHours(), Number(e.target.value))}
            >
              {Array.from({ length: 60 }, (_, m) => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>
          </div>
          {/* 操作按钮 */}
          <div className="flex justify-end gap-2" style={{ marginTop: "8px" }}>
            <PillButton
              small
              onClick={() => {
                onChange(fmtIso(new Date()));
              }}
            >
              Now
            </PillButton>
            <PillButton
              small
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </PillButton>
            <PillButton small primary onClick={() => setOpen(false)}>
              OK
            </PillButton>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
