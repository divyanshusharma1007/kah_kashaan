"use client";

import { useEffect, useState } from "react";

type Setting = { key: string; configured: boolean; value: string };

export function RuntimeSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load settings.");
        setSettings(result.keys);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load settings."));
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save settings.");
      setNotice("Settings saved. New server requests will use the database values.");
      setValues({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-[9px] uppercase tracking-[0.2em] text-[#a79a7d]">Administrator workspace</p>
      <h1 className="mt-1 font-[var(--font-display)] text-4xl text-[#fff5d9]">Runtime settings</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99b7e]">
        Configure integrations from the database. Existing environment values are imported automatically the first time this page is used. Secrets are never displayed.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a99b7e]">
        Canva uses three different values: the client ID, the client secret, and an access token. A client secret is not an access token. Environment values take priority over older database values.
      </p>
      {error && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error}</p>}
      {notice && <p className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-3 text-sm text-emerald-200" role="status">{notice}</p>}
      <div className="mt-6 space-y-3 rounded-2xl border border-white/[0.07] bg-[#10100f] p-5">
        {settings.map((setting) => (
          <label className="block" key={setting.key}>
            <span className="text-xs font-medium text-[#cbbd9f]">{setting.key}</span>
            <input
              className="mt-1.5 min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#0b0b0a] px-3 text-sm text-[#fff5d9] outline-none placeholder:text-[#716954] focus:border-[#d9af57]/50"
              onChange={(event) => setValues((current) => ({ ...current, [setting.key]: event.target.value }))}
              placeholder={setting.configured ? `${setting.value} — leave blank to keep current` : "Not configured"}
              type={setting.key.includes("SECRET") || setting.key.includes("PASSWORD") || setting.key.includes("TOKEN") || setting.key === "AUTH_SECRET" ? "password" : "text"}
              value={values[setting.key] ?? ""}
            />
          </label>
        ))}
        <button className="min-h-11 rounded-xl bg-[#d9af57] px-5 text-xs font-semibold text-[#121212] disabled:opacity-60" disabled={saving} onClick={() => void save()} type="button">
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </section>
  );
}
