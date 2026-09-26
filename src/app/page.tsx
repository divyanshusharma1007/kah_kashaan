export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-brand-text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.18),_transparent_35%),linear-gradient(180deg,#050505_0%,#080808_50%,#040404_100%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 flex w-full max-w-5xl items-center justify-center rounded-full border border-[#d9af57]/60 bg-black/30 px-6 py-5 shadow-[0_0_28px_rgba(217,175,87,0.14)] backdrop-blur-sm">
          <div className="flex items-center gap-4 text-[#d9af57]">
            <span className="h-px w-12 bg-gradient-to-r from-transparent via-[#d9af57] to-transparent" />
            <span className="font-[var(--font-script)] text-4xl tracking-[0.2em] text-[#f3d58a] md:text-5xl">
              Kuhkashaan
            </span>
            <span className="h-px w-12 bg-gradient-to-r from-transparent via-[#d9af57] to-transparent" />
          </div>
        </div>

        <div className="relative flex w-full max-w-5xl items-center justify-center">
          <div className="relative flex h-[320px] w-[320px] items-center justify-center rounded-full border-[10px] border-[#d9af57]/80 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04),_rgba(0,0,0,0.2)_50%,_rgba(0,0,0,0.9)_100%)] shadow-[0_0_50px_rgba(217,175,87,0.18)] md:h-[420px] md:w-[420px]">
            <div className="absolute inset-[8%] rounded-full border border-[#f0d79d]/20" />
            <div className="absolute inset-[10%] rounded-full border-[8px] border-[#f8e6b5]/20 rotate-[-12deg]" />
            <div className="absolute inset-[16%] rounded-full bg-black/20 shadow-[inset_0_0_28px_rgba(0,0,0,0.65)]" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <span className="font-[var(--font-display)] text-[5.5rem] leading-none tracking-[0.02em] text-transparent bg-gradient-to-b from-[#fff3c9] via-[#e9c67a] to-[#b57a2b] bg-clip-text drop-shadow-[0_0_14px_rgba(217,175,87,0.28)] md:text-[8.5rem]">
                कहकशाँ
              </span>
              <span className="mt-[-0.8rem] font-[var(--font-script)] text-[3rem] leading-none tracking-[0.05em] text-transparent bg-gradient-to-b from-[#fff3c9] via-[#e0bc6f] to-[#b57a2b] bg-clip-text md:text-[5rem]">
                Kuhkashaan
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm uppercase tracking-[0.7em] text-[#d9af57] md:text-lg">
            The Store of Star&apos;s
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-5 md:flex-row">
          <button className="rounded-full border border-[#d9af57] bg-[#d9af57] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:scale-[1.02] hover:bg-[#f1d48f]">
            Explore Collection
          </button>
          <button className="rounded-full border border-[#d9af57]/45 bg-[#0d0d0d] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f6e4b8] transition hover:border-[#f1d48f] hover:text-[#fff1c4]">
            Book a Consultation
          </button>
        </div>
      </div>
    </main>
  );
}
