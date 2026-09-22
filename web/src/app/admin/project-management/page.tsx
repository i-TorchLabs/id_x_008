"use client";

/** 管理端 · 项目管理：分页列表 + 新增/编辑（富文本）/删除（级联）。 */
import { useCallback, useEffect, useState } from "react";
import {
  createProject, deleteProject, getProjectList, type ProjectItem, updateProject,
} from "@/api/admin";
import ProjectForm, { type ProjectFormValue } from "@/components/ProjectForm";
import {
  Card, EmptyState, ErrorText, Modal, PageTitle, PillButton, SortOrderButton, type SortOrder,
  tableStyle, tdMonoStyle, tdPrimaryStyle, tdStyle, thStyle,
} from "@/components/ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

export default function ProjectManagementPage() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ProjectItem | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async (p = page, order = sortOrder) => {
    const res = await getProjectList({ offset: p, limit: 10, sort_order: order });
    if (res.code === 200 && res.parsed) {
      setItems(res.parsed.list);
      setTotal(res.parsed.total);
    } else if (res.code === 401) {
      setMessage("Session expired (401)");
    }
  }, [page, sortOrder]);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitCreate = async (v: ProjectFormValue) => {
    const res = await createProject(v);
    setMessage(res.message);
    if (res.code === 200) { setCreating(false); setPage(1); load(1); }
  };

  const submitUpdate = async (v: ProjectFormValue) => {
    if (!editing) return;
    const res = await updateProject({ project_id: editing.project_id, ...v });
    setMessage(res.message);
    if (res.code === 200) { setEditing(null); load(); }
  };

  return (
    <Card noPadding>
      <div style={{ padding: "24px" }}>
        {/* 工具条 */}
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: "20px" }}>
          <PageTitle>Project Management</PageTitle>
          <div className="flex gap-2 items-center">
            <SortOrderButton order={sortOrder} onChange={(o) => { setSortOrder(o); setPage(1); load(1, o); }} />
            <PillButton primary onClick={() => { setCreating(true); setEditing(null); }}>
              New Project
            </PillButton>
          </div>
        </div>
        {message && <ErrorText>{message}</ErrorText>}

        {/* 表格 */}
        {items.length === 0 ? (
          <EmptyState>No projects yet. Click New Project to create one.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, cursor: "pointer", userSelect: "none" }}
                    title="Sort by ID"
                    onClick={() => { const o = sortOrder === "asc" ? "desc" : "asc"; setSortOrder(o); setPage(1); load(1, o); }}>
                    ID {sortOrder === "asc" ? "↑" : "↓"}
                  </th>
                  {["Name", "Quota", "Advisor", "Updated", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.project_id} data-row>
                    <td style={tdMonoStyle}>{p.project_id}</td>
                    <td style={tdPrimaryStyle}>{p.project_name}</td>
                    <td style={tdStyle}>{p.quota}</td>
                    <td style={tdStyle}>{p.owner}</td>
                    <td style={tdMonoStyle}>{p.update?.slice(0, 16).replace("T", " ")}</td>
                    <td style={{ ...tdStyle, paddingRight: 0 }}>
                      <div className="flex gap-2">
                        <PillButton small onClick={() => { setEditing(p); setCreating(false); }}>
                          Edit
                        </PillButton>
                        <PillButton small danger onClick={() => setDeleting(p)}>
                          Delete
                        </PillButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        <div className="flex items-center gap-4" style={{ marginTop: "16px" }}>
          <PillButton small disabled={page <= 1}
            onClick={() => { setPage(page - 1); load(page - 1); }}>Prev</PillButton>
          <span style={{ fontFamily: SF_TEXT, fontSize: "13px", color: tokens.fg3 }}>
            Page {page} / {total} items
          </span>
          <PillButton small disabled={page * 10 >= total}
            onClick={() => { setPage(page + 1); load(page + 1); }}>Next</PillButton>
        </div>
      </div>

      {/* 新增/编辑弹层 */}
      <Modal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        title={creating ? "New Project" : `Edit Project #${editing?.project_id}`}
        width={560}
      >
        <ProjectForm
          initial={editing ?? undefined}
          onSubmit={creating ? submitCreate : submitUpdate}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      </Modal>

      {/* 删除确认弹层 */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Confirm Deletion?"
        footer={
          <>
            <PillButton onClick={() => setDeleting(null)}>Cancel</PillButton>
            <PillButton primary onClick={async () => {
              if (!deleting) return;
              const res = await deleteProject(deleting.project_id);
              setMessage(res.message);
              setDeleting(null);
              if (res.code === 200) load();
            }}>Delete</PillButton>
          </>
        }
      >
        <p style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg2, letterSpacing: "-0.15px", margin: 0 }}>
          Deleting project "{deleting?.project_name}" will cascade-delete its activities and applications. This cannot be undone.
        </p>
      </Modal>
    </Card>
  );
}
