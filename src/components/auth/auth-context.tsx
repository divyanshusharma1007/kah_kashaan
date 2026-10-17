"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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
  createArtistAccount: (name: string, email: string, password: string) => Promise<void>;
  registerForEvent: (details: {
    name: string;
    email: string;
    phone: string;
    eventName: string;
    password: string;
  }) => Promise<void>;
  loginArtist: (email: string, password: string) => Promise<void>;
  enterDemoAdmin: () => void;
  logout: () => void;
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
    cachedSnapshot = { state: readState(), ready: true, storageError: "" };
  } catch (error) {
    cachedSnapshot = {
      state: emptyState(),
      ready: true,
      storageError: error instanceof Error ? error.message : "Could not read saved demo account data.",
    };
  }
  return cachedSnapshot;
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

  const commit = useCallback((next: DemoState) => {
    saveState(next);
  }, []);

  const createArtistAccount = useCallback(async (name: string, email: string, password: string) => {
    const current = readState();
    const normalizedEmail = normalizeEmail(email);
    if (current.accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error("An artist account already uses this email. Log in instead.");
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const saltValue = toBase64(salt);
    const passwordHash = await hashPassword(password, salt);
    const account = makeArtistAccount(name, normalizedEmail, "", saltValue, passwordHash);
    commit({ ...current, accounts: [...current.accounts, account], user: toAuthUser(account) });
  }, [commit]);

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
    commit({
      ...current,
      accounts,
      registrations: [...current.registrations, registration],
      user: toAuthUser(account),
    });
  }, [commit]);

  const loginArtist = useCallback(async (email: string, password: string) => {
    const current = readState();
    const account = current.accounts.find((candidate) => candidate.email === normalizeEmail(email));
    if (!account || await hashPassword(password, fromBase64(account.salt)) !== account.passwordHash) {
      throw new Error("Email or password is incorrect.");
    }
    commit({ ...current, user: toAuthUser(account) });
  }, [commit]);

  const enterDemoAdmin = useCallback(() => {
    const current = readState();
    commit({
      ...current,
      user: { name: "Demo Admin", email: "admin-demo@kah-kashaan.local", role: "admin" },
    });
  }, [commit]);

  const logout = useCallback(() => {
    commit({ ...readState(), user: null });
  }, [commit]);

  const value = useMemo<AuthContextValue>(() => ({
    user: snapshot.state.user,
    registrations: snapshot.state.registrations,
    ready: snapshot.ready,
    storageError: snapshot.storageError,
    createArtistAccount,
    registerForEvent,
    loginArtist,
    enterDemoAdmin,
    logout,
  }), [snapshot, createArtistAccount, registerForEvent, loginArtist, enterDemoAdmin, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
