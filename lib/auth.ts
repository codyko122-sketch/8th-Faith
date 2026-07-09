// 브라우저 localStorage 기반 계정 저장소. 이 프로젝트엔 서버/DB가 없어서
// 회원가입·로그인 데이터를 브라우저에만 저장한다 — 비밀번호도 평문 저장.
// 실제 서비스로 배포한다면 반드시 서버 인증 + 해시된 비밀번호로 교체해야 한다.
export type Account = {
  id: string;
  password: string;
  name: string;
  age: string;
  gender: string;
  skinCode: string | null;
  skinUpdatedAt: string | null;
  createdAt: string;
};

const ACCOUNTS_KEY = "beauty-passport:accounts";
const SESSION_KEY = "beauty-passport:session";
const REMEMBER_ID_KEY = "beauty-passport:remember-id";
const AUTO_LOGIN_KEY = "beauty-passport:auto-login";

function readAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: Account[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function findAccount(id: string): Account | null {
  return readAccounts().find((a) => a.id === id) ?? null;
}

export function setSession(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, id);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Account | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(SESSION_KEY);
  return id ? findAccount(id) : null;
}

export function signup(input: {
  id: string;
  password: string;
  name: string;
  age: string;
  gender: string;
}): { ok: true; account: Account } | { ok: false; error: string } {
  const id = input.id.trim();
  const name = input.name.trim();
  if (!name || !id || !input.password) {
    return { ok: false, error: "이름, 아이디, 비밀번호를 모두 입력해주세요." };
  }
  if (findAccount(id)) {
    return { ok: false, error: "이미 사용 중인 아이디예요." };
  }
  const account: Account = {
    id,
    password: input.password,
    name,
    age: input.age,
    gender: input.gender,
    skinCode: null,
    skinUpdatedAt: null,
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...readAccounts(), account]);
  setSession(id);
  return { ok: true, account };
}

export function login(id: string, password: string): { ok: true; account: Account } | { ok: false; error: string } {
  const account = findAccount(id.trim());
  if (!account || account.password !== password) {
    return { ok: false, error: "아이디 또는 비밀번호가 올바르지 않아요." };
  }
  setSession(account.id);
  return { ok: true, account };
}

export function getRememberedId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REMEMBER_ID_KEY);
}

export function setRememberedId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(REMEMBER_ID_KEY, id);
  else window.localStorage.removeItem(REMEMBER_ID_KEY);
}

export function isAutoLoginEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTO_LOGIN_KEY) === "1";
}

export function setAutoLogin(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(AUTO_LOGIN_KEY, "1");
  else window.localStorage.removeItem(AUTO_LOGIN_KEY);
}

export function findAccountsByName(name: string): Account[] {
  const q = name.trim();
  if (!q) return [];
  return readAccounts().filter((a) => a.name === q);
}

export function maskId(id: string): string {
  if (id.length <= 2) return id[0] + "*".repeat(Math.max(0, id.length - 1));
  return id.slice(0, 2) + "*".repeat(id.length - 2);
}

export function resetPassword(id: string, name: string, newPassword: string): { ok: true } | { ok: false; error: string } {
  if (!newPassword) return { ok: false, error: "새 비밀번호를 입력해주세요." };
  const accounts = readAccounts();
  const idx = accounts.findIndex((a) => a.id === id.trim() && a.name === name.trim());
  if (idx === -1) return { ok: false, error: "일치하는 계정을 찾을 수 없어요." };
  accounts[idx] = { ...accounts[idx], password: newPassword };
  writeAccounts(accounts);
  return { ok: true };
}

export function saveSkinToAccount(id: string, skinCode: string) {
  const accounts = readAccounts();
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return;
  accounts[idx] = { ...accounts[idx], skinCode, skinUpdatedAt: new Date().toISOString() };
  writeAccounts(accounts);
}

export function daysAgoLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "오늘";
  if (days === 1) return "1일 전";
  return `${days}일 전`;
}
