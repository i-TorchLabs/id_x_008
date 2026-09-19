"use client";

/** 项目表单：名称 / 名额 / 顾问 / 富文本内容。 */
import { useEffect, useState } from "react";
import { searchProjectOwner } from "@/api/admin";
import RichTextEditor from "./RichTextEditor";
import { FieldLabel, PillButton, inputBaseStyle } from "./ui";

export interface ProjectFormValue {
  project_name: string;
  quota: string;
  owner: string;
  project_content: string;
}

export default function ProjectForm({
  initial,
  onSubmit,
  submitText = "Save",
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
      style={{ display: "flex", flexDirection: "column", gap: "14px" }}
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
      <div>
        <FieldLabel>Project Name (unique)</FieldLabel>
        <input
          style={inputBaseStyle}
          placeholder="e.g. 1v1 Academic Advising"
          value={value.project_name}
          onChange={(e) => setValue({ ...value, project_name: e.target.value })}
          required
        />
      </div>
      <div>
        <FieldLabel>Quota (number)</FieldLabel>
        <input
          style={inputBaseStyle}
          placeholder="e.g. 20"
          value={value.quota}
          onChange={(e) => setValue({ ...value, quota: e.target.value })}
          required
        />
      </div>
      <div>
        <FieldLabel>Advisor</FieldLabel>
        <select
          style={{ ...inputBaseStyle, appearance: "none" }}
          value={value.owner}
          onChange={(e) => setValue({ ...value, owner: e.target.value })}
        >
          <option value="">Select advisor</option>
          {owners.map((o) => (
            <option key={o.name} value={o.name}>{o.name}（{o.email}）</option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Description</FieldLabel>
        <RichTextEditor
          value={value.project_content}
          onChange={(html) => setValue({ ...value, project_content: html })}
        />
      </div>
      <div style={{ paddingTop: "8px" }}>
        <PillButton primary disabled={busy}>
          {busy ? "Saving..." : submitText}
        </PillButton>
      </div>
    </form>
  );
}
