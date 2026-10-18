"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-context";

type RegistrationFormProps = {
  eventNames: string[];
  selectedEvent?: string;
};

export function RegistrationForm({ eventNames, selectedEvent }: RegistrationFormProps) {
  const router = useRouter();
  const { registerForEvent, storageError } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultEvent = eventNames.includes(selectedEvent ?? "") ? selectedEvent : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      await registerForEvent({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        eventName: String(formData.get("event") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your registration.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-5 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="registration-name" className="text-xs uppercase tracking-[0.16em] text-[#e7d7aa]">
            Full name <span aria-hidden="true" className="text-[#d9af57]">*</span>
          </label>
          <input
            autoComplete="name"
            className="mt-2 min-h-12 w-full rounded-xl border border-[#d9af57]/20 bg-[#090909] px-4 py-3 text-base text-[#fff5d9] outline-none transition placeholder:text-[#81765f] focus:border-[#d9af57]"
            id="registration-name"
            name="name"
            placeholder="Your full name"
            required
          />
        </div>

        <div>
          <label htmlFor="registration-email" className="text-xs uppercase tracking-[0.16em] text-[#e7d7aa]">
            Email address <span aria-hidden="true" className="text-[#d9af57]">*</span>
          </label>
          <input
            autoComplete="email"
            className="mt-2 min-h-12 w-full rounded-xl border border-[#d9af57]/20 bg-[#090909] px-4 py-3 text-base text-[#fff5d9] outline-none transition placeholder:text-[#81765f] focus:border-[#d9af57]"
            id="registration-email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div>
          <label htmlFor="registration-phone" className="text-xs uppercase tracking-[0.16em] text-[#e7d7aa]">
            Phone number <span aria-hidden="true" className="text-[#d9af57]">*</span>
          </label>
          <input
            autoComplete="tel"
            className="mt-2 min-h-12 w-full rounded-xl border border-[#d9af57]/20 bg-[#090909] px-4 py-3 text-base text-[#fff5d9] outline-none transition placeholder:text-[#81765f] focus:border-[#d9af57]"
            id="registration-phone"
            name="phone"
            placeholder="Your contact number"
            required
            type="tel"
          />
        </div>

        <div>
          <label htmlFor="registration-event" className="text-xs uppercase tracking-[0.16em] text-[#e7d7aa]">
            Choose an event <span aria-hidden="true" className="text-[#d9af57]">*</span>
          </label>
          <select
            className="mt-2 min-h-12 w-full rounded-xl border border-[#d9af57]/20 bg-[#090909] px-4 py-3 text-base text-[#fff5d9] outline-none transition focus:border-[#d9af57]"
            defaultValue={defaultEvent}
            id="registration-event"
            name="event"
            required
          >
            <option disabled value="">Select an event</option>
            {eventNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="registration-password" className="text-xs uppercase tracking-[0.16em] text-[#e7d7aa]">
            Create a password <span aria-hidden="true" className="text-[#d9af57]">*</span>
          </label>
          <input
            autoComplete="new-password"
            className="mt-2 min-h-12 w-full rounded-xl border border-[#d9af57]/20 bg-[#090909] px-4 py-3 text-base text-[#fff5d9] outline-none transition placeholder:text-[#81765f] focus:border-[#d9af57]"
            id="registration-password"
            minLength={8}
            name="password"
            placeholder="At least 8 characters"
            required
            type="password"
          />
          <p className="mt-2 text-xs text-[#a99b7e]">
            Registration details are shared with the event team so they can manage attendance. Create a verified account at{" "}
            <Link className="text-[#f0ddab] underline underline-offset-2" href="/signup">sign up</Link>{" "}
            to use your persistent artist dashboard. Already registered?{" "}
            <Link className="text-[#f0ddab] underline underline-offset-2" href="/login">Log in</Link>.
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-[#a99b7e]">
        Your event registration will be visible to event administrators and in your artist dashboard.
      </p>
      {(error || storageError) && (
        <p aria-live="polite" className="mt-4 rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200" role="alert">
          {error || storageError}
        </p>
      )}
      <button
        className="mt-6 min-h-12 w-full rounded-full border border-[#d9af57] bg-[#d9af57] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#121212] transition hover:bg-[#f2d98b] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2d98b] sm:w-auto"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Registering..." : "Register as an artist"}
      </button>
    </form>
  );
}
