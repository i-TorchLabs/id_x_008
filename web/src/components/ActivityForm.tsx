/** 活动表单：项目 / 名称 / 活动与报名起止时间。 */
"use client";

import { useEffect, useState } from "react";
import { getProjectNameList } from "@/api/admin";

export interface ActivityFormValue {
  project_id: number;
  activity_name: string;
  activity_start_time: string;
  activity_end_time: string;
  apply_start_time: string;
  apply_end_time: string;
}

const FIELDS: { key: keyof Omit<ActivityFormValue, "project_id" | "activity_name">; label: string }[] = [
  { key: "activity_start_time", label: "活动开始时间" },
  { key: "activity_end_time", label: "活动结束时间" },
  { key: "apply_start_time", label: "报名开始时间" },
  { key: "apply_end_time", label: "报名结束时间" },
];

export default function ActivityForm({
  initial,
  onSubmit,
  submitText = "保存",
}: {
  initial?: Partial<ActivityFormValue>;
  onSubmit: (v: ActivityFormValue) => Promise<void>;
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
      <select
        className="w-full rounded border px-3 py-2"
        value={value.project_id}
        onChange={(e) => setValue({ ...value, project_id: Number(e.target.value) })}
        required
      >
        <option value={0}>选择项目</option>
        {projects.map((p) => (
          <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
        ))}
      </select>
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="活动名称（留空则沿用项目名）"
        value={value.activity_name}
        onChange={(e) => setValue({ ...value, activity_name: e.target.value })}
      />
      {FIELDS.map((f) => (
        <label key={f.key} className="block text-sm">
          <span className="mb-1 block text-gray-600">{f.label}</span>
          <input
            type="datetime-local"
            className="w-full rounded border px-3 py-2"
            value={value[f.key]}
            onChange={(e) => setValue({ ...value, [f.key]: e.target.value })}
            required
          />
        </label>
      ))}
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
