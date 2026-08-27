"use client";

/** 项目表单：名称 / 名额 / 顾问 / 富文本内容。 */
import { useEffect, useState } from "react";
import { searchProjectOwner } from "@/api/admin";
import RichTextEditor from "./RichTextEditor";

export interface ProjectFormValue {
  project_name: string;
  quota: string;
  owner: string;
  project_content: string;
}

export default function ProjectForm({
  initial,
  onSubmit,
  submitText = "保存",
}: {
  initial?: Partial<ProjectFormValue>;
  onSubmit: (v: ProjectFormValue) => Promise<void>;
  submitText?: string;
}) {
  const [value, setValue] = useState<ProjectFormValue>({
    project_name: initial?.project_name ?? "",
    quota: initial?.quota ?? "",
    owner: initial?.owner ?? "",
    project_content: initial?.project_content ?? "",
  });
  const [owners, setOwners] = useState<{ name: string; email: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    searchProjectOwner().then((r) => {
      if (r.code === 200 && r.parsed) setOwners(r.parsed.owner_list);
    });
  }, []);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit(value);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="项目名称（唯一）"
        value={value.project_name}
        onChange={(e) => setValue({ ...value, project_name: e.target.value })}
        required
      />
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="名额（数字）"
        value={value.quota}
        onChange={(e) => setValue({ ...value, quota: e.target.value })}
        required
      />
      <select
        className="w-full rounded border px-3 py-2"
        value={value.owner}
        onChange={(e) => setValue({ ...value, owner: e.target.value })}
      >
        <option value="">选择顾问</option>
        {owners.map((o) => (
          <option key={o.name} value={o.name}>{o.name}（{o.email}）</option>
        ))}
      </select>
      <RichTextEditor
        value={value.project_content}
        onChange={(html) => setValue({ ...value, project_content: html })}
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-[#7a0026] px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "提交中..." : submitText}
      </button>
    </form>
  );
}
