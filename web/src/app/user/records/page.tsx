"use client";

/** 我的记录：报名记录列表 + 取消报名（结束前 4 小时禁取消由后端校验）。 */
import { useEffect, useState } from "react";
import { type ApplyRecord, cancelApply } from "@/api/user";
import { gql } from "@/api/graphql";
import { useUser } from "@/stores/userStore";

export default function RecordsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<ApplyRecord[]>([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!user) return;
    // 后端对学生 Token 仅返回本人记录
    const res = await gql<{ total: number; list: ApplyRecord[] }>(`query ($input: QueryDataInput!) {
      search_query_data(input: $input) { code message data }
    }`, { input: { title: [], offset: 1, limit: 100 } });
    if (res.code === 200 && res.parsed) {
      setItems(res.parsed.list);
    } else if (res.code === 401) {
      setMessage("登录状态失效，请重新登录");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cancel = async (applyId: number) => {
    if (!user) return;
    const res = await cancelApply({ user_id: user.user_id, apply_id: applyId });
    if (res.code === 200) {
      load();
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">我的报名记录</h2>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["订单号", "活动", "话题", "活动时间", "报名时间", "操作"].map((h) => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.order}</td>
                <td className="px-4 py-2">{r.activity_name}</td>
                <td className="px-4 py-2">{r.info_1}</td>
                <td className="px-4 py-2">{r.activity_start_time}</td>
                <td className="px-4 py-2">{r.time}</td>
                <td className="px-4 py-2">
                  <button
                    className="rounded border border-red-500 px-2 py-1 text-xs text-red-600"
                    onClick={() => cancel(r.id)}
                  >
                    取消
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">暂无记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
