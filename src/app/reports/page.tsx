import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { formatCurrency, formatDateForInput } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";
import { getReportsData } from "@/lib/reports";

type ReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

function parseDateInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function getReportsPageData(searchParams: Awaited<ReportsPageProps["searchParams"]>) {
  await connectToDatabase();
  return getReportsData({
    from: parseDateInput(searchParams.from),
    to: parseDateInput(searchParams.to),
  });
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-ink-soft">{value}</p>
    </div>
  );
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const {
    totals,
    dateRange,
    counts,
    monthly,
    maxMonthlyRevenue,
    topClients,
    topCleaners,
    receivables,
    payables,
    statusMix,
  } = await getReportsPageData(params);

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                    Business reports
                  </div>
                  <LogoutButton />
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  Revenue, payouts, profit, and balance reports in one page.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  This page turns your live MongoDB data into the first true reporting layer
                  for Gee Project. It gives you a monthly business view, top performers, and
                  the open balances still waiting to be collected or paid.
                </p>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                  Showing {formatDateForInput(dateRange.from)} to {formatDateForInput(dateRange.to)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Overview
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Jobs
                </Link>
                <Link
                  href="/payments"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Payments
                </Link>
                <Link
                  href="/invoices"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Invoices
                </Link>
              </div>
            </div>

            <form className="grid gap-3 rounded-[28px] border border-border bg-white/60 p-4 md:grid-cols-[1fr_1fr_auto_auto]">
              <input
                name="from"
                type="date"
                defaultValue={formatDateForInput(dateRange.from)}
                className="w-full rounded-2xl border border-border bg-white/90 px-4 py-3 outline-none transition focus:border-accent"
              />
              <input
                name="to"
                type="date"
                defaultValue={formatDateForInput(dateRange.to)}
                className="w-full rounded-2xl border border-border bg-white/90 px-4 py-3 outline-none transition focus:border-accent"
              />
              <button className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                Apply filters
              </button>
              <Link
                href="/reports"
                className="rounded-full border border-border bg-white px-5 py-3 text-center text-sm font-semibold text-ink-soft transition hover:bg-[rgba(255,255,255,0.75)]"
              >
                Reset
              </Link>
            </form>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Revenue", value: formatCurrency(totals.revenue) },
                { label: "Cleaner payouts", value: formatCurrency(totals.payouts) },
                { label: "Net profit", value: formatCurrency(totals.profit) },
                {
                  label: "Client balances open",
                  value: formatCurrency(totals.outstandingClientBalance),
                },
                {
                  label: "Cleaner balances open",
                  value: formatCurrency(totals.outstandingCleanerBalance),
                },
              ].map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[26px] border border-border bg-white/70 p-5"
                >
                  <p className="text-sm uppercase tracking-[0.18em] text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-4 font-serif text-3xl text-ink-soft">{metric.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Monthly trend</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Last 6 months of activity
            </h2>
            <div className="mt-6 space-y-4">
              {monthly.map((month) => {
                const revenueWidth = `${Math.max((month.revenue / maxMonthlyRevenue) * 100, 6)}%`;
                return (
                  <div key={month.label} className="rounded-[24px] border border-border bg-white/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink-soft">{month.label}</p>
                        <p className="text-sm text-muted">{month.jobs} job{month.jobs === 1 ? "" : "s"}</p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-accent-strong">
                          Revenue {formatCurrency(month.revenue)}
                        </span>
                        <span className="rounded-full bg-[rgba(54,94,129,0.10)] px-3 py-1 text-[#375d81]">
                          Payouts {formatCurrency(month.payouts)}
                        </span>
                        <span className="rounded-full bg-[rgba(34,94,67,0.10)] px-3 py-1 text-[#215940]">
                          Profit {formatCurrency(month.profit)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-[rgba(67,56,51,0.08)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#c96f3b_0%,#e1ad5f_100%)]"
                        style={{ width: revenueWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Quick stats</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Operating mix
            </h2>
            <div className="mt-6 grid gap-3">
              <StatusPill label="Clients" value={counts.clients} />
              <StatusPill label="Cleaners" value={counts.cleaners} />
              <StatusPill label="Jobs" value={counts.jobs} />
              <StatusPill label="All jobs on file" value={counts.allJobs} />
              <StatusPill
                label="Scheduled jobs"
                value={statusMix.jobStatuses.scheduled ?? 0}
              />
              <StatusPill
                label="Completed jobs"
                value={statusMix.jobStatuses.completed ?? 0}
              />
              <StatusPill
                label="Client invoices open"
                value={(statusMix.clientPaymentStatuses.pending ?? 0) + (statusMix.clientPaymentStatuses.invoiced ?? 0)}
              />
              <StatusPill
                label="Cleaner payouts open"
                value={statusMix.cleanerPaymentStatuses.pending ?? 0}
              />
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="card-shadow rounded-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,250,244,0.96),rgba(247,241,232,0.92))] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Top clients</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Who brings the most revenue?
            </h2>
            <div className="mt-6 space-y-3">
              {topClients.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-white/60 px-5 py-6 text-sm leading-7 text-muted">
                  Client rankings will appear once you start recording jobs.
                </div>
              ) : (
                topClients.map((client) => (
                  <div
                    key={client.id}
                    className="rounded-2xl border border-border bg-white/75 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink-soft">{client.name}</p>
                        <p className="text-sm text-muted">{client.jobs} jobs</p>
                      </div>
                      <p className="font-semibold text-ink-soft">{formatCurrency(client.value)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Top cleaners</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Who receives the most payout work?
            </h2>
            <div className="mt-6 space-y-3">
              {topCleaners.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-white/60 px-5 py-6 text-sm leading-7 text-muted">
                  Cleaner rankings will appear once you start recording jobs.
                </div>
              ) : (
                topCleaners.map((cleaner) => (
                  <div
                    key={cleaner.id}
                    className="rounded-2xl border border-border bg-white/75 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink-soft">{cleaner.name}</p>
                        <p className="text-sm text-muted">{cleaner.jobs} jobs</p>
                      </div>
                      <p className="font-semibold text-ink-soft">{formatCurrency(cleaner.value)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Open receivables</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Clients who still owe money
            </h2>
            <div className="mt-6 space-y-3">
              {receivables.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-white/60 px-5 py-6 text-sm leading-7 text-muted">
                  No outstanding client balances right now.
                </div>
              ) : (
                receivables.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-white/75 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink-soft">{item.name}</p>
                        <p className="text-sm text-muted">{item.jobs} open job{item.jobs === 1 ? "" : "s"}</p>
                      </div>
                      <p className="font-semibold text-ink-soft">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Open payables</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Cleaners who are still owed money
            </h2>
            <div className="mt-6 space-y-3">
              {payables.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-white/60 px-5 py-6 text-sm leading-7 text-muted">
                  No outstanding cleaner balances right now.
                </div>
              ) : (
                payables.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-white/75 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-ink-soft">{item.name}</p>
                        <p className="text-sm text-muted">{item.jobs} unpaid job{item.jobs === 1 ? "" : "s"}</p>
                      </div>
                      <p className="font-semibold text-ink-soft">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
