"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArtistSkillSelector } from "@/components/auth/artist-skill-selector";
import { useAuth } from "@/components/auth/auth-context";
import type { ArtistSkill } from "@/services/artist-skills";

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

type RegistrationFormProps = {
  eventNames: string[];
  eventChoices?: { id: string; title: string; skillIds: string[]; price: number }[];
  selectedEvent?: string;
  selectedEventId?: string;
};

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    const script = existingScript ?? document.createElement("script");
    const loaded = () => {
      if (window.Razorpay) resolve();
      else reject(new Error("Razorpay checkout did not load correctly."));
    };
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

export function RegistrationForm({ eventNames, eventChoices = [], selectedEvent, selectedEventId }: RegistrationFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [skills, setSkills] = useState<ArtistSkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [profileSkillIds, setProfileSkillIds] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<RazorpayCheckoutResponse | null>(null);
  const [eventName, setEventName] = useState(selectedEvent && eventNames.includes(selectedEvent) ? selectedEvent : "");
  const [paymentOption, setPaymentOption] = useState<"online" | "at-event">("online");
  const signedInArtist = user?.role === "artist" && user.provider ? user : null;
  const activeEventName = eventNames.length === 1 ? eventNames[0] : eventName;
  const selectedChoice = eventChoices.find((event) => event.title === activeEventName);
  const selectedEventPrice = selectedChoice?.price ?? 0;
  const visibleSkills = selectedChoice?.skillIds.length
    ? skills.filter((skill) => selectedChoice.skillIds.includes(skill.id))
    : skills;
  const hasMatchingProfileSkill =
    !selectedChoice?.skillIds.length ||
    selectedChoice.skillIds.some((skillId) => profileSkillIds.includes(skillId));
  const hasSelectedEventSkill =
    !selectedChoice?.skillIds.length ||
    selectedChoice.skillIds.some((skillId) =>
      profileSkillIds.includes(skillId) && selectedSkillIds.includes(skillId),
    );
  const isEligibleForSelectedEvent = hasMatchingProfileSkill && hasSelectedEventSkill;

  async function confirmOnlineRegistration(payment: RazorpayCheckoutResponse) {
    const response = await fetch("/api/registrations/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payment),
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = result && typeof result === "object" &&
        "error" in result && typeof result.error === "string"
        ? result.error
        : "Payment was received, but registration could not be confirmed.";
      throw new Error(message);
    }
    setRegistered(true);
    setPendingPayment(null);
    router.refresh();
  }

  async function retryOnlineRegistration() {
    if (!pendingPayment) return;
    setSubmitting(true);
    setError("");
    try {
      await confirmOnlineRegistration(pendingPayment);
    } catch (cause) {
      console.error("Could not retry registration confirmation after Razorpay payment.", cause);
      setError(cause instanceof Error ? cause.message : "Could not confirm your payment.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!signedInArtist) return;
    let active = true;
    Promise.all([
      fetch("/api/skills", { cache: "no-store" }),
      fetch("/api/artist/profile", { cache: "no-store" }),
    ])
      .then(async ([skillsResponse, profileResponse]) => {
        const [skillsResult, profileResult] = await Promise.all([
          skillsResponse.json(),
          profileResponse.json(),
        ]) as [unknown, unknown];
        if (!skillsResponse.ok) {
          throw new Error(skillsResult && typeof skillsResult === "object" && "error" in skillsResult &&
            typeof skillsResult.error === "string" ? skillsResult.error : "Performance skills could not be loaded.");
        }
        if (!profileResponse.ok) {
          throw new Error(profileResult && typeof profileResult === "object" && "error" in profileResult &&
            typeof profileResult.error === "string" ? profileResult.error : "Your saved profile skills could not be loaded.");
        }
        if (!skillsResult || typeof skillsResult !== "object" || !("skills" in skillsResult) ||
            !Array.isArray(skillsResult.skills) || !profileResult || typeof profileResult !== "object" ||
            !("profile" in profileResult) || !profileResult.profile || typeof profileResult.profile !== "object") {
          throw new Error("Performance skills returned an invalid response.");
        }
        const availableSkills = skillsResult.skills.filter((skill): skill is ArtistSkill => {
          if (!skill || typeof skill !== "object") return false;
          const item = skill as Partial<ArtistSkill>;
          return typeof item.id === "string" && typeof item.name === "string" &&
            typeof item.description === "string" && typeof item.createdAt === "string" &&
            typeof item.updatedAt === "string";
        });
        const profile = profileResult.profile as { skillIds?: unknown };
        if (profile.skillIds !== undefined &&
            (!Array.isArray(profile.skillIds) || !profile.skillIds.every((id) => typeof id === "string"))) {
          throw new Error("Your saved profile skills returned an invalid response.");
        }
        if (active) {
          setSkills(availableSkills);
          const savedSkillIds = Array.isArray(profile.skillIds)
            ? profile.skillIds.filter((id): id is string =>
                typeof id === "string" && availableSkills.some((skill) => skill.id === id),
              )
            : [];
          setProfileSkillIds(savedSkillIds);
          setSelectedSkillIds(savedSkillIds);
        }
      })
      .catch((cause: unknown) => {
        console.error("Could not load registration skills.", cause);
        if (active) setError(cause instanceof Error ? cause.message : "Performance skills could not be loaded.");
      })
      .finally(() => {
        if (active) setLoadingSkills(false);
      });
    return () => {
      active = false;
    };
  }, [signedInArtist]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    let checkoutOpened = false;
    try {
      const selectedName = eventNames.length === 1 ? eventNames[0] : eventName;
      if (!selectedName) throw new Error("Choose an event before registering.");
      const eventId = eventChoices.find((event) => event.title === selectedName)?.id ?? selectedEventId;
      if (!eventId) throw new Error("Choose a valid event before registering.");
      const registrationDetails = {
        name: signedInArtist?.name,
        email: signedInArtist?.email,
        eventName: selectedName,
        eventId,
        skillIds: selectedSkillIds.filter((id) => visibleSkills.some((skill) => skill.id === id)),
      };

      if (selectedEventPrice > 0 && paymentOption === "online") {
        await loadRazorpayCheckout();
        const orderResponse = await fetch("/api/registrations/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registrationDetails),
        });
        const orderResult: unknown = await orderResponse.json().catch(() => null);
        if (!orderResponse.ok) {
          const message = orderResult && typeof orderResult === "object" &&
            "error" in orderResult && typeof orderResult.error === "string"
            ? orderResult.error
            : "Could not start the online payment.";
          throw new Error(message);
        }
        if (
          !orderResult || typeof orderResult !== "object" ||
          !("keyId" in orderResult) || typeof orderResult.keyId !== "string" ||
          !("order" in orderResult) || !orderResult.order || typeof orderResult.order !== "object" ||
          !("id" in orderResult.order) || typeof orderResult.order.id !== "string" ||
          !("amount" in orderResult.order) || typeof orderResult.order.amount !== "number" ||
          !("currency" in orderResult.order) || typeof orderResult.order.currency !== "string" ||
          !("eventName" in orderResult) || typeof orderResult.eventName !== "string" ||
          !("artistName" in orderResult) || typeof orderResult.artistName !== "string" ||
          !("email" in orderResult) || typeof orderResult.email !== "string" ||
          ("contact" in orderResult && typeof orderResult.contact !== "string")
        ) {
          throw new Error("The payment service returned an invalid order.");
        }
        if (!window.Razorpay) throw new Error("Razorpay checkout did not load correctly.");

        const checkout = new window.Razorpay({
          key: orderResult.keyId,
          order_id: orderResult.order.id,
          amount: orderResult.order.amount,
          currency: orderResult.order.currency,
          name: "Kah-Kashaan",
          description: `Registration: ${orderResult.eventName}`,
          prefill: {
            name: orderResult.artistName,
            email: orderResult.email,
            ...("contact" in orderResult && typeof orderResult.contact === "string"
              ? { contact: orderResult.contact }
              : {}),
          },
          readonly: {
            email: true,
            ...("contact" in orderResult && typeof orderResult.contact === "string"
              ? { contact: true }
              : {}),
          },
          handler: (payment) => {
            void confirmOnlineRegistration(payment)
              .catch((cause: unknown) => {
                console.error("Could not complete registration after Razorpay payment.", cause);
                setPendingPayment(payment);
                setError(cause instanceof Error ? cause.message : "Could not confirm your payment.");
              })
              .finally(() => setSubmitting(false));
          },
          modal: { ondismiss: () => setSubmitting(false) },
        });
        checkout.open();
        checkoutOpened = true;
        return;
      }

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registrationDetails,
          paymentMethod: selectedEventPrice === 0 ? "free" : "at-event",
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "Could not complete your registration.";
        throw new Error(message);
      }
      setRegistered(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete your registration.");
    } finally {
      if (!checkoutOpened) setSubmitting(false);
    }
  }

  if (!signedInArtist) {
    if (!ready) {
      return <p className="rounded-xl border border-white/[0.08] bg-[#10100f] p-4 text-sm text-[#a99b7e]" role="status">Checking your artist account...</p>;
    }
    const destination = selectedEventId ? `/events/${selectedEventId}` : pathname;
    if (user?.role === "admin") {
      return (
        <p className="rounded-xl border border-white/[0.08] bg-[#10100f] p-4 text-sm text-[#a99b7e]">
          Event registration is available to signed-in artist accounts.
        </p>
      );
    }
    return (
      <div className="rounded-2xl border border-[#d9af57]/20 bg-[#111111] p-5 sm:p-6">
        <p className="text-sm leading-6 text-[#d8c8a2]">Sign in with your artist account to register and keep this event in your artist dashboard.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#121212] hover:bg-[#f2d98b]" href={`/login?returnTo=${encodeURIComponent(destination)}`}>
            Log in to register
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-[#d9af57]/35 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#f0ddab] hover:border-[#d9af57]" href={`/signup?returnTo=${encodeURIComponent(destination)}`}>
            Create artist account
          </Link>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-5 sm:p-6" role="status">
        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200">Registration confirmed</p>
        <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[#fff5d9]">{eventNames.length === 1 ? eventNames[0] : eventName}</h3>
        <p className="mt-2 text-sm leading-6 text-[#c6bda5]">This event is now part of your artist dashboard.</p>
        <Link className="mt-4 inline-flex min-h-10 items-center text-xs font-semibold uppercase tracking-[0.14em] text-[#f0ddab] underline underline-offset-4" href="/dashboard/artist">
          View artist dashboard
        </Link>
      </div>
    );
  }

  return (
    <form className="rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-5 sm:p-8" onSubmit={handleSubmit}>
      <div className="mb-5 rounded-xl border border-white/[0.07] bg-[#0b0b0a] p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#a79a7d]">Registering as</p>
        <p className="mt-1 text-sm font-medium text-[#f0e6ce]">{signedInArtist.name}</p>
        <p className="mt-1 break-all text-xs text-[#827864]">{signedInArtist.email}</p>
      </div>
      {eventNames.length > 1 && (
        <label className="block text-xs uppercase tracking-[0.16em] text-[#e7d7aa]" htmlFor="registration-event">
          Choose an event
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-[#d9af57]/20 bg-[#090909] px-4 py-3 text-base normal-case tracking-normal text-[#fff5d9] outline-none focus:border-[#d9af57]"
            id="registration-event"
            onChange={(event) => {
              const nextName = event.target.value;
              const nextChoice = eventChoices.find((choice) => choice.title === nextName);
              setEventName(nextName);
              if (nextChoice?.skillIds.length) {
                setSelectedSkillIds((current) => current.filter((id) => nextChoice.skillIds.includes(id)));
              }
            }}
            required
            value={eventName}
          >
            <option value="">Select an event</option>
            {eventNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      )}
      <fieldset className="mt-5" disabled={loadingSkills || submitting}>
        <legend className="text-xs font-medium uppercase tracking-[0.16em] text-[#e7d7aa]">What would you like to perform?</legend>
        <p className="mb-3 mt-2 text-xs leading-5 text-[#a99b7e]">
          Select the skills you plan to perform. Your profile skills are preselected; events with requirements need at least one required skill saved on your profile.
        </p>
        {loadingSkills ? (
          <p className="rounded-xl border border-white/[0.08] p-4 text-sm text-[#a99b7e]" role="status">Loading performance skills...</p>
        ) : (
          <ArtistSkillSelector
            disabledIds={visibleSkills
              .filter((skill) => !profileSkillIds.includes(skill.id))
              .map((skill) => skill.id)}
            idPrefix="event-registration"
            onChange={setSelectedSkillIds}
            selectedIds={selectedSkillIds}
            skills={visibleSkills}
          />
        )}
      </fieldset>
      {selectedEventPrice > 0 ? (
        <fieldset className="mt-6" disabled={submitting}>
          <legend className="text-xs font-medium uppercase tracking-[0.16em] text-[#e7d7aa]">
            Payment option · {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(selectedEventPrice)}
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 transition ${
              paymentOption === "online" ? "border-[#d9af57] bg-[#d9af57]/[0.08]" : "border-white/[0.08] bg-[#0b0b0a]"
            }`}>
              <input
                checked={paymentOption === "online"}
                className="accent-[#d9af57]"
                name="registration-payment"
                onChange={() => setPaymentOption("online")}
                type="radio"
                value="online"
              />
              <span className="ml-2 text-sm font-medium text-[#f0e6ce]">Pay online now</span>
              <span className="mt-2 block pl-6 text-xs leading-5 text-[#a99b7e]">
                Secure Razorpay checkout with credit and debit cards.
              </span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-4 transition ${
              paymentOption === "at-event" ? "border-[#d9af57] bg-[#d9af57]/[0.08]" : "border-white/[0.08] bg-[#0b0b0a]"
            }`}>
              <input
                checked={paymentOption === "at-event"}
                className="accent-[#d9af57]"
                name="registration-payment"
                onChange={() => setPaymentOption("at-event")}
                type="radio"
                value="at-event"
              />
              <span className="ml-2 text-sm font-medium text-[#f0e6ce]">Pay at the event</span>
              <span className="mt-2 block pl-6 text-xs leading-5 text-[#a99b7e]">
                Reserve your place and pay the event team on arrival.
              </span>
            </label>
          </div>
        </fieldset>
      ) : (
        <p className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-950/15 p-4 text-sm text-emerald-100">
          This event is free. No payment is required.
        </p>
      )}
      {!loadingSkills && !error && selectedChoice?.skillIds.length && !isEligibleForSelectedEvent && (
        <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100" role="status">
          {!hasMatchingProfileSkill ? (
            <>
              This event requires at least one listed skill in your artist profile.{" "}
              <Link className="font-semibold underline underline-offset-4" href="/dashboard/artist#artist-profile-heading">
                Update your profile skills
              </Link>{" "}
              to register.
            </>
          ) : (
            "Select at least one of your event skills to register. Your profile skills are preselected."
          )}
        </p>
      )}
      {error && <p className="mt-4 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">{error}</p>}
      {pendingPayment && (
        <button
          className="mt-3 min-h-11 w-full rounded-xl border border-[#d9af57]/35 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#f0ddab] transition hover:border-[#d9af57] disabled:opacity-60 sm:w-auto"
          disabled={submitting}
          onClick={() => void retryOnlineRegistration()}
          type="button"
        >
          {submitting ? "Confirming payment..." : "Retry registration confirmation"}
        </button>
      )}
      <p className="mt-5 text-xs leading-5 text-[#a99b7e]">
        A phone number is optional. You can add your contact details and performance skills to your profile at any time.
      </p>
      <button className="mt-6 min-h-12 w-full rounded-full border border-[#d9af57] bg-[#d9af57] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2d98b] sm:w-auto" disabled={submitting || loadingSkills || !isEligibleForSelectedEvent || (eventNames.length > 1 && !eventName)} type="submit">
        {submitting ? "Processing..." : selectedEventPrice > 0 && paymentOption === "online" ? "Pay & register" : "Register for event"}
      </button>
    </form>
  );
}
