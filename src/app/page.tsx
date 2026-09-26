import Image from "next/image";

const programCards = [
  {
    title: "Nasihat",
    tag: "Mentorship & Learning",
    description:
      "Guided learning circles that help emerging voices explore craft, confidence, and creative direction with experienced mentors.",
    details: ["One-to-one guidance", "Writing & performance mentoring", "Community learning rituals"],
  },
  {
    title: "Workshops",
    tag: "Hands-on sessions",
    description:
      "Immersive sessions on poetry, meter, ghazal writing, and vocal training designed to sharpen technique and expression.",
    details: ["Poetry architecture", "Meter & rhythm labs", "Vocal technique coaching"],
  },
  {
    title: "Open Mic",
    tag: "Live expression",
    description:
      "A welcoming stage for poetry, shayari, storytelling, and music where emerging artists share original work with the community.",
    details: ["Open stage bookings", "Community applause", "Live audience energy"],
  },
  {
    title: "Shabd Sangam",
    tag: "Literary discourse",
    description:
      "Thoughtful gatherings that bring together recitations, chhand explorations, and ghazal discussions for cultural exchange.",
    details: ["Recitation circles", "Discussion salons", "Craft criticism & exchange"],
  },
  {
    title: "Sangeet Sangam",
    tag: "Musical gatherings",
    description:
      "Acoustic sessions and collaborative performances that celebrate melody, ambience, and soulful vocal expression.",
    details: ["Acoustic jam collaborations", "Vocal duets", "Curated sonic evenings"],
  },
];

const upcomingEvents = [
  {
    date: "12 Oct",
    title: "Ghazal Craft Lab",
    type: "Workshop",
    venue: "Aligarh Arts Hall",
  },
  {
    date: "19 Oct",
    title: "Open Mic Night",
    type: "Performance",
    venue: "Kah-Kashaan Stage",
  },
  {
    date: "02 Nov",
    title: "Shabd Sangam Forum",
    type: "Discussion",
    venue: "City Cultural Center",
  },
];

const communityStats = [
  { value: "1.2K+", label: "Community members" },
  { value: "28", label: "Curated events" },
  { value: "92%", label: "Return audience" },
  { value: "6 cities", label: "Regional reach" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-brand-text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.18),_transparent_30%),linear-gradient(180deg,#050505_0%,#090909_40%,#040404_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8 rounded-full border border-[#d9af57]/30 bg-[#101010]/80 px-5 py-3 shadow-[0_0_30px_rgba(217,175,87,0.1)] backdrop-blur-xl">
          <nav className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
  <div className="flex h-10 items-center justify-center overflow-hidden rounded-md bg-[#0d0d0d]/60 p-1.5">
    <Image
      src="/kah-kashaan-logo.png"
      alt="Kah-Kashaan Logo"
      width={200}
      height={40}
      className="h-10 w-auto max-w-[300px] object-contain"
      priority
      sizes="(max-width: 768px) 120px, 180px"
    />
  </div>
</div>

            <div className="hidden items-center gap-8 text-sm uppercase tracking-[0.2em] text-[#e7d7aa] md:flex">
              <a href="#home" className="transition hover:text-[#f9e8a0]">Home</a>
              <a href="#about" className="transition hover:text-[#f9e8a0]">About</a>
              <a href="#programs" className="transition hover:text-[#f9e8a0]">Programs</a>
              <a href="#events" className="transition hover:text-[#f9e8a0]">Events</a>
              <a href="#community" className="transition hover:text-[#f9e8a0]">Community</a>
            </div>

            <button className="rounded-full border border-[#d9af57] bg-[#d9af57] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#111111] transition hover:bg-[#f3d98c]">
              Reserve Seat
            </button>
          </nav>
        </header>

        <section id="home" className="grid items-center gap-10 py-8 md:grid-cols-[1.15fr_0.85fr] md:py-14">
          <div>
            <span className="inline-flex items-center gap-3 rounded-full border border-[#d9af57]/40 bg-[#131313]/80 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.35em] text-[#e5c570]">
              Literary culture • community • expression
            </span>

            <h1 className="mt-7 max-w-xl font-[var(--font-display)] text-5xl leading-none text-[#fff5d9] md:text-7xl">
              Where words, music, and meaning gather in one luminous space.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#d8c8a2] md:text-lg">
              Kah-Kashaan is a cultural event platform that brings together mentorship,
              workshops, live literary performances, and music-driven gatherings to nurture
              voices and build a thriving artistic community.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button className="rounded-full border border-[#d9af57] bg-[#d9af57] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#121212] transition hover:bg-[#f2d98b]">
                Explore Events
              </button>
              <button className="rounded-full border border-[#d9af57]/40 bg-[#101010] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f4e1af] transition hover:border-[#f2d98b] hover:text-[#fff7df]">
                Join The Circle
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-4">
              {communityStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#d9af57]/20 bg-[#121212]/70 p-4">
                  <div className="font-[var(--font-display)] text-3xl text-[#f5d99a] md:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#d0b78b]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-[#d9af57]/10 blur-3xl" />
            <div className="absolute -right-6 bottom-10 h-36 w-36 rounded-full bg-[#f3d98b]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-[#d9af57]/35 bg-[linear-gradient(180deg,#101010_0%,#090909_100%)] p-5 shadow-[0_0_40px_rgba(217,175,87,0.14)]">
              <div className="rounded-[1.5rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.2),_transparent_45%),#111111] p-5">
                <div className="flex items-center justify-between text-[#f5d99a]">
                  <span className="text-[10px] uppercase tracking-[0.35em]">Featured</span>
                  <span className="rounded-full border border-[#d9af57]/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
                    Live
                  </span>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-[#d9af57]/20 bg-[#0f0f0f] p-5">
                  <div className="font-[var(--font-display)] text-4xl leading-none text-[#fef7df] md:text-5xl">
                    &ldquo;The Night of Verses&rdquo;
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[#d8c8a2]">
                    <span>Saturday • 7:30 PM</span>
                    <span>Open to all</span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.title}
                      className="flex items-center justify-between rounded-2xl border border-[#d9af57]/15 bg-[#181818] p-3"
                    >
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-[#d2b46a]">{event.date}</div>
                        <div className="mt-1 font-medium text-[#f7ebc1]">{event.title}</div>
                      </div>
                      <div className="text-right text-[10px] uppercase tracking-[0.2em] text-[#cbbd9a]">
                        <div>{event.type}</div>
                        <div className="mt-1">{event.venue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-14">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">About us</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
                A circle for literary growth and cultural belonging.
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-[#d9af57]/15 bg-[#111111] p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">Mission</div>
              <p className="mt-4 text-base leading-7 text-[#d9ceb0]">
                To build a welcoming space where young voices, seasoned artists, and audiences meet through thoughtful learning and shared creative energy.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-[#d9af57]/15 bg-[#111111] p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">Community</div>
              <p className="mt-4 text-base leading-7 text-[#d9ceb0]">
                We celebrate poetry, recitation, music, and discourse in a way that strengthens local culture and keeps tradition alive through modern expression.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-[#d9af57]/15 bg-[#111111] p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#d9af57]">Impact</div>
              <p className="mt-4 text-base leading-7 text-[#d9ceb0]">
                Every event is designed to invite participation, spotlight hidden talent, and create memorable experiences that transform people into a community.
              </p>
            </div>
          </div>
        </section>

        <section id="programs" className="py-14">
          <div className="mb-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Programs & verticals</p>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
              Spaces shaped for discovery, learning, and performance.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {programCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.75rem] border border-[#d9af57]/20 bg-[linear-gradient(180deg,#151515_0%,#0d0d0d_100%)] p-6 transition hover:-translate-y-1 hover:border-[#f1d48d] hover:shadow-[0_0_26px_rgba(217,175,87,0.15)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[#d9af57]">{card.tag}</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d9af57] shadow-[0_0_18px_rgba(217,175,87,0.9)]" />
                </div>

                <h3 className="mt-5 font-[var(--font-display)] text-4xl text-[#f7ebc0]">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#d5c9a9]">{card.description}</p>

                <ul className="mt-5 space-y-3 text-sm text-[#f3dcc0]">
                  {card.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-[#d9af57]" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="events" className="py-14">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-[#d9af57]/20 bg-[#111111] p-7">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Upcoming highlights</p>
              <h2 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
                This season&apos;s most awaited conversations.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#d8c8a2]">
                From intimate masterclasses to community-led stages, each gathering is curated for depth, energy, and meaningful participation.
              </p>

              <div className="mt-7 rounded-[1.5rem] border border-[#d9af57]/15 bg-[#181818] p-5">
                <div className="text-[10px] uppercase tracking-[0.28em] text-[#d9af57]">Next big event</div>
                <div className="mt-3 font-[var(--font-display)] text-3xl text-[#f7ebc0]">Kah-Kashaan Literary Night</div>
                <div className="mt-4 text-sm uppercase tracking-[0.2em] text-[#d2b46a]">26 October • 8:00 PM</div>
              </div>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.title}
                  className="grid gap-4 rounded-[1.75rem] border border-[#d9af57]/20 bg-[#111111] p-5 md:grid-cols-[120px_1fr_auto] md:items-center"
                >
                  <div className="flex h-[100px] flex-col items-center justify-center rounded-2xl border border-[#d9af57]/25 bg-[#171717] text-center">
                    <div className="font-[var(--font-display)] text-3xl text-[#f5d99a]">{event.date.split(" ")[0]}</div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#d8c89f]">{event.date.split(" ")[1]}</div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#d9af57]">{event.type}</div>
                    <h3 className="mt-2 font-[var(--font-display)] text-3xl text-[#f7ebc0]">{event.title}</h3>
                    <p className="mt-2 text-sm text-[#d8c8a2]">{event.venue}</p>
                  </div>

                  <button className="rounded-full border border-[#d9af57]/40 bg-[#0d0d0d] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f0ddab] transition hover:border-[#f2d98b]">
                    RSVP
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="community" className="py-14">
          <div className="rounded-[2rem] border border-[#d9af57]/20 bg-[radial-gradient(circle_at_top,_rgba(217,175,87,0.08),_transparent_35%),#101010] p-8">
            <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#d9af57]">Why join us</p>
                <h2 className="mt-4 font-[var(--font-display)] text-4xl text-[#fff5d9] md:text-5xl">
                  A community of listeners, learners, and storytellers.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#d9ceb0]">
                  Kah-Kashaan is built for artists, audiences, and curious minds who want to stay close to literature, performance, and cultural conversations that matter.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#d9af57]/20 bg-[#171717] p-5">
                  <div className="font-[var(--font-display)] text-4xl text-[#f5d99a]">4.9/5</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#d0b88d]">Audience rating</div>
                </div>
                <div className="rounded-2xl border border-[#d9af57]/20 bg-[#171717] p-5">
                  <div className="font-[var(--font-display)] text-4xl text-[#f5d99a]">18+</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#d0b88d]">Featured artists</div>
                </div>
                <div className="rounded-2xl border border-[#d9af57]/20 bg-[#171717] p-5">
                  <div className="font-[var(--font-display)] text-4xl text-[#f5d99a]">12</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#d0b88d]">Mentor sessions</div>
                </div>
                <div className="rounded-2xl border border-[#d9af57]/20 bg-[#171717] p-5">
                  <div className="font-[var(--font-display)] text-4xl text-[#f5d99a]">24/7</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#d0b88d]">Creative support</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
