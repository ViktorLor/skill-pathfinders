export type AccountSession = {
  id: string;
  email: string;
};

export const ACCOUNT_SESSION_CHANGED_EVENT = "account-session-changed";

export function getStoredAccountSession(): AccountSession | null {
  if (typeof window === "undefined") return null;

  const id = window.localStorage.getItem("accountId");
  const email = window.localStorage.getItem("accountEmail");

  if (!id || !email) return null;
  return { id, email };
}

export function saveStoredAccountSession(account: AccountSession) {
  window.localStorage.setItem("accountId", account.id);
  window.localStorage.setItem("accountEmail", account.email);
  notifyAccountSessionChanged();
}

export function clearStoredAccountSession() {
  window.localStorage.removeItem("accountId");
  window.localStorage.removeItem("accountEmail");
  notifyAccountSessionChanged();
}

function notifyAccountSessionChanged() {
  window.dispatchEvent(new Event(ACCOUNT_SESSION_CHANGED_EVENT));
}
