import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";

const statusClassNames: Record<string, string> = {
  scheduled: "bg-[rgba(54,94,129,0.10)] text-[#375d81]",
  completed: "bg-[rgba(34,94,67,0.10)] text-[#215940]",
  cancelled: "bg-[rgba(137,48,48,0.10)] text-[#8a2f2f]",
  pending: "bg-[rgba(201,111,59,0.12)] text-accent-strong",
  invoiced: "bg-[rgba(90,52,110,0.08)] text-[#5a346e]",
  paid: "bg-[rgba(34,94,67,0.10)] text-[#215940]",
};

function Pill({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        statusClassNames[value] ?? "bg-[rgba(67,56,51,0.08)] text-ink-soft"
      }`}
    >
      {value}
    </span>
  );
}

export default async function Home() {
  await connectToDatabase();
  const { clients, cleaners, jobs, totals } = await getDashboardData();

  const activeCleaners = cleaners.filter((cleaner) => cleaner.active).length;
  const recentJobs = jobs.slice(0, 5);
  const topClients = [...jobs]
    .reduce<Map<string, { name: string; revenue: number; jobs: number }>>((map, job) => {
      const key = job.clientId?._id ?? "unknown";
      const name = job.clientId?.companyName || job.clientId?.name || "Unknown client";
      const current = map.get(key) ?? { name, revenue: 0, jobs: 0 };

      current.revenue += job.amountCharged;
      current.jobs += 1;
      map.set(key, current);

      return map;
    }, new Map())
    .values();

  const rankedClients = Array.from(topClients)
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 4);

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                  Gee Project dashboard
                </div>
                <LogoutButton />
              </div>
              <div className="space-y-3">
                <p className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  A cleaner, calmer way to run apartment cleaning jobs.
                </p>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  The dashboard now reflects your real MongoDB data. As you add
                  clients, cleaners, and apartment jobs, these totals and lists
                  update with the business activity you are actually tracking.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/jobs"
                  className="rounded-full bg-[rgba(201,111,59,0.12)] px-4 py-2 text-accent-strong transition hover:bg-[rgba(201,111,59,0.18)]"
                >
                  Open jobs workspace
                </Link>
                <Link
                  href="/payments"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Open payments
                </Link>
                <Link
                  href="/invoices"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Open invoices
                </Link>
                <Link
                  href="/users"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Manage users
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(94,82,64,0.14)] bg-surface-strong p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                Business snapshot
              </p>
              <div className="mt-4 space-y-3">
                {[
                  `${clients.length} clients on file`,
                  `${activeCleaners} active cleaners available`,
                  `${jobs.length} total jobs recorded`,
                  `${formatCurrency(totals.outstandingCleanerBalance)} still owed to cleaners`,
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm leading-6 text-ink-soft"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Revenue",
              value: formatCurrency(totals.revenue),
              note: `${jobs.length} jobs created so far`,
            },
            {
              label: "Cleaner Payouts",
              value: formatCurrency(totals.payouts),
              note: `${formatCurrency(totals.outstandingCleanerBalance)} still unpaid`,
            },
            {
              label: "Net Profit",
              value: formatCurrency(totals.profit),
              note:
                totals.revenue > 0
                  ? `${Math.round((totals.profit / totals.revenue) * 100)}% gross margin`
                  : "No revenue yet",
            },
            {
              label: "Outstanding Client Balance",
              value: formatCurrency(totals.outstandingClientBalance),
              note: "Open receivables from clients",
            },
          ].map((metric) => (
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
                  Live queue from MongoDB
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-sm text-accent-strong">
                {jobs.length} total
              </div>
            </div>

            {recentJobs.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                No jobs yet. Open the jobs workspace and add your first client,
                cleaner, and apartment job.
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[24px] border border-border">
                <div className="hidden grid-cols-[1.35fr_1fr_1fr_0.8fr_0.8fr_1fr] gap-4 bg-[rgba(67,56,51,0.04)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted md:grid">
                  <span>Apartment</span>
                  <span>Client</span>
                  <span>Cleaner</span>
                  <span>Charged</span>
                  <span>Date</span>
                  <span>Status</span>
                </div>

                {recentJobs.map((job) => (
                  <div
                    key={job._id}
                    className="grid gap-3 border-t border-border px-4 py-4 text-sm first:border-t-0 md:grid-cols-[1.35fr_1fr_1fr_0.8fr_0.8fr_1fr] md:items-center md:gap-4"
                  >
                    <div>
                      <p className="font-semibold text-ink-soft">{job.apartmentName}</p>
                      <p className="text-xs text-muted">{job.apartmentAddress || "No address yet"}</p>
                    </div>
                    <div>{job.clientId?.companyName || job.clientId?.name || "Unknown client"}</div>
                    <div>{job.cleanerId?.name || "Unknown cleaner"}</div>
                    <div>{formatCurrency(job.amountCharged)}</div>
                    <div>{formatDate(job.cleaningDate)}</div>
                    <div>
                      <Pill value={job.jobStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <div className="grid gap-6">
            <article className="card-shadow rounded-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,250,244,0.96),rgba(247,241,232,0.92))] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                Top clients
              </p>
              <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                Who brings the most work?
              </h2>

              {rankedClients.length === 0 ? (
                <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/60 px-5 py-6 text-sm leading-7 text-muted">
                  Client rankings will appear once you start recording jobs.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {rankedClients.map((client) => (
                    <div
                      key={client.name}
                      className="rounded-2xl border border-border bg-white/70 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-ink-soft">{client.name}</p>
                          <p className="text-sm text-muted">{client.jobs} jobs recorded</p>
                        </div>
                        <p className="font-semibold text-ink-soft">
                          {formatCurrency(client.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                Next build
              </p>
              <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                Good next features
              </h2>
              <div className="mt-6 space-y-3">
                {[
                  "Edit and delete clients, cleaners, and jobs",
                  "Create invoices from completed jobs",
                  "Monthly charts and cleaner performance reporting",
                  "QuickBooks customer, vendor, and invoice sync later",
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
          </div>
        </section>
      </div>
    </main>
  );
}
