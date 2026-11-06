import Link from "next/link";

export function IndoreLiterarySection() {
  return (
    <section className="py-14" aria-labelledby="indore-literary-heading">
      <div className="rounded-[1.5rem] border border-[#d9af57]/20 bg-[#101010] p-5 sm:rounded-[2rem] sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Literature in Indore</p>
        <h2 id="indore-literary-heading" className="mt-4 max-w-4xl font-[var(--font-display)] text-3xl text-[#fff5d9] sm:text-4xl">
          Poetry, shayari and learning for Indore&apos;s artists
        </h2>
        <div className="mt-5 grid gap-5 text-sm leading-7 text-[#d8ceb0] sm:grid-cols-2 sm:text-base">
          <p>
            Kah-Kashaan brings Indore artists, poets, writers, musicians and listeners together through open mic events,
            Hindi kavita, shayari, ghazal and gazal recitals, kavi sammelan, mushaira and Rekhta-inspired literary gatherings.
          </p>
          <p>
            Want to learn chhand, doha or ghazal writing? Join practical poetry workshops and mentorship circles that make
            Hindi poetry, meter, rhythm and performance easier to understand and practice.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-full bg-[#d9af57] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#14120d] hover:bg-[#f2d98b]" href="/events">
            Find an open mic
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-full border border-[#d9af57]/30 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#f0ddab] hover:border-[#f2d98b]" href="/programs">
            Learn poetry forms
          </Link>
        </div>
      </div>
    </section>
  );
}
