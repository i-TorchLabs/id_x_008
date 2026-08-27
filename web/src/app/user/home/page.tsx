"use client";

/** 学生首页：活动列表 + 日历视图（周/月/日切换），按状态着色。 */
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { type ActivityItem, getUserActivityList } from "@/api/user";
import CalendarComponent from "@/components/CalendarComponent";

const STATE_BADGE: Record<string, string> = {
  Open: "bg-green-100 text-green-700",
  Full: "bg-amber-100 text-amber-700",
  Closed: "bg-gray-200 text-gray-500",
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="rounded border px-3 py-2"
          placeholder="搜索活动名..."
          value={fuzzy}
          onChange={(e) => setFuzzy(e.target.value)}
        />
        <button
          className="rounded bg-[#7a0026] px-4 py-2 text-white"
          onClick={() => { setPage(1); load(1, fuzzy); }}
        >
          搜索
        </button>
        <div className="ml-auto flex gap-2">
          <button
            className={`rounded px-3 py-2 ${view === "list" ? "bg-[#7a0026] text-white" : "border"}`}
            onClick={() => setView("list")}
          >
            列表
          </button>
          <button
            className={`rounded px-3 py-2 ${view === "calendar" ? "bg-[#7a0026] text-white" : "border"}`}
            onClick={() => setView("calendar")}
          >
            日历
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="rounded bg-white p-4 shadow">
          <CalendarComponent
            activities={items}
            onSelect={(id) => router.push(`/user/activity?id=${id}`)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.activity_id} className="flex items-center justify-between rounded bg-white p-4 shadow">
              <div>
                <div className="font-medium">{a.activity_name}</div>
                <div className="text-sm text-gray-500">
                  {dayjs(a.activity_start_time).format("YYYY-MM-DD HH:mm")} -{" "}
                  {dayjs(a.activity_end_time).format("HH:mm")} · 顾问 {a.owner} ·{" "}
                  {a.apply_count}/{a.quota || "∞"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-1 text-xs ${STATE_BADGE[a.state]}`}>{a.state}</span>
                <button
                  className="rounded border border-[#7a0026] px-3 py-1 text-sm text-[#7a0026] disabled:opacity-40"
                  disabled={a.state !== "Open"}
                  onClick={() => router.push(`/user/activity?id=${a.activity_id}`)}
                >
                  预约
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-4 text-sm">
            <button
              className="rounded border px-3 py-1 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); load(page - 1); }}
            >
              上一页
            </button>
            <span>第 {page} 页 / 共 {total} 条</span>
            <button
              className="rounded border px-3 py-1 disabled:opacity-40"
              disabled={page * 10 >= total}
              onClick={() => { setPage(page + 1); load(page + 1); }}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
