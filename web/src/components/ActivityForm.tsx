/** 活动表单：项目 / 名称 / 活动与报名起止时间。 */
"use client";

import { useEffect, useState } from "react";
import { getProjectNameList } from "@/api/admin";
import { DateTimePicker, FieldLabel, PillButton, inputBaseStyle } from "./ui";

export interface ActivityFormValue {
  project_id: number;
  activity_name: string;
  activity_start_time: string;
  activity_end_time: string;
  apply_start_time: string;
  apply_end_time: string;
}

const FIELDS: { key: keyof Omit<ActivityFormValue, "project_id" | "activity_name">; label: string }[] = [
  { key: "activity_start_time", label: "Activity Start" },
  { key: "activity_end_time", label: "Activity End" },
  { key: "apply_start_time", label: "Application Start" },
  { key: "apply_end_time", label: "Application End" },
];

export default function ActivityForm({
  initial,
  onSubmit,
  onCancel,
  submitText = "Save",
}: {
  initial?: Partial<ActivityFormValue>;
  onSubmit: (v: ActivityFormValue) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
}) {
  const [value, setValue] = useState<ActivityFormValue>({
    project_id: initial?.project_id ?? 0,
    activity_name: initial?.activity_name ?? "",
    activity_start_time: initial?.activity_start_time ?? "",
    activity_end_time: initial?.activity_end_time ?? "",
    apply_start_time: initial?.apply_start_time ?? "",
    apply_end_time: initial?.apply_end_time ?? "",
  });
  const [projects, setProjects] = useState<{ project_id: number; project_name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProjectNameList().then((r) => {
      if (r.code === 200 && r.parsed) setProjects(r.parsed.name_list);
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
        <FieldLabel>Project</FieldLabel>
        <select
          style={{ ...inputBaseStyle, appearance: "none" }}
          value={value.project_id || ""}
          onChange={(e) => setValue({ ...value, project_id: Number(e.target.value) })}
          required
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Activity Name (defaults to project name)</FieldLabel>
        <input
          style={inputBaseStyle}
          placeholder="e.g. Week 2 Session"
          value={value.activity_name}
          onChange={(e) => setValue({ ...value, activity_name: e.target.value })}
        />
      </div>
      {FIELDS.map((f) => (
        <div key={f.key}>
          <FieldLabel>{f.label}</FieldLabel>
          <DateTimePicker
            value={value[f.key]}
            onChange={(iso) => setValue({ ...value, [f.key]: iso })}
          />
        </div>
      ))}
      <div style={{ paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
        {onCancel && <PillButton type="button" disabled={busy} onClick={onCancel}>Cancel</PillButton>}
        <PillButton primary disabled={busy}>
          {busy ? "Saving..." : submitText}
        </PillButton>
      </div>
    </form>
  );
}
