"use client";

/** 报名页：活动详情 + 结构化话题单选（已占用置灰）。 */
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { type ActivityItem, applyActivity, getUserActivityDetail } from "@/api/user";
import { useUser } from "@/stores/userStore";

const TOPICS = ["学业规划", "交换申请", "实习求职", "研究生申请", "其他"];

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

  if (!detail) return <div className="text-gray-500">{message || "加载中..."}</div>;

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded bg-white p-6 shadow">
      <h2 className="text-lg font-semibold">{detail.activity_name}</h2>
      <p className="text-sm text-gray-500">顾问：{detail.owner} · 状态：{detail.state}</p>
      <div
        className="prose text-sm"
        dangerouslySetInnerHTML={{ __html: detail.content || "" }}
      />
      <div className="space-y-2">
        <div className="text-sm font-medium">选择咨询话题</div>
        {TOPICS.map((t) => {
          const occupied = detail.occupied_topics?.includes(t);
          return (
            <label key={t} className={`flex items-center gap-2 ${occupied ? "text-gray-400" : ""}`}>
              <input
                type="radio"
                name="topic"
                disabled={occupied}
                checked={topic === t}
                onChange={() => setTopic(t)}
              />
              {t}{occupied && "（已占用）"}
            </label>
          );
        })}
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button
        className="w-full rounded bg-[#7a0026] py-2 text-white disabled:opacity-40"
        disabled={!topic || detail.state !== "Open"}
        onClick={submit}
      >
        提交报名
      </button>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ApplyPageInner />
    </Suspense>
  );
}
