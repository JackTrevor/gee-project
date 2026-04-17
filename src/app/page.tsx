import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

const metrics = [
  { label: "Monthly Revenue", value: "$8,640", note: "32 jobs billed this month" },
  { label: "Cleaner Payouts", value: "$5,970", note: "9 active cleaners" },
  { label: "Net Profit", value: "$2,670", note: "31% margin across active work" },
  { label: "Open Invoices", value: "$1,420", note: "6 invoices still unpaid" },
];

const recentJobs = [
  {
    apartment: "Palm Breeze 12B",
    client: "Sunset Stays",
    cleaner: "Maria",
    charged: "$180",
    payout: "$120",
    status: "Ready to invoice",
  },
  {
    apartment: "Harbor Loft 4A",
    client: "Coastal Homes",
    cleaner: "Andressa",
    charged: "$125",
    payout: "$85",
    status: "Paid",
  },
  {
    apartment: "Ocean View 9C",
    client: "BlueKey Rentals",
    cleaner: "Paula",
    charged: "$210",
    payout: "$150",
    status: "Cleaning scheduled",
  },
];

const priorities = [
  "Create the MongoDB connection and first collections",
  "Build Jobs, Clients, and Cleaners CRUD screens",
  "Add invoice generation and printable client billing",
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                  Gee Project v1
                </div>
                <LogoutButton />
              </div>
              <div className="space-y-3">
                <p className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  A cleaner, calmer way to run apartment cleaning jobs.
                </p>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  Track every apartment, see who cleaned it, measure profit per
                  job, and stay on top of invoicing without juggling notes and
                  spreadsheets.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/jobs"
                  className="rounded-full bg-[rgba(201,111,59,0.12)] px-4 py-2 text-accent-strong transition hover:bg-[rgba(201,111,59,0.18)]"
                >
                  Jobs
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full bg-[rgba(54,94,129,0.10)] px-4 py-2 text-[#375d81] transition hover:bg-[rgba(54,94,129,0.16)]"
                >
                  Cleaners
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full bg-[rgba(34,94,67,0.10)] px-4 py-2 text-[#215940] transition hover:bg-[rgba(34,94,67,0.16)]"
                >
                  Clients
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full bg-[rgba(90,52,110,0.08)] px-4 py-2 text-[#5a346e] transition hover:bg-[rgba(90,52,110,0.14)]"
                >
                  Invoices
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(94,82,64,0.14)] bg-surface-strong p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                What v1 includes
              </p>
              <div className="mt-4 space-y-3">
                {priorities.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm leading-6 text-ink-soft"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/jobs"
                className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Open jobs workspace
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="card-shadow rounded-[28px] border border-border bg-surface p-5 backdrop-blur"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                {metric.label}
              </p>
              <p className="mt-4 font-serif text-4xl text-ink-soft">
                {metric.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">{metric.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  Recent jobs
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Snapshot of the work queue
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-sm text-accent-strong">
                Demo data
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-border">
              <div className="hidden grid-cols-[1.35fr_1fr_1fr_0.8fr_0.8fr_1fr] gap-4 bg-[rgba(67,56,51,0.04)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted md:grid">
                <span>Apartment</span>
                <span>Client</span>
                <span>Cleaner</span>
                <span>Charged</span>
                <span>Payout</span>
                <span>Status</span>
              </div>

              {recentJobs.map((job) => (
                <div
                  key={job.apartment}
                  className="grid gap-3 border-t border-border px-4 py-4 text-sm first:border-t-0 md:grid-cols-[1.35fr_1fr_1fr_0.8fr_0.8fr_1fr] md:items-center md:gap-4"
                >
                  <div>
                    <p className="font-semibold text-ink-soft">{job.apartment}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted md:hidden">
                      Apartment
                    </p>
                  </div>
                  <div>{job.client}</div>
                  <div>{job.cleaner}</div>
                  <div>{job.charged}</div>
                  <div>{job.payout}</div>
                  <div>
                    <span className="inline-flex rounded-full bg-[rgba(54,94,129,0.10)] px-3 py-1 text-xs font-semibold text-[#375d81]">
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card-shadow rounded-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,250,244,0.96),rgba(247,241,232,0.92))] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Data foundation
            </p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              MongoDB-ready from day one
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              The project now includes starter models for clients, cleaners,
              jobs, and invoices, plus a reusable MongoDB connection helper for
              the next CRUD step.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Client records with contact details",
                "Cleaner profiles and payment totals",
                "Job records with revenue and payout fields",
                "Invoices linked back to one or more jobs",
                "QuickBooks-ready external IDs for future sync",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-ink-soft"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
