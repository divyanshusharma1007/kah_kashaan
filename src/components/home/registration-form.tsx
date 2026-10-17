"use client";

import { useRef, useState, type FormEvent } from "react";

type RegistrationFormProps = {
  eventNames: string[];
  selectedEvent?: string;
};

export function RegistrationForm({ eventNames, selectedEvent }: RegistrationFormProps) {
  const [previewed, setPreviewed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultEvent = eventNames.includes(selectedEvent ?? "") ? selectedEvent : "";

  function preventSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handlePreview() {
    if (!formRef.current?.reportValidity()) return;
    setPreviewed(true);
  }

  return (
    <form
      ref={formRef}
      onSubmit={preventSubmission}
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
      </div>

      <p className="mt-5 text-xs leading-5 text-[#a99b7e]">
        All fields are required. This is a UI preview only; submitting does not send or save your registration.
      </p>
      <button
        onClick={handlePreview}
        className="mt-6 min-h-12 w-full rounded-full border border-[#d9af57] bg-[#d9af57] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#121212] transition hover:bg-[#f2d98b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2d98b] sm:w-auto"
        type="button"
      >
        Preview registration
      </button>

      {previewed && (
        <p aria-live="polite" className="mt-4 rounded-xl border border-[#d9af57]/20 bg-[#17140d] p-4 text-sm leading-6 text-[#f0ddab]">
          Your required fields are complete. This preview did not submit or store your registration.
        </p>
      )}
    </form>
  );
}
