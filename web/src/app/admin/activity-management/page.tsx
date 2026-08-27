"use client";

/** 管理端 · 活动管理：活动列表 + 单条创建/编辑/删除 + Excel 批量排期上传/模板下载 + 报名明细。 */
import { useCallback, useEffect, useState } from "react";
import {
  createActivity, deleteActivity, downloadActivityTemplate, getActivityDetail,
  getActivityList, updateActivity, uploadActivity,
} from "@/api/admin";
import { downloadBase64 } from "@/api/graphql";
import ActivityForm, { type ActivityFormValue } from "@/components/ActivityForm";

interface ActivityRow {
  activity_id: number;
  activity_name: string;
  project_name: string;
  state: string;
  apply_count: number;
  quota: number;
  activity_start_time: string;
  activity_end_time: string;
}

function toMs(local: string): string | null {
  return local ? String(new Date(local).getTime()) : null;
}

export default function ActivityManagementPage() {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<{ name: string; list: Record<string, unknown>[] } | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async (p = page) => {
    const res = await getActivityList({ offset: p, limit: 10 });
    if (res.code === 200 && res.parsed) {
      setItems(res.parsed.list as unknown as ActivityRow[]);
      setTotal(res.parsed.total);
    } else if (res.code === 401) {
      setMessage("未登录或会话失效（401）");
    }
  }, [page]);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitCreate = async (v: ActivityFormValue) => {
    const res = await createActivity({
      project_id: v.project_id,
      activity_name: v.activity_name || null,
      activity_start_time: toMs(v.activity_start_time),
      activity_end_time: toMs(v.activity_end_time),
      apply_start_time: toMs(v.apply_start_time),
      apply_end_time: toMs(v.apply_end_time),
    });
    setMessage(res.message);
    if (res.code === 200) { setCreating(false); load(1); }
  };

  const onUpload = async (file: File) => {
    const buf = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const res = await uploadActivity(file.name, base64);
    if (res.code === 200 && res.parsed) {
      setMessage(`上传完成：成功 ${res.parsed.success_count} 条，失败 ${res.parsed.fail_count} 条`);
      load(1);
    } else {
      setMessage(res.message);
    }
  };

  const onDownloadTemplate = async () => {
    const res = await downloadActivityTemplate();
    if (res.code === 200) downloadBase64(res.file_name, res.file_base64);
    else setMessage(res.message);
  };

  const showDetail = async (id: number) => {
    const res = await getActivityDetail(id);
    if (res.code === 200 && res.parsed) {
      setDetail({ name: res.parsed.activity_name, list: res.parsed.list });
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">活动管理</h2>
        <div className="ml-auto flex gap-2">
          <button className="rounded bg-[#7a0026] px-4 py-2 text-white"
            onClick={() => setCreating(true)}>新增活动</button>
          <button className="rounded border px-4 py-2" onClick={onDownloadTemplate}>
            下载排期模板
          </button>
          <label className="cursor-pointer rounded border px-4 py-2">
            批量上传(.xlsx)
            <input type="file" accept=".xlsx" className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </label>
        </div>
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}

      {creating && (
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 font-medium">新增活动</h3>
          <ActivityForm onSubmit={submitCreate} />
          <button className="mt-3 text-sm text-gray-500 underline" onClick={() => setCreating(false)}>
            取消
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["ID", "活动", "项目", "时间", "报名", "状态", "操作"].map((h) => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.activity_id} className="border-t">
                <td className="px-4 py-2">{a.activity_id}</td>
                <td className="px-4 py-2">{a.activity_name}</td>
                <td className="px-4 py-2">{a.project_name}</td>
                <td className="px-4 py-2">{a.activity_start_time?.slice(0, 16).replace("T", " ")}</td>
                <td className="px-4 py-2">{a.apply_count}/{a.quota || "∞"}</td>
                <td className="px-4 py-2">{a.state}</td>
                <td className="space-x-2 px-4 py-2">
                  <button className="rounded border px-2 py-1 text-xs"
                    onClick={() => showDetail(a.activity_id)}>明细</button>
                  <button className="rounded border border-red-500 px-2 py-1 text-xs text-red-600"
                    onClick={async () => {
                      if (!confirm(`确认删除活动「${a.activity_name}」？将级联删除报名。`)) return;
                      const res = await deleteActivity(a.activity_id);
                      setMessage(res.message);
                      if (res.code === 200) load();
                    }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1}
          onClick={() => { setPage(page - 1); load(page - 1); }}>上一页</button>
        <span>第 {page} 页 / 共 {total} 条</span>
        <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page * 10 >= total}
          onClick={() => { setPage(page + 1); load(page + 1); }}>下一页</button>
      </div>

      {detail && (
        <div className="rounded bg-white p-6 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">「{detail.name}」报名明细（{detail.list.length}）</h3>
            <button className="text-sm text-gray-500 underline" onClick={() => setDetail(null)}>关闭</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["订单号", "姓名", "学号", "年级", "邮箱", "话题", "报名时间"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.list.map((r) => (
                <tr key={String(r.id)} className="border-t">
                  <td className="px-3 py-2">{String(r.order)}</td>
                  <td className="px-3 py-2">{String(r.name)}</td>
                  <td className="px-3 py-2">{String(r.number)}</td>
                  <td className="px-3 py-2">{String(r.grade)}</td>
                  <td className="px-3 py-2">{String(r.email)}</td>
                  <td className="px-3 py-2">{String(r.info_1)}</td>
                  <td className="px-3 py-2">{String(r.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
