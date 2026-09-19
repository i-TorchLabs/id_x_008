/** GraphQL 客户端封装：全部业务经单端点 POST /b/id_x_008/graphql 收发。 */

export const GRAPHQL_ENDPOINT = "/b/id_x_008/graphql";

export interface ResponseType<T = unknown> {
  code: number;
  message: string;
  /** data 为 JSON 字符串，需二次解析 */
  data: string;
  parsed?: T;
}

export interface FileResponseType {
  code: number;
  message: string;
  file_name: string;
  file_base64: string;
}

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("aa_token") ?? "";
}

/** 401 统一处理：Token 失效时清除本地会话并跳转登录页 */
function handleUnauthorized(code: number) {
  if (code === 401 && typeof window !== "undefined") {
    localStorage.removeItem("aa_token");
    localStorage.removeItem("aa_user");
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
}

export async function gql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<ResponseType<T>> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Token: getToken(),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  const op = Object.keys(body.data ?? {})[0];
  const payload = body.data?.[op];
  if (!payload) {
    return { code: 500, message: body.errors?.[0]?.message ?? "Server error", data: "{}" };
  }
  let parsed: T | undefined;
  try {
    parsed = payload.data ? (JSON.parse(payload.data) as T) : undefined;
  } catch {
    parsed = undefined;
  }
  handleUnauthorized(payload.code);
  return { ...payload, parsed };
}

export async function gqlFile(
  query: string,
  variables?: Record<string, unknown>,
): Promise<FileResponseType> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Token: getToken(),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  const op = Object.keys(body.data ?? {})[0];
  return body.data?.[op] ?? { code: 500, message: "Server error", file_name: "", file_base64: "" };
}

/** base64 -> 浏览器下载 */
export function downloadBase64(fileName: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
