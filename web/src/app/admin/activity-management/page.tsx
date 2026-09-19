"use client";

/** 管理端 · 活动管理：活动列表 + 创建/删除 + Excel 批量排期上传/模板下载 + 报名明细。 */
import { useCallback, useEffect, useState } from "react";
import {
  createActivity, deleteActivity, downloadActivityTemplate, getActivityDetail,
  getActivityList, uploadActivity,
} from "@/api/admin";
import { downloadBase64 } from "@/api/graphql";
import ActivityForm, { type ActivityFormValue } from "@/components/ActivityForm";
import {
  Badge, Card, EmptyState, ErrorText, Modal, PageTitle, PillButton,
  tableStyle, tdMonoStyle, tdPrimaryStyle, tdStyle, thStyle,
} from "@/components/ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

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

const stateBadge = (state: string) => {
  if (state === "Open") return <Badge bg={tokens.accent} color={tokens.accentFg}>Open</Badge>;
  if (state === "Full") return <Badge bg="transparent" color={tokens.fg} border={tokens.fg}>Full</Badge>;
  if (state === "Closed") return <Badge bg={tokens.badgeBg} color={tokens.fg3}>Closed</Badge>;
  return <Badge bg={tokens.badgeBg} color={tokens.fg3}>{state}</Badge>;
};

export default function ActivityManagementPage() {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ActivityRow | null>(null);
  const [detail, setDetail] = useState<{ name: string; list: Record<string, unknown>[] } | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async (p = page) => {
    const res = await getActivityList({ offset: p, limit: 10 });
    if (res.code === 200 && res.parsed) {
      setItems(res.parsed.list as unknown as ActivityRow[]);
      setTotal(res.parsed.total);
    } else if (res.code === 401) {
      setMessage("Session expired (401)");
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
      setMessage(`Upload done: ${res.parsed.success_count} succeeded, ${res.parsed.fail_count} failed`);
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
    <Card noPadding>
      <div style={{ padding: "24px" }}>
        {/* 工具条 */}
        <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: "20px" }}>
          <PageTitle>Activities</PageTitle>
          <div className="flex gap-2 flex-wrap">
            <PillButton primary onClick={() => setCreating(true)}>New Activity</PillButton>
            <PillButton onClick={onDownloadTemplate}>Download Template</PillButton>
            <label style={{ display: "inline-flex" }}>
              <span
                className="transition-opacity duration-200 hover:opacity-75"
                style={{
                  fontFamily: SF_TEXT,
                  fontSize: "14px",
                  fontWeight: 500,
                  background: "transparent",
                  color: tokens.fg,
                  border: `1px solid ${tokens.inputBorder}`,
                  borderRadius: "3px",
                  height: "34px",
                  padding: "0 15px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Batch Upload (.xlsx)
              </span>
              <input type="file" accept=".xlsx" className="hidden"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
          </div>
        </div>
        {message && <ErrorText>{message}</ErrorText>}

        {/* 表格 */}
        {items.length === 0 ? (
          <EmptyState>No activities yet. Click New Activity to create one.</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["ID", "Activity", "Project", "Time", "Applied", "State", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.activity_id} data-row>
                    <td style={tdMonoStyle}>{a.activity_id}</td>
                    <td style={tdPrimaryStyle}>{a.activity_name}</td>
                    <td style={tdStyle}>{a.project_name}</td>
                    <td style={tdMonoStyle}>{a.activity_start_time?.slice(0, 16).replace("T", " ")}</td>
                    <td style={tdMonoStyle}>{a.apply_count}/{a.quota || "∞"}</td>
                    <td style={tdStyle}>{stateBadge(a.state)}</td>
                    <td style={{ ...tdStyle, paddingRight: 0 }}>
                      <div className="flex gap-2">
                        <PillButton small onClick={() => showDetail(a.activity_id)}>Detail</PillButton>
                        <PillButton small danger onClick={() => setDeleting(a)}>Delete</PillButton>
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

      {/* New Activity弹层 */}
      <Modal open={creating} onClose={() => setCreating(false)} title="New Activity" width={560}>
        <ActivityForm onSubmit={submitCreate} />
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
              const res = await deleteActivity(deleting.activity_id);
              setMessage(res.message);
              setDeleting(null);
              if (res.code === 200) load();
            }}>Delete</PillButton>
          </>
        }
      >
        <p style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg2, letterSpacing: "-0.15px", margin: 0 }}>
          Deleting activity "{deleting?.activity_name}" will cascade-delete its applications. This cannot be undone.
        </p>
      </Modal>

      {/* 报名明细弹层 */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Applications for "${detail?.name}" (${detail?.list.length ?? 0})`}
        width={860}
      >
        {detail && detail.list.length === 0 ? (
          <EmptyState>No applications</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["Order", "Name", "Student ID", "Grade", "Email", "Topic", "Applied At"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail?.list.map((r) => (
                  <tr key={String(r.id)} data-row>
                    <td style={tdMonoStyle}>{String(r.order)}</td>
                    <td style={tdPrimaryStyle}>{String(r.name)}</td>
                    <td style={tdMonoStyle}>{String(r.number)}</td>
                    <td style={tdStyle}>{String(r.grade)}</td>
                    <td style={tdStyle}>{String(r.email)}</td>
                    <td style={tdStyle}>{String(r.info_1)}</td>
                    <td style={tdMonoStyle}>{String(r.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </Card>
  );
}
