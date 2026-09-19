"use client";

/** 报名页：活动详情 + 结构化话题单选（已占用置灰）。 */
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { type ActivityItem, applyActivity, getUserActivityDetail } from "@/api/user";
import { useUser } from "@/stores/userStore";
import { Badge, Card, ErrorText, FieldLabel, PageTitle, PillButton } from "@/components/ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

const TOPICS = ["Academic Planning", "Exchange Application", "Internship & Career", "Graduate Application", "Other"];

const stateBadge = (state: string) => {
  if (state === "Open") return <Badge bg={tokens.accent} color={tokens.accentFg}>Open</Badge>;
  if (state === "Full") return <Badge bg="transparent" color={tokens.fg} border={tokens.fg}>Full</Badge>;
  if (state === "Closed") return <Badge bg={tokens.badgeBg} color={tokens.fg3}>Closed</Badge>;
  return <Badge bg={tokens.badgeBg} color={tokens.fg3}>{state}</Badge>;
};

function ApplyPageInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [detail, setDetail] = useState<ActivityItem | null>(null);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    getUserActivityDetail(id).then((r) => {
      if (r.code === 200 && r.parsed) setDetail(r.parsed);
      else setMessage(r.message);
    });
  }, [id]);

  const submit = async () => {
    if (!user || !detail || !topic) return;
    const res = await applyActivity({
      user_id: user.user_id,
      activity_id: String(detail.activity_id),
      info_1: topic,
    });
    if (res.code === 200) {
      router.replace("/user/records");
    } else {
      setMessage(res.message);
    }
  };

  if (!detail) {
    return (
      <div style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg3, textAlign: "center", padding: "48px 0" }}>
        {message || "Loading..."}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <Card noPadding>
        <div style={{ padding: "28px" }}>
          <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: "8px" }}>
            <PageTitle>{detail.activity_name}</PageTitle>
            {stateBadge(detail.state)}
          </div>
          <p
            style={{
              fontFamily: SF_TEXT,
              fontSize: "13px",
              color: tokens.fg3,
              letterSpacing: "-0.1px",
              margin: "0 0 16px",
            }}
          >
            Advisor: {detail.owner}
          </p>
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
            dangerouslySetInnerHTML={{ __html: detail.content || "" }}
          />

          <div style={{ marginBottom: "20px" }}>
            <FieldLabel>Select a Topic</FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {TOPICS.map((t) => {
                const occupied = detail.occupied_topics?.includes(t);
                const checked = topic === t;
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: SF_TEXT,
                      fontSize: "13px",
                      color: occupied ? tokens.fg4 : tokens.fg2,
                      minHeight: "28px",
                      cursor: occupied ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="topic"
                      disabled={occupied}
                      checked={checked}
                      onChange={() => setTopic(t)}
                      style={{ accentColor: tokens.accent, width: "14px", height: "14px", cursor: occupied ? "not-allowed" : "pointer" }}
                    />
                    {t}
                    {occupied && " (Occupied)"}
                  </label>
                );
              })}
            </div>
          </div>

          {message && <ErrorText>{message}</ErrorText>}
          <PillButton
            primary
            disabled={!topic || detail.state !== "Open"}
            onClick={submit}
          >
            Submit Application
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
