"use client";

/** 我的记录：报名记录列表 + 取消报名（结束前 4 小时禁取消由后端校验）。 */
import { useEffect, useState } from "react";
import { type ApplyRecord, cancelApply } from "@/api/user";
import { gql } from "@/api/graphql";
import { useUser } from "@/stores/userStore";
import {
  Card, EmptyState, ErrorText, Modal, PageTitle, PillButton,
  tableStyle, tdMonoStyle, tdPrimaryStyle, tdStyle, thStyle,
} from "@/components/ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

export default function RecordsPage() {
  const { user } = useUser();
  const [items, setItems] = useState<ApplyRecord[]>([]);
  const [message, setMessage] = useState("");
  const [cancelling, setCancelling] = useState<ApplyRecord | null>(null);

  const load = async () => {
    if (!user) return;
    // 后端对学生 Token 仅返回本人记录
    const res = await gql<{ total: number; list: ApplyRecord[] }>(`query ($input: QueryDataInput!) {
      search_query_data(input: $input) { code message data }
    }`, { input: { title: [], offset: 1, limit: 100 } });
    if (res.code === 200 && res.parsed) {
      setItems(res.parsed.list);
    } else if (res.code === 401) {
      setMessage("Session expired, please log in again");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Card noPadding>
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <PageTitle>My Applications</PageTitle>
        </div>
        {message && <ErrorText>{message}</ErrorText>}

        {items.length === 0 ? (
          <EmptyState>No records</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["Order", "Activity", "Topic", "Activity Time", "Applied At", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} data-row>
                    <td style={tdMonoStyle}>{r.order}</td>
                    <td style={tdPrimaryStyle}>{r.activity_name}</td>
                    <td style={tdStyle}>{r.info_1}</td>
                    <td style={tdMonoStyle}>{r.activity_start_time}</td>
                    <td style={tdMonoStyle}>{r.time}</td>
                    <td style={{ ...tdStyle, paddingRight: 0 }}>
                      <PillButton small danger onClick={() => setCancelling(r)}>Cancel</PillButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 取消确认弹层 */}
      <Modal
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancel this application?"
        footer={
          <>
            <PillButton onClick={() => setCancelling(null)}>Keep It</PillButton>
            <PillButton primary onClick={async () => {
              if (!user || !cancelling) return;
              const res = await cancelApply({ user_id: user.user_id, apply_id: cancelling.id });
              setCancelling(null);
              if (res.code === 200) load();
              else setMessage(res.message);
            }}>Confirm</PillButton>
          </>
        }
      >
        <p style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg2, letterSpacing: "-0.15px", margin: 0 }}>
          Cancelling "{cancelling?.activity_name}" will release the slot to other students.
        </p>
      </Modal>
    </Card>
  );
}
