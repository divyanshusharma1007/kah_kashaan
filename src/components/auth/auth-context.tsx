"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ArtistRegistration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventName: string;
  createdAt: string;
};

export type AuthUser = {
  name: string;
  email: string;
  role: "artist" | "admin";
  provider?: "google" | "password";
};

type ArtistAccount = AuthUser & {
  role: "artist";
  phone: string;
  salt: string;
  passwordHash: string;
};

type DemoState = {
  accounts: ArtistAccount[];
  registrations: ArtistRegistration[];
  user: AuthUser | null;
};

type StoreSnapshot = {
  state: DemoState;
  ready: boolean;
  storageError: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  registrations: ArtistRegistration[];
  ready: boolean;
  storageError: string;
  sessionError: string;
  refreshSession: () => Promise<void>;
  registerForEvent: (details: {
    name: string;
    email: string;
    phone: string;
    eventName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = "kah-kashaan-demo-auth-v1";
const PASSWORD_ITERATIONS = 120_000;
const AuthContext = createContext<AuthContextValue | null>(null);
const serverSnapshot: StoreSnapshot = { state: emptyState(), ready: false, storageError: "" };
let cachedSnapshot: StoreSnapshot | null = null;
const storeListeners = new Set<() => void>();

function emptyState(): DemoState {
  return { accounts: [], registrations: [], user: null };
}

function isAuthUser(value: unknown): value is AuthUser {
  return Boolean(
    value &&
      typeof value === "object" &&
      "name" in value &&
      typeof value.name === "string" &&
      "email" in value &&
      typeof value.email === "string" &&
      "role" in value &&
      (value.role === "artist" || value.role === "admin"),
  );
}

async function fetchGoogleSessionUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("The sign-in session could not be verified.");
  }
  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== "object" ||
    !("user" in result) ||
    (result.user !== null && !isAuthUser(result.user))
  ) {
    throw new Error("The sign-in session response was invalid.");
  }
  return result.user;
}

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoState>;
  return Array.isArray(state.accounts) &&
    Array.isArray(state.registrations) &&
    (state.user === null || (typeof state.user === "object" && state.user !== null));
}

function readState(): DemoState {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return emptyState();
  const parsed: unknown = JSON.parse(stored);
  if (!isDemoState(parsed)) {
    throw new Error("Saved demo account data is invalid. Clear this site's local storage to start over.");
  }
  return parsed;
}

function getSnapshot(): StoreSnapshot {
  if (typeof window === "undefined") return serverSnapshot;
  if (cachedSnapshot) return cachedSnapshot;
  try {
    const snapshot = { state: readState(), ready: true, storageError: "" };
    cachedSnapshot = snapshot;
    return snapshot;
  } catch (error) {
    const snapshot = {
      state: emptyState(),
      ready: true,
      storageError: error instanceof Error ? error.message : "Could not read saved demo account data.",
    };
    cachedSnapshot = snapshot;
    return snapshot;
  }
}

function subscribe(listener: () => void) {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function saveState(state: DemoState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  cachedSnapshot = { state, ready: true, storageError: "" };
  storeListeners.forEach((listener) => listener());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const decoded = window.atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

async function hashPassword(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

function makeArtistAccount(name: string, email: string, phone: string, salt: string, passwordHash: string): ArtistAccount {
  return { name: name.trim(), email: normalizeEmail(email), phone: phone.trim(), role: "artist", salt, passwordHash };
}

function toAuthUser(account: ArtistAccount): AuthUser {
  return { name: account.name, email: account.email, role: account.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const refreshSession = useCallback(async () => {
    setSessionReady(false);
    try {
      setSessionUser(await fetchGoogleSessionUser());
      setSessionError("");
    } catch (error: unknown) {
      console.error("Could not load the Google sign-in session.", error);
      setSessionError("Could not verify your sign-in session. Refresh the page and try again.");
      throw error;
    } finally {
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchGoogleSessionUser()
      .then((user) => {
        if (active) {
          setSessionUser(user);
          setSessionError("");
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load the Google sign-in session.", error);
        if (active) {
          setSessionError("Could not verify your sign-in session. Refresh the page and try again.");
        }
      })
      .finally(() => {
        if (active) setSessionReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((next: DemoState) => {
    saveState(next);
  }, []);

  const registerForEvent = useCallback(async (details: {
    name: string;
    email: string;
    phone: string;
    eventName: string;
    password: string;
  }) => {
    const current = readState();
    const email = normalizeEmail(details.email);
    let account = current.accounts.find((candidate) => candidate.email === email);

    if (account) {
      const enteredHash = await hashPassword(details.password, fromBase64(account.salt));
      if (enteredHash !== account.passwordHash) {
        throw new Error("This email already has an account. Enter its password to register.");
      }
      account = { ...account, name: details.name.trim(), phone: details.phone.trim() };
    } else {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const saltValue = toBase64(salt);
      account = makeArtistAccount(
        details.name,
        email,
        details.phone,
        saltValue,
        await hashPassword(details.password, salt),
      );
    }

    const registration: ArtistRegistration = {
      id: window.crypto.randomUUID(),
      name: details.name.trim(),
      email,
      phone: details.phone.trim(),
      eventName: details.eventName,
      createdAt: new Date().toISOString(),
    };
    const accounts = current.accounts.some((candidate) => candidate.email === email)
      ? current.accounts.map((candidate) => candidate.email === email ? account : candidate)
      : [...current.accounts, account];
    const response = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: details.name,
        email: details.email,
        phone: details.phone,
        eventName: details.eventName,
      }),
    });
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new Error("The registration service returned an invalid response.");
    }
    if (!response.ok) {
      const message =
        result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "Could not save your registration. Please try again.";
      throw new Error(message);
    }

    commit({
      ...current,
      accounts,
      registrations: [...current.registrations, registration],
      user: toAuthUser(account),
    });
  }, [commit]);

  const logout = useCallback(async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      throw new Error("The sign-in session could not be cleared.");
    }
    setSessionUser(null);
    setSessionError("");
    commit({ ...readState(), user: null });
  }, [commit]);

  const value = useMemo<AuthContextValue>(() => ({
    user: sessionUser ?? (snapshot.state.user?.role === "artist" ? snapshot.state.user : null),
    registrations: snapshot.state.registrations,
    ready: snapshot.ready && sessionReady,
    storageError: snapshot.storageError,
    sessionError,
    refreshSession,
    registerForEvent,
    logout,
  }), [snapshot, sessionUser, sessionReady, sessionError, refreshSession, registerForEvent, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
