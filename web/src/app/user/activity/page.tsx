"use client";

/** 报名页：活动详情 + 结构化话题单选（已占用置灰）+ 报名结果反馈。 */
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { type ActivityItem, applyActivity, getUserActivityDetail } from "@/api/user";
import { useUser } from "@/stores/userStore";
import {
  Badge, Card, EmptyState, ErrorText, FieldLabel, PageTitle, PillButton,
} from "@/components/ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

const TOPICS = ["Academic Planning", "Exchange Application", "Internship & Career", "Graduate Application", "Other"];

const stateBadge = (state: string) => {
  if (state === "Open") return <Badge bg={tokens.accent} color={tokens.accentFg}>Open</Badge>;
  if (state === "Full") return <Badge bg="transparent" color={tokens.fg} border={tokens.fg}>Full</Badge>;
  if (state === "Closed") return <Badge bg={tokens.badgeBg} color={tokens.fg3}>Closed</Badge>;
  return <Badge bg={tokens.badgeBg} color={tokens.fg3}>{state}</Badge>;
};

/** 后端 ISO 时间字符串 "2026-10-13T09:00" -> "10/13/2026 09:00"（本地显示）。 */
function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

type ApplyStatus = "idle" | "submitting" | "success" | "error";

function ApplyPageInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [detail, setDetail] = useState<ActivityItem | null>(null);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ApplyStatus>("idle");
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setLoadError("Missing activity ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    getUserActivityDetail(id).then((r) => {
      if (cancelled) return;
      if (r.code === 200 && r.parsed) {
        setDetail(r.parsed);
      } else {
        setLoadError(r.message || "Failed to load this activity.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  // 切换活动时重置报名状态，避免残留上一次结果
  useEffect(() => {
    setTopic("");
    setMessage("");
    setStatus("idle");
  }, [id]);

  const submit = async () => {
    if (!user || !detail || !topic || status !== "idle") return;
    setStatus("submitting");
    setMessage("");
    try {
      const res = await applyActivity({
        user_id: user.user_id,
        activity_id: String(detail.activity_id),
        info_1: topic,
      });
      if (res.code === 200) {
        setStatus("success");
        setMessage("Your application has been submitted successfully.");
      } else {
        setStatus("error");
        setMessage(res.message);
      }
    } catch {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  // 净化后端富文本（管理员产），剔除脚本/事件处理器，防御存储型 XSS
  const cleanContent = useMemo(() => {
    if (!detail?.content) return "";
    if (typeof window === "undefined") return detail.content;
    return DOMPurify.sanitize(detail.content, { USE_PROFILES: { html: true } });
  }, [detail?.content]);

  // ── 加载中状态 ──
  if (loading) {
    return (
      <Card noPadding>
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg3 }}>Loading activity…</div>
        </div>
      </Card>
    );
  }

  // ── 加载失败 / 活动不存在状态 ──
  if (!detail) {
    return (
      <Card noPadding>
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <EmptyState>{loadError || "Activity not found."}</EmptyState>
          <PillButton onClick={() => router.push("/user/home")}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Activities
          </PillButton>
        </div>
      </Card>
    );
  }

  // ── 报名成功状态 ──
  if (status === "success") {
    return (
      <Card noPadding>
        <div style={{ maxWidth: "460px", margin: "0 auto", textAlign: "center", padding: "56px 24px" }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: "48px", height: "48px", margin: "0 auto 16px", borderRadius: "50%",
              background: tokens.success, color: "#ffffff",
            }}
          >
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <PageTitle>Application Submitted</PageTitle>
          <p style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg2, margin: "12px 0 24px", lineHeight: 1.6 }}>
            You applied to <strong style={{ color: tokens.fg }}>{detail.activity_name}</strong> with topic{" "}
            <strong style={{ color: tokens.fg }}>{topic}</strong>. A confirmation has been recorded.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <PillButton onClick={() => router.push("/user/home")}>Back to Activities</PillButton>
            <PillButton primary onClick={() => router.push("/user/records")}>View My Records</PillButton>
          </div>
        </div>
      </Card>
    );
  }

  const isClosed = detail.state === "Closed";
  const isFull = detail.state === "Full";
  const canApply = detail.state === "Open";

  return (
    <div style={{ maxWidth: "1800px", margin: "0 auto" }}>
      <Card noPadding>
        <div style={{ padding: "28px" }}>
          {/* 返回 + 标题 + 状态 */}
          <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: "16px" }}>
            <PillButton onClick={() => router.push("/user/home")}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </PillButton>
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              <PageTitle>{detail.activity_name}</PageTitle>
              {stateBadge(detail.state)}
            </div>
          </div>

          {/* 活动元信息 */}
          <div
            style={{
              display: "flex", flexWrap: "wrap", gap: "20px",
              fontFamily: SF_TEXT, fontSize: "13px", color: tokens.fg2,
              paddingBottom: "16px", borderBottom: `1px solid ${tokens.divider}`, marginBottom: "16px",
            }}
          >
            <div>
              <span style={{ color: tokens.fg3 }}>Advisor:</span> {detail.owner}
            </div>
            <div>
              <span style={{ color: tokens.fg3 }}>Time:</span>{" "}
              {formatDateTime(detail.activity_start_time)} – {formatDateTime(detail.activity_end_time)}
            </div>
            <div>
              <span style={{ color: tokens.fg3 }}>Applied:</span> {detail.apply_count}/{detail.quota ? detail.quota : "∞"}
            </div>
            <div>
              <span style={{ color: tokens.fg3 }}>Apply:</span>{" "}
              {formatDateTime(detail.apply_start_time)} – {formatDateTime(detail.apply_end_time)}
            </div>
          </div>

          {/* 富文本内容 */}
          <div
            className="prose"
            style={{
              fontFamily: SF_TEXT,
              fontSize: "14px",
              color: tokens.fg2,
              letterSpacing: "-0.1px",
              lineHeight: 1.6,
              paddingBottom: "16px",
              borderBottom: `1px solid ${tokens.divider}`,
              marginBottom: "20px",
            }}
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />

          {/* 话题选择 */}
          <div style={{ marginBottom: "20px" }}>
            <FieldLabel>Select a Topic</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {TOPICS.map((t) => {
                const occupied = detail.occupied_topics?.includes(t);
                const checked = topic === t;
                const disabled = occupied || !canApply;
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: SF_TEXT,
                      fontSize: "13px",
                      color: disabled ? tokens.fg4 : tokens.fg2,
                      minHeight: "28px",
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="topic"
                      disabled={disabled}
                      checked={checked}
                      onChange={() => setTopic(t)}
                      style={{ accentColor: tokens.accent, width: "14px", height: "14px", cursor: disabled ? "not-allowed" : "pointer" }}
                    />
                    {t}
                    {occupied && " (Occupied)"}
                  </label>
                );
              })}
            </div>
          </div>

          {/* 报名提示 / 错误 */}
          {!canApply && (
            <div
              style={{
                fontFamily: SF_TEXT, fontSize: "13px", color: tokens.error,
                marginBottom: "12px",
              }}
            >
              {isFull
                ? "This activity is full and no longer accepting applications."
                : isClosed
                  ? "This activity is closed and no longer accepting applications."
                  : "This activity is not accepting applications at this time."}
            </div>
          )}
          {status === "error" && message && <ErrorText>{message}</ErrorText>}

          {/* 报名按钮 */}
          <PillButton
            primary
            disabled={!canApply || !topic || status === "submitting"}
            onClick={submit}
          >
            {status === "submitting"
              ? "Submitting…"
              : !canApply
                ? isFull ? "Full" : isClosed ? "Closed" : "Unavailable"
                : "Submit Application"}
          </PillButton>
        </div>
      </Card>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div style={{ fontFamily: SF_TEXT, color: tokens.fg3, textAlign: "center", padding: "48px 0" }}>Loading...</div>}>
      <ApplyPageInner />
    </Suspense>
  );
}
