"use client";

/** 用户状态管理：登录用户 + Token，持久化到 localStorage。 */
import { createContext, useContext, useEffect, useState } from "react";

export interface UserInfo {
  user_id: number;
  name: string;
  role: "admin" | "user";
  token: string;
}

interface UserContextValue {
  user: UserInfo | null;
  setUser: (u: UserInfo | null) => void;
  logoutLocal: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => undefined,
  logoutLocal: () => undefined,
});

const STORAGE_KEY = "iao_user";
const TOKEN_KEY = "iao_token";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserInfo | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUserState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const setUser = (u: UserInfo | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      localStorage.setItem(TOKEN_KEY, u.token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const logoutLocal = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, logoutLocal }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
