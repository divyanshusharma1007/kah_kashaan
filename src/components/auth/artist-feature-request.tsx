"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArtistDashboardProfilePreview } from "@/components/artists/artist-dashboard-profile-preview";

type FeatureState = {
  status: "not-requested" | "requested" | "featured" | "rejected";
  profileId: string | null;
  retryAt: string | null;
  feeRupees: number | null;
  paymentStatus: "unpaid" | "paid" | "free" | null;
  selectedWriteupCount: number;
};

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact?: string };
  readonly: { email: boolean; contact?: boolean };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

type CooldownClock = { retryAt: string; now: number } | null;

function isFeatureState(value: unknown): value is FeatureState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<FeatureState>;
  return (state.status === "not-requested" || state.status === "requested" ||
      state.status === "featured" || state.status === "rejected") &&
    (typeof state.profileId === "string" || state.profileId === null) &&
    (typeof state.retryAt === "string" || state.retryAt === null) &&
    (typeof state.feeRupees === "number" || state.feeRupees === null) &&
    (state.paymentStatus === null || state.paymentStatus === "unpaid" ||
      state.paymentStatus === "paid" || state.paymentStatus === "free") &&
    typeof state.selectedWriteupCount === "number";
}

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    const script = existingScript ?? document.createElement("script");
    const loaded = () => window.Razorpay
      ? resolve()
      : reject(new Error("Razorpay checkout did not load correctly."));
    const failed = () => reject(new Error("Could not load Razorpay checkout. Check your connection and try again."));
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existingScript) {
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

async function readFeatureState(response: Response): Promise<FeatureState> {
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The public profile service returned an invalid response.");
  }
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result &&
      typeof result.error === "string" ? result.error : "Could not load your public profile status.";
    throw new Error(message);
  }
  if (!isFeatureState(result)) throw new Error("The public profile service returned an invalid response.");
  return result;
}

export function ArtistFeatureRequest() {
  const [feature, setFeature] = useState<FeatureState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cooldownClock, setCooldownClock] = useState<CooldownClock>(null);

  async function refreshFeatureState() {
    const state = await readFeatureState(
      await fetch("/api/artist/feature-request", { cache: "no-store" }),
    );
    setFeature(state);
    return state;
  }

  useEffect(() => {
    let active = true;
    fetch("/api/artist/feature-request", { cache: "no-store" })
      .then(readFeatureState)
      .then((state) => {
        if (active) setFeature(state);
      })
      .catch((cause: unknown) => {
        console.error("Could not load artist public profile status.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Could not load public profile status.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (feature?.status !== "rejected" || !feature.retryAt) return;
    const retryAt = feature.retryAt;
    const updateClock = () => setCooldownClock({ retryAt, now: Date.now() });
    const initialUpdate = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 60_000);
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, [feature?.retryAt, feature?.status]);

  async function verifyPayment(payment: RazorpayCheckoutResponse) {
    const response = await fetch("/api/artist/feature-request/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payment),
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = result && typeof result === "object" && "error" in result &&
        typeof result.error === "string" ? result.error : "Could not confirm your feature-request payment.";
      throw new Error(message);
    }
    await refreshFeatureState();
    setMessage("Payment confirmed. Your feature request has been sent to the admin for review.");
  }

  async function requestFeature() {
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await loadRazorpayCheckout();
      const response = await fetch("/api/artist/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage = result && typeof result === "object" && "error" in result &&
          typeof result.error === "string" ? result.error : "Could not start your feature-request payment.";
        throw new Error(errorMessage);
      }
      if (
        !result || typeof result !== "object" ||
        !("keyId" in result) || typeof result.keyId !== "string" ||
        !("order" in result) || !result.order || typeof result.order !== "object" ||
        !("id" in result.order) || typeof result.order.id !== "string" ||
        !("amount" in result.order) || typeof result.order.amount !== "number" ||
        !("currency" in result.order) || typeof result.order.currency !== "string" ||
        !("artistName" in result) || typeof result.artistName !== "string" ||
        !("email" in result) || typeof result.email !== "string" ||
        !("feeRupees" in result) || typeof result.feeRupees !== "number" ||
        ("contact" in result && typeof result.contact !== "string")
      ) throw new Error("The feature payment service returned an invalid order.");
      if (!window.Razorpay) throw new Error("Razorpay checkout did not load correctly.");

      const checkout = new window.Razorpay({
        key: result.keyId,
        order_id: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
        name: "Kah-Kashaan",
        description: "Artist feature request",
        prefill: {
          name: result.artistName,
          email: result.email,
          ...("contact" in result && typeof result.contact === "string"
            ? { contact: result.contact }
            : {}),
        },
        readonly: {
          email: true,
          ...("contact" in result && typeof result.contact === "string"
            ? { contact: true }
            : {}),
        },
        handler: (payment) => {
          void verifyPayment(payment)
            .catch((cause: unknown) => {
              console.error("Could not confirm artist feature payment.", cause);
              setError(cause instanceof Error ? cause.message : "Could not confirm your payment.");
            })
            .finally(() => setSubmitting(false));
        },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      checkout.open();
    } catch (cause) {
      console.error("Could not start artist feature payment.", cause);
      setError(cause instanceof Error ? cause.message : "Could not start the feature payment.");
      setSubmitting(false);
    }
  }

  const retryAtTime = feature?.retryAt ? Date.parse(feature.retryAt) : null;
  const checkedNow = cooldownClock && cooldownClock.retryAt === feature?.retryAt
    ? cooldownClock.now
    : null;
  const isCooldownActive = feature?.status === "rejected" &&
    retryAtTime !== null &&
    (checkedNow === null || retryAtTime > checkedNow);
  const canRequest = feature?.status === "not-requested" ||
    (feature?.status === "rejected" && !isCooldownActive);

  return (
    <section className="mx-auto w-full max-w-6xl" aria-labelledby="artist-feature-heading">
      <header>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#d9af57]">Public artist directory</p>
        <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl" id="artist-feature-heading">
          Your public profile
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c1b596]">
          Preview your profile as visitors see it. Admins approve your selected writeups and feature request before they appear publicly.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center rounded-full border border-[#d9af57]/35 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f0ddab] transition hover:border-[#d9af57]/70"
            href="/dashboard/artist/profile"
          >
            Edit artist profile
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-full border border-white/[0.12] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d8c8a2] transition hover:border-white/25"
            href="/dashboard/artist/writing"
          >
            Manage writing portfolio
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="mt-6 rounded-xl border border-white/[0.08] bg-[#10100f] p-5 text-sm text-[#a99b7e]" role="status">
          Checking profile status...
        </p>
      ) : feature ? (
        <>
          {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{error}</p>}
          {message && <p className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-3 text-sm text-emerald-100" role="status">{message}</p>}
          <div className="mt-6 rounded-xl border border-[#d9af57]/20 bg-[#10100f] p-4 text-sm leading-6 text-[#c1b596]">
            <p>
              Feature fee:{" "}
              <strong className="text-[#f0ddab]">
                {feature.feeRupees === null ? "Not set by admin" : `₹${feature.feeRupees}`}
              </strong>
            </p>
            <p className="mt-1">
              Selected writeups: <strong className="text-[#f0ddab]">{feature.selectedWriteupCount}/4</strong>.
              Select 3–4 works before requesting featuring.
            </p>
            {feature.status === "requested" && (
              <p className="mt-1">
                Request payment: <strong className="text-[#f0ddab]">
                  {feature.paymentStatus === "free" ? "Marked free by admin" : "Paid and awaiting admin review"}
                </strong>
              </p>
            )}
            {feature.status === "featured" && <p className="mt-1 text-emerald-200">Your profile is live on the website.</p>}
          </div>
          {canRequest && (
            <button
              className="mt-5 min-h-11 rounded-full border border-[#d9af57]/35 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#f0ddab] transition hover:border-[#d9af57] disabled:opacity-60"
              disabled={submitting || feature.feeRupees === null || feature.selectedWriteupCount < 3 || feature.selectedWriteupCount > 4}
              onClick={() => void requestFeature()}
              type="button"
            >
              {submitting
                ? "Processing payment..."
                : feature.feeRupees === null
                  ? "Waiting for admin to set fee"
                  : `Pay ₹${feature.feeRupees} & request feature`}
            </button>
          )}
          {feature.status === "rejected" && isCooldownActive && feature.retryAt && (
            <p className="mt-4 text-xs text-[#a99b7e]">
              Your request can be submitted again after {new Date(feature.retryAt).toLocaleDateString()}.
            </p>
          )}
          <ArtistDashboardProfilePreview status={feature.status} />
        </>
      ) : (
        <p className="mt-6 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {error || "Could not load your public profile status."}
        </p>
      )}
    </section>
  );
}
