"use client";

import { useState } from "react";

export function SharePublicPageButton({
  path,
  label = "Share public page",
}: {
  path: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");

  async function sharePage() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        setStatus("shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    }
  }

  return (
    <button
      className="inline-flex min-h-9 items-center rounded-lg border border-[#d9af57]/30 px-3 text-xs text-[#f0ddab] transition hover:border-[#d9af57]/60 disabled:cursor-wait disabled:opacity-70"
      onClick={() => void sharePage()}
      type="button"
    >
      {status === "shared" ? "Shared" : status === "copied" ? "Link copied" : status === "error" ? "Try again" : label}
    </button>
  );
}
