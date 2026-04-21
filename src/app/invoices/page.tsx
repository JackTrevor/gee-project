import Link from "next/link";

import { createInvoice } from "@/app/actions";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceNav } from "@/components/workspace-nav";
import { formatCurrency, formatDate, formatDateForInput } from "@/lib/format";
import { getInvoicesPageData } from "@/lib/invoices";
import { connectToDatabase } from "@/lib/mongodb";

async function getInvoicesWorkspaceData() {
  await connectToDatabase();
  return getInvoicesPageData();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default async function InvoicesPage() {
  const { candidates, invoices } = await getInvoicesWorkspaceData();
  const totalOpenInvoices = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <WorkspaceNav currentPath="/invoices" />
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                    Client invoices
                  </div>
                  <LogoutButton />
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  Invoice clients from completed apartment work.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  This workspace groups billable jobs by client, creates printable invoices,
                  and keeps job payment status in sync once an invoice is issued.
                </p>
              </div>

            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Clients ready to invoice",
                  value: candidates.length.toString(),
                },
                {
                  label: "Open invoice value",
                  value: formatCurrency(totalOpenInvoices),
                },
                {
                  label: "Invoices created",
                  value: invoices.length.toString(),
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
                  Ready to invoice
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Billable client work
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-sm text-accent-strong">
                {candidates.length} client{candidates.length === 1 ? "" : "s"}
              </div>
            </div>

            {candidates.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                No client invoices waiting right now. Jobs with client payment status
                still pending will appear here when they are ready to bill.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {candidates.map((candidate, index) => (
                  <article
                    key={candidate.client._id}
                    className="rounded-[24px] border border-border bg-white/70 p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="font-serif text-2xl text-ink-soft">
                          {candidate.client.companyName || candidate.client.name}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {candidate.jobs.length} billable job
                          {candidate.jobs.length === 1 ? "" : "s"}
                          {" · "}
                          Total invoice {formatCurrency(candidate.totalDue)}
                        </p>
                      </div>
                      <div className="rounded-full bg-[rgba(54,94,129,0.10)] px-3 py-1 text-sm text-[#375d81]">
                        Invoice now
                      </div>
                    </div>

                    <form action={createInvoice} className="mt-5 space-y-4">
                      <input type="hidden" name="clientId" value={candidate.client._id} />
                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          name="invoiceNumber"
                          defaultValue={`INV-${String(invoices.length + index + 1).padStart(4, "0")}`}
                          placeholder="Invoice number"
                          className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                          required
                        />
                        <input
                          name="issueDate"
                          type="date"
                          defaultValue={formatDateForInput(new Date())}
                          className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                          required
                        />
                        <input
                          name="dueDate"
                          type="date"
                          defaultValue={formatDateForInput(addDays(new Date(), 14))}
                          className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                          required
                        />
                      </div>

                      <textarea
                        name="notes"
                        rows={3}
                        placeholder="Optional invoice notes, payment instructions, or reminders"
                        className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                      />

                      <div className="rounded-[24px] border border-border bg-[rgba(255,250,244,0.7)] p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                          Jobs included in this invoice
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
                                    {formatCurrency(job.amountCharged)}
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

                      <button className="rounded-full bg-[#375d81] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b4a66]">
                        Create invoice and open printable view
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
                  Invoice history
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Recent invoices
                </h2>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                No invoices created yet. The first invoice you issue will appear here
                with a printable detail page.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="rounded-[24px] border border-border bg-white/70 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink-soft">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted">
                          {invoice.client?.companyName || invoice.client?.name || "Unknown client"}
                          {" · "}
                          {formatDate(invoice.issueDate)}
                        </p>
                        <p className="text-sm text-muted">
                          Due {formatDate(invoice.dueDate)}
                          {" · "}
                          {invoice.jobs.length} job{invoice.jobs.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-ink-soft">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <Link
                          href={`/invoices/${invoice._id}`}
                          className="mt-2 inline-flex rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-sm text-accent-strong transition hover:bg-[rgba(201,111,59,0.18)]"
                        >
                          Open printable invoice
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
