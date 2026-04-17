import Link from "next/link";

import { createCleanerPayment } from "@/app/actions";
import { LogoutButton } from "@/components/logout-button";
import { formatCurrency, formatDate, formatDateForInput } from "@/lib/format";
import { getPaymentsPageData } from "@/lib/payments";
import { connectToDatabase } from "@/lib/mongodb";

async function getPaymentsWorkspaceData() {
  await connectToDatabase();
  return getPaymentsPageData();
}

export default async function PaymentsPage() {
  const { paymentCandidates, payments } = await getPaymentsWorkspaceData();
  const totalPendingPayouts = paymentCandidates.reduce(
    (sum, candidate) => sum + candidate.totalDue,
    0,
  );

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                    Cleaner payments
                  </div>
                  <LogoutButton />
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  Pay cleaners and print checks from one place.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  This workspace groups unpaid cleaning jobs by cleaner, lets you
                  issue a payment, and generates a printable check layout you can
                  use now with placeholder stock until you share the real template.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/jobs"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Back to jobs
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Overview
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Cleaners waiting for payment",
                  value: paymentCandidates.length.toString(),
                },
                {
                  label: "Pending cleaner payouts",
                  value: formatCurrency(totalPendingPayouts),
                },
                {
                  label: "Checks already created",
                  value: payments.length.toString(),
                },
              ].map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[26px] border border-border bg-white/70 p-5"
                >
                  <p className="text-sm uppercase tracking-[0.18em] text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-4 font-serif text-3xl text-ink-soft">
                    {metric.value}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  Ready to pay
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Unpaid cleaner work
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-sm text-accent-strong">
                {paymentCandidates.length} cleaner
                {paymentCandidates.length === 1 ? "" : "s"}
              </div>
            </div>

            {paymentCandidates.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                No pending cleaner payouts right now. As soon as jobs are saved with
                cleaner payment status still pending, they will appear here.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {paymentCandidates.map((candidate, index) => (
                  <article
                    key={candidate.cleaner._id}
                    className="rounded-[24px] border border-border bg-white/70 p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="font-serif text-2xl text-ink-soft">
                          {candidate.cleaner.name}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {candidate.jobs.length} unpaid job
                          {candidate.jobs.length === 1 ? "" : "s"}
                          {" · "}
                          Total due {formatCurrency(candidate.totalDue)}
                        </p>
                      </div>
                      <div className="rounded-full bg-[rgba(34,94,67,0.10)] px-3 py-1 text-sm text-[#215940]">
                        Pay now
                      </div>
                    </div>

                    <form action={createCleanerPayment} className="mt-5 space-y-4">
                      <input type="hidden" name="cleanerId" value={candidate.cleaner._id} />
                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          name="checkNumber"
                          defaultValue={`CHK-${String(payments.length + index + 1).padStart(4, "0")}`}
                          placeholder="Check number"
                          className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                          required
                        />
                        <input
                          name="paymentDate"
                          type="date"
                          defaultValue={formatDateForInput(new Date())}
                          className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                          required
                        />
                        <input
                          value={formatCurrency(candidate.totalDue)}
                          readOnly
                          aria-label="Total payment amount"
                          className="w-full rounded-2xl border border-border bg-[rgba(255,250,244,0.9)] px-4 py-3 text-ink-soft outline-none"
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          name="memo"
                          defaultValue="Apartment cleaning payout"
                          placeholder="Memo"
                          className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                        />
                        <input
                          name="notes"
                          placeholder="Optional notes for this check run"
                          className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                        />
                      </div>

                      <div className="rounded-[24px] border border-border bg-[rgba(255,250,244,0.7)] p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                          Jobs included in this payment
                        </p>
                        <div className="mt-4 space-y-3">
                          {candidate.jobs.map((job) => (
                            <label
                              key={job._id}
                              className="flex gap-3 rounded-2xl border border-border bg-white/80 px-4 py-4"
                            >
                              <input type="checkbox" name="jobIds" value={job._id} defaultChecked />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="font-semibold text-ink-soft">{job.apartmentName}</p>
                                  <p className="font-semibold text-ink-soft">
                                    {formatCurrency(job.cleanerPayout)}
                                  </p>
                                </div>
                                <p className="text-sm text-muted">
                                  {job.apartmentAddress || "No address yet"}
                                </p>
                                <p className="text-sm text-muted">
                                  Cleaning date {formatDate(job.cleaningDate)}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button className="rounded-full bg-[#215940] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#184330]">
                        Create payment and open printable check
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  Payment history
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Recent checks
                </h2>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                No checks created yet. The first payment you issue will show up here
                with a print-ready detail page.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="rounded-[24px] border border-border bg-white/70 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink-soft">
                          Check {payment.checkNumber}
                        </p>
                        <p className="text-sm text-muted">
                          {payment.cleaner?.name || "Unknown cleaner"}
                          {" · "}
                          {formatDate(payment.paymentDate)}
                        </p>
                        <p className="text-sm text-muted">
                          {payment.jobs.length} job
                          {payment.jobs.length === 1 ? "" : "s"} included
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-ink-soft">
                          {formatCurrency(payment.totalAmount)}
                        </p>
                        <Link
                          href={`/payments/${payment._id}`}
                          className="mt-2 inline-flex rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-sm text-accent-strong transition hover:bg-[rgba(201,111,59,0.18)]"
                        >
                          Open printable check
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
