"use client";

/** 学生首页：复刻 id_x_204 UserHomeView ——
 *  紫色横幅卡 + 白色筛选条 + 视图切换（n-radio-group）+ 描边数据表 / 日历。 */
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { type ActivityItem, getUserActivityList } from "@/api/user";
import CalendarComponent from "@/components/CalendarComponent";
import {
  Badge, Card, EmptyState, PillButton, RadioButtonGroup,
  inputBaseStyle, tableStyle, tdMonoStyle, tdPrimaryStyle, tdStyle, thStyle,
} from "@/components/ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

const stateBadge = (state: string) => {
  if (state === "Open")
    return <Badge bg="rgba(24,160,88,0.12)" color="#18a058">Open</Badge>;
  if (state === "Full")
    return <Badge bg="rgba(208,48,80,0.12)" color="#d03050">Full</Badge>;
  if (state === "Closed")
    return <Badge bg="rgba(0,0,0,0.06)" color={tokens.fg3}>Closed</Badge>;
  return <Badge bg={tokens.badgeBg} color={tokens.fg3}>{state}</Badge>;
};

export default function UserHomePage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [fuzzy, setFuzzy] = useState("");
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const load = useCallback(async (p = page, f = fuzzy) => {
    const res = await getUserActivityList({ offset: p, limit: 10, fuzzy_name: f });
    if (res.code === 200 && res.parsed) {
      setItems(res.parsed.list);
      setTotal(res.parsed.total);
    }
  }, [page, fuzzy]);

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontFamily: SF_TEXT }}>
      {/* ── 紫色横幅卡 ── */}
      <Card style={{ background: tokens.accent, border: "none", textAlign: "center" }}>
        <span style={{ fontSize: "24px", color: "#fff", fontWeight: 500 }}>
          SME IAO 1v1 Consulting Program
        </span>
      </Card>

      {/* ── 筛选条 ── */}
      <Card noPadding>
        <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: "12px 20px" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ fontSize: "14px", color: tokens.fg2 }}>Title</span>
            <div style={{ width: "220px" }}>
              <input
                style={inputBaseStyle}
                placeholder="Please Input Title"
                value={fuzzy}
                onChange={(e) => setFuzzy(e.target.value)}
              />
            </div>
            <PillButton onClick={() => { setPage(1); load(1, fuzzy); }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Search
            </PillButton>
          </div>
          <PillButton primary onClick={() => router.push("/user/records")}>
            My Records
          </PillButton>
        </div>
      </Card>

      {/* ── 日期 / 视图切换条 ── */}
      <Card noPadding>
        <div className="flex items-center justify-between" style={{ padding: "8px 20px" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Date</span>
            <Badge>{dayjs().format("YYYY-MM-DD")}</Badge>
            <Badge bg={tokens.accentSoft} color={tokens.accent}>{dayjs().format("dddd")}</Badge>
          </div>
          <RadioButtonGroup
            options={[
              { value: "list", label: "List" },
              { value: "calendar", label: "Calendar" },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      </Card>

      {/* ── 列表 / 日历 ── */}
      {view === "calendar" ? (
        <Card noPadding>
          <div style={{ padding: "8px" }}>
            <CalendarComponent
              activities={items}
              onSelect={(id) => router.push(`/user/activity?id=${id}`)}
            />
          </div>
        </Card>
      ) : (
        <Card noPadding>
          {items.length === 0 ? (
            <EmptyState>No activities</EmptyState>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {["Date", "Time", "Title", "State", "Occupied", "Options"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.activity_id} data-row>
                      <td style={tdMonoStyle}>{dayjs(a.activity_start_time).format("YYYY-MM-DD")}</td>
                      <td style={tdMonoStyle}>
                        {dayjs(a.activity_start_time).format("HH:mm")} — {dayjs(a.activity_end_time).format("HH:mm")}
                      </td>
                      <td style={tdPrimaryStyle}>{a.activity_name}</td>
                      <td style={tdStyle}>{stateBadge(a.state)}</td>
                      <td style={tdMonoStyle}>{a.apply_count}/{a.quota || "∞"}</td>
                      <td style={tdStyle}>
                        <PillButton
                          primary
                          disabled={a.state !== "Open"}
                          onClick={() => router.push(`/user/activity?id=${a.activity_id}`)}
                        >
                          Apply
                        </PillButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* 分页 */}
          <div className="flex items-center justify-end gap-3" style={{ padding: "12px 20px" }}>
            <PillButton small disabled={page <= 1}
              onClick={() => { setPage(page - 1); load(page - 1); }}>Prev</PillButton>
            <span style={{ fontSize: "13px", color: tokens.fg3 }}>
              Page {page} / {total} items
            </span>
            <PillButton small disabled={page * 10 >= total}
              onClick={() => { setPage(page + 1); load(page + 1); }}>Next</PillButton>
          </div>
        </Card>
      )}
    </div>
  );
}
