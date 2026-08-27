"use client";

/** 管理端 · 项目管理：分页列表 + 新增/编辑（富文本）/删除（级联）。 */
import { useCallback, useEffect, useState } from "react";
import {
  createProject, deleteProject, getProjectList, type ProjectItem, updateProject,
} from "@/api/admin";
import ProjectForm, { type ProjectFormValue } from "@/components/ProjectForm";

export default function ProjectManagementPage() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async (p = page) => {
    const res = await getProjectList({ offset: p, limit: 10 });
    if (res.code === 200 && res.parsed) {
      setItems(res.parsed.list);
      setTotal(res.parsed.total);
    } else if (res.code === 401) {
      setMessage("未登录或会话失效（401）");
    }
  }, [page]);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitCreate = async (v: ProjectFormValue) => {
    const res = await createProject(v);
    setMessage(res.message);
    if (res.code === 200) { setCreating(false); load(1); }
  };

  const submitUpdate = async (v: ProjectFormValue) => {
    if (!editing) return;
    const res = await updateProject({ project_id: editing.project_id, ...v });
    setMessage(res.message);
    if (res.code === 200) { setEditing(null); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">项目管理</h2>
        <button
          className="rounded bg-[#7a0026] px-4 py-2 text-white"
          onClick={() => { setCreating(true); setEditing(null); }}
        >
          新增项目
        </button>
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}

      {(creating || editing) && (
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 font-medium">{creating ? "新增项目" : `编辑项目 #${editing?.project_id}`}</h3>
          <ProjectForm
            initial={editing ?? undefined}
            onSubmit={creating ? submitCreate : submitUpdate}
          />
          <button
            className="mt-3 text-sm text-gray-500 underline"
            onClick={() => { setCreating(false); setEditing(null); }}
          >
            取消
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["ID", "名称", "名额", "顾问", "更新时间", "操作"].map((h) => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.project_id} className="border-t">
                <td className="px-4 py-2">{p.project_id}</td>
                <td className="px-4 py-2">{p.project_name}</td>
                <td className="px-4 py-2">{p.quota}</td>
                <td className="px-4 py-2">{p.owner}</td>
                <td className="px-4 py-2">{p.update?.slice(0, 16).replace("T", " ")}</td>
                <td className="space-x-2 px-4 py-2">
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => { setEditing(p); setCreating(false); }}
                  >
                    编辑
                  </button>
                  <button
                    className="rounded border border-red-500 px-2 py-1 text-xs text-red-600"
                    onClick={async () => {
                      if (!confirm(`确认删除项目「${p.project_name}」？将级联删除活动与报名。`)) return;
                      const res = await deleteProject(p.project_id);
                      setMessage(res.message);
                      if (res.code === 200) load();
                    }}
                  >
                    删除
                  </button>
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
    </div>
  );
}
