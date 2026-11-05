import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin-auth";
import { RUNTIME_CONFIG_KEYS, getRuntimeConfig, saveRuntimeConfig, type RuntimeConfigKey } from "@/services/runtime-config";

function masked(value: string | undefined): string {
  if (!value) return "";
  if (value.length < 8) return "••••••••";
  return `${value.slice(0, 3)}${"•".repeat(Math.min(16, value.length - 6))}${value.slice(-3)}`;
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  try {
    const values = await getRuntimeConfig();
    return NextResponse.json({
      keys: RUNTIME_CONFIG_KEYS.map((key) => ({ key, configured: Boolean(values[key]), value: masked(values[key]) })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load runtime settings.", error);
    return NextResponse.json({ error: "Could not load runtime settings." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter valid settings." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("values" in body) || !body.values || typeof body.values !== "object") {
    return NextResponse.json({ error: "Enter valid settings." }, { status: 400 });
  }
  const values: Partial<Record<RuntimeConfigKey, string>> = {};
  for (const [key, value] of Object.entries(body.values)) {
    if (RUNTIME_CONFIG_KEYS.includes(key as RuntimeConfigKey) && typeof value === "string" && value.trim()) {
      values[key as RuntimeConfigKey] = value.trim();
    }
  }
  try {
    await saveRuntimeConfig(values);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not save runtime settings.", error);
    return NextResponse.json({ error: "Could not save runtime settings." }, { status: 503 });
  }
}
