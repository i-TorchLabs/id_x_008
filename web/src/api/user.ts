/** 学生端 API：对应后端 Query/Mutation 操作。 */
import { gql } from "./graphql";

export interface ActivityItem {
  activity_id: number;
  activity_name: string;
  project_id: number;
  project_name: string;
  owner: string;
  content: string;
  quota: number;
  apply_count: number;
  state: "Open" | "Full" | "Closed";
  activity_start_time: string;
  activity_end_time: string;
  apply_start_time: string;
  apply_end_time: string;
  occupied_topics: string[];
}

export interface ApplyRecord {
  id: number;
  activity_id: number;
  activity_name: string;
  order: string;
  name: string;
  number: string;
  info_1: string;
  time: string;
  activity_start_time: string;
  activity_end_time: string;
}

/** 学生 SSO 登录（ADFS 授权码授予流）：回调页获得 code+state 后调用。
 *  后端用 client_secret 换 id_token → 验签 → 提取身份 → 建档/更新会话。
 *  code: ADFS /authorize 回调携带的授权码；
 *  state: 前端生成的 CSRF 随机串，回调页校验后原样回传。 */
export async function userOauth(code: string, state: string = "") {
  return gql(`mutation ($input: OauthInput!) {
    user_oauth(input: $input) { code message data }
  }`, { input: { code, state } });
}

export async function getUserActivityList(input: {
  start_date?: string | null;
  end_date?: string | null;
  offset?: number;
  limit?: number;
  fuzzy_name?: string;
}) {
  return gql<{ total: number; list: ActivityItem[] }>(`query ($input: UserActivityListInput!) {
    get_user_activity_list(input: $input) { code message data }
  }`, { input });
}

export async function getUserActivityDetail(activityId: string) {
  return gql<ActivityItem>(`query ($input: ActivityDetailInput!) {
    get_user_activity_detail(input: $input) { code message data }
  }`, { input: { activity_id: activityId } });
}

export async function fuzzyActivityName(fuzzyName: string) {
  return gql<{ name_list: string[] }>(`query ($input: FuzzyNameInput!) {
    fuzzy_activity_name(input: $input) { code message data }
  }`, { input: { fuzzy_name: fuzzyName } });
}

export async function applyActivity(input: {
  user_id: number;
  activity_id: string;
  info_1: string;
}) {
  return gql(`mutation ($input: ApplyInput!) {
    apply_activity(input: $input) { code message data }
  }`, { input });
}

export async function cancelApply(input: { user_id: number; apply_id: number }) {
  return gql(`mutation ($input: CancelApplyInput!) {
    cancel_apply(input: $input) { code message data }
  }`, { input });
}

/** 登出：使服务端 Token 失效（与 admin 共用同一 mutation，无角色限制）。 */
export async function logout() {
  return gql(`mutation { logout { code message data } }`);
}

export async function searchUserActivity(input: {
  start_date?: string | null;
  end_date?: string | null;
  fuzzy_name?: string;
  state?: string;
}) {
  return gql<{ total: number; list: ActivityItem[] }>(`query ($input: SearchUserActivityInput!) {
    search_user_activity(input: $input) { code message data }
  }`, { input });
}
