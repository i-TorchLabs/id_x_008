/** 管理端 API：对应后端 Query/Mutation 操作（需管理员 Token）。 */
import { gql, gqlFile } from "./graphql";

// ===== RSA 加密工具（Web Crypto API） =====

let _publicKeyPromise: Promise<string> | null = null;

/** 获取 RSA 公钥（带缓存，同页面只请求一次） */
async function getPublicKey(): Promise<string> {
  if (!_publicKeyPromise) {
    _publicKeyPromise = (async () => {
      const res = await gql<{ public_key: string }>(`query {
        public_key { code message data }
      }`);
      if (res.code === 200 && res.parsed?.public_key) {
        return res.parsed.public_key;
      }
      throw new Error("Failed to fetch public key");
    })();
  }
  return _publicKeyPromise;
}

/** 使用 RSA-OAEP SHA-256 加密明文密码 */
async function encryptPassword(publicKeyPem: string, password: string): Promise<string> {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = publicKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(
    atob(pemContents),
    (c) => c.charCodeAt(0),
  );

  const publicKey = await crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    new TextEncoder().encode(password),
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// ===== 业务 API =====

export interface ProjectItem {
  project_id: number;
  project_name: string;
  project_content: string;
  quota: string;
  owner: string;
  time: string;
  update: string;
}

export async function login(username: string, password: string) {
  let encryptedPassword = "";
  try {
    const publicKey = await getPublicKey();
    encryptedPassword = await encryptPassword(publicKey, password);
  } catch (e) {
    // 加密失败时降级为明文传输（向后兼容）
    console.warn("RSA encryption unavailable, falling back to plaintext", e);
  }

  return gql<{ user_id: number; token: string; role: string }>(`mutation ($input: LoginInput!) {
    login(input: $input) { code message data }
  }`, {
    input: {
      username,
      password: encryptedPassword ? "" : password,
      encrypted_password: encryptedPassword,
    },
  });
}

export async function logout() {
  return gql(`mutation { logout { code message data } }`);
}

// ----- 项目 -----
export async function getProjectList(input: { offset?: number; limit?: number; sort_order?: "asc" | "desc" }) {
  return gql<{ total: number; list: ProjectItem[] }>(`query ($input: PageInput!) {
    get_project_list(input: $input) { code message data }
  }`, { input });
}

export async function createProject(input: {
  project_name: string; project_content: string; quota: string; owner: string;
}) {
  return gql(`mutation ($input: CreateProjectInput!) {
    create_project(input: $input) { code message data }
  }`, { input });
}

export async function updateProject(input: {
  project_id: number; project_name: string; project_content: string; quota: string; owner?: string;
}) {
  return gql(`mutation ($input: UpdateProjectInput!) {
    update_project(input: $input) { code message data }
  }`, { input });
}

export async function deleteProject(projectId: number) {
  return gql(`mutation ($input: ProjectIdInput!) {
    delete_project(input: $input) { code message data }
  }`, { input: { project_id: projectId } });
}

export async function searchProjectOwner() {
  return gql<{ owner_list: { name: string; email: string }[] }>(`query {
    search_project_owner { code message data }
  }`);
}

export async function getProjectNameList() {
  return gql<{ name_list: { project_id: number; project_name: string }[] }>(`query {
    get_project_name_list { code message data }
  }`);
}

// ----- 活动 -----
export async function getActivityList(input: {
  offset?: number; limit?: number; start_date?: string | null; end_date?: string | null;
  sort_order?: "asc" | "desc";
}) {
  return gql<{ total: number; list: Record<string, unknown>[] }>(`query ($input: PageInput!) {
    get_activity_list(input: $input) { code message data }
  }`, { input });
}

export async function getActivityDetail(activityId: number) {
  return gql<{ total: number; list: Record<string, unknown>[]; activity_name: string }>(
    `query ($input: ActivityIdInput!) {
      get_activity_detail(input: $input) { code message data }
    }`, { input: { activity_id: activityId } });
}

export async function createActivity(input: Record<string, unknown>) {
  return gql(`mutation ($input: CreateActivityInput!) {
    create_activity(input: $input) { code message data }
  }`, { input });
}

export async function updateActivity(input: Record<string, unknown>) {
  return gql(`mutation ($input: UpdateActivityInput!) {
    update_activity(input: $input) { code message data }
  }`, { input });
}

export async function deleteActivity(activityId: number) {
  return gql(`mutation ($input: ActivityIdInput!) {
    delete_activity(input: $input) { code message data }
  }`, { input: { activity_id: activityId } });
}

export async function uploadActivity(fileName: string, fileBase64: string) {
  return gql<{ success_count: number; fail_count: number }>(
    `mutation ($input: UploadActivityInput!) {
      upload_activity(input: $input) { code message data }
    }`, { input: { file_name: fileName, file_base64: fileBase64 } });
}

export async function downloadActivityTemplate() {
  return gqlFile(`query { download_activity_template { code message file_name file_base64 } }`);
}

export async function exportActivity(input: {
  activity_list: string[]; start_time?: string | null; end_time?: string | null;
}) {
  return gqlFile(`query ($input: ExportActivityInput!) {
    export_activity(input: $input) { code message file_name file_base64 }
  }`, { input });
}

export async function fuzzyExportActivityName(fuzzyName: string) {
  return gql<{ name_list: string[] }>(`query ($input: FuzzyNameInput!) {
    fuzzy_export_activity_name(input: $input) { code message data }
  }`, { input: { fuzzy_name: fuzzyName } });
}
