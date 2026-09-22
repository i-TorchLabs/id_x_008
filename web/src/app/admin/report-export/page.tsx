"use client";

/** 管理端 · 报表导出：时间区间 + 活动名多选Export Excel，底部表格联动刷新报名明细。 */
import { useEffect, useRef, useState } from "react";
import { exportActivity, fuzzyExportActivityName } from "@/api/admin";
import { downloadBase64, gql } from "@/api/graphql";
import {
  Card, DateTimePicker, EmptyState, ErrorText, FieldLabel, PageTitle, PillButton,
  inputBaseStyle, tableStyle, tdMonoStyle, tdPrimaryStyle, tdStyle, thStyle,
} from "@/components/ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

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

  // 活动名模糊搜索（debounce 250ms + 过期响应丢弃，避免乱序覆盖）
  useEffect(() => {
    let stale = false;
    const timer = setTimeout(() => {
      fuzzyExportActivityName(fuzzy).then((r) => {
        if (stale) return;
        if (r.code === 200 && r.parsed) setCandidates(r.parsed.name_list);
      });
    }, 250);
    return () => { stale = true; clearTimeout(timer); };
  }, [fuzzy]);

  // 底部表格联动实时刷新报名明细（请求 ID 守卫，丢弃过期响应避免乱序覆盖）
  const queryId = useRef(0);
  useEffect(() => {
    const id = ++queryId.current;
    const startMs = toMs(startTime);
    const endMs = toMs(endTime);
    gql<{ total: number; list: ApplyRow[] }>(`query ($input: QueryDataInput!) {
      search_query_data(input: $input) { code message data }
    }`, {
      input: {
        title: selected,
        start_time: startMs ? Number(startMs) : null,
        end_time: endMs ? Number(endMs) : null,
        offset: 1,
        limit: 50,
      },
    }).then((r) => {
      if (id !== queryId.current) return;
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 筛选卡 */}
      <Card noPadding>
        <div style={{ padding: "24px" }}>
          <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: "20px" }}>
            <PageTitle>Report Export</PageTitle>
            <PillButton primary onClick={doExport}>Export Excel</PillButton>
          </div>
          {message && <ErrorText>{message}</ErrorText>}

          <div className="flex flex-wrap items-end gap-4">
            <div style={{ minWidth: "200px" }}>
              <FieldLabel>Activity Name</FieldLabel>
              <input style={inputBaseStyle} value={fuzzy}
                onChange={(e) => setFuzzy(e.target.value)} placeholder="Type prefix..." />
            </div>
            <div style={{ minWidth: "220px" }}>
              <FieldLabel>Start Time</FieldLabel>
              <DateTimePicker value={startTime}
                onChange={setStartTime} />
            </div>
            <div style={{ minWidth: "220px" }}>
              <FieldLabel>End Time</FieldLabel>
              <DateTimePicker value={endTime}
                onChange={setEndTime} />
            </div>
          </div>

          {/* 活动多选 */}
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${tokens.divider}` }}>
            <FieldLabel>Select Activities ({selected.length} selected)</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {candidates.map((name) => {
                const active = selected.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => setSelected(active ? selected.filter((s) => s !== name) : [...selected, name])}
                    className="transition-opacity duration-200 hover:opacity-75"
                    style={{
                      fontFamily: SF_TEXT,
                      fontSize: "13px",
                      fontWeight: active ? 500 : 400,
                      background: active ? tokens.accent : "transparent",
                      color: active ? tokens.accentFg : tokens.fg2,
                      border: `1px solid ${active ? tokens.accent : tokens.inputBorder}`,
                      borderRadius: "3px",
                      padding: "4px 12px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* 明细卡 */}
      <Card noPadding>
        <div style={{ padding: "24px" }}>
          {rows.length === 0 ? (
            <EmptyState>No data</EmptyState>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {["Order", "Activity", "Name", "Student ID", "Grade", "Email", "Topic", "Applied At"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} data-row>
                      <td style={tdMonoStyle}>{r.order}</td>
                      <td style={tdPrimaryStyle}>{r.activity_name}</td>
                      <td style={tdStyle}>{r.name}</td>
                      <td style={tdMonoStyle}>{r.number}</td>
                      <td style={tdStyle}>{r.grade}</td>
                      <td style={tdStyle}>{r.email}</td>
                      <td style={tdStyle}>{r.info_1}</td>
                      <td style={tdMonoStyle}>{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
