"use client";

/** 管理端 · 报表导出：时间区间 + 活动名多选导出 Excel，底部表格联动刷新报名明细。 */
import { useEffect, useState } from "react";
import { exportActivity, fuzzyExportActivityName } from "@/api/admin";
import { downloadBase64, gql } from "@/api/graphql";

interface ApplyRow {
  id: number;
  order: string;
  activity_name: string;
  name: string;
  number: string;
  grade: string;
  email: string;
  info_1: string;
  time: string;
}

export default function ReportExportPage() {
  const [fuzzy, setFuzzy] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rows, setRows] = useState<ApplyRow[]>([]);
  const [message, setMessage] = useState("");

  const toMs = (local: string) => (local ? String(new Date(local).getTime()) : null);

  // 活动名模糊搜索
  useEffect(() => {
    fuzzyExportActivityName(fuzzy).then((r) => {
      if (r.code === 200 && r.parsed) setCandidates(r.parsed.name_list);
    });
  }, [fuzzy]);

  // 底部表格联动实时刷新报名明细
  useEffect(() => {
    gql<{ total: number; list: ApplyRow[] }>(`query ($input: QueryDataInput!) {
      search_query_data(input: $input) { code message data }
    }`, {
      input: {
        title: selected,
        start_time: toMs(startTime) ? Number(toMs(startTime)) : null,
        end_time: toMs(endTime) ? Number(toMs(endTime)) : null,
        offset: 1,
        limit: 50,
      },
    }).then((r) => {
      if (r.code === 200 && r.parsed) setRows(r.parsed.list);
    });
  }, [selected, startTime, endTime]);

  const doExport = async () => {
    const res = await exportActivity({
      activity_list: selected,
      start_time: toMs(startTime),
      end_time: toMs(endTime),
    });
    if (res.code === 200) downloadBase64(res.file_name, res.file_base64);
    else setMessage(res.message);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">报表导出</h2>
      {message && <p className="text-sm text-red-600">{message}</p>}

      <div className="flex flex-wrap items-end gap-3 rounded bg-white p-4 shadow">
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">活动名搜索</span>
          <input className="rounded border px-3 py-2" value={fuzzy}
            onChange={(e) => setFuzzy(e.target.value)} placeholder="输入前缀..." />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">开始时间</span>
          <input type="datetime-local" className="rounded border px-3 py-2" value={startTime}
            onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-600">结束时间</span>
          <input type="datetime-local" className="rounded border px-3 py-2" value={endTime}
            onChange={(e) => setEndTime(e.target.value)} />
        </label>
        <button className="rounded bg-[#7a0026] px-4 py-2 text-white" onClick={doExport}>
          导出 Excel
        </button>
      </div>

      <div className="rounded bg-white p-4 shadow">
        <div className="mb-2 text-sm font-medium">活动多选（已选 {selected.length}）</div>
        <div className="flex flex-wrap gap-2">
          {candidates.map((name) => {
            const active = selected.includes(name);
            return (
              <button key={name}
                className={`rounded border px-3 py-1 text-sm ${active ? "bg-[#7a0026] text-white" : ""}`}
                onClick={() => setSelected(active ? selected.filter((s) => s !== name) : [...selected, name])}>
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["订单号", "活动", "姓名", "学号", "年级", "邮箱", "话题", "报名时间"].map((h) => (
                <th key={h} className="px-3 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.order}</td>
                <td className="px-3 py-2">{r.activity_name}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.number}</td>
                <td className="px-3 py-2">{r.grade}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.info_1}</td>
                <td className="px-3 py-2">{r.time}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
