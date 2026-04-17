import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { getInvoiceById } from "@/lib/invoices";
import { connectToDatabase } from "@/lib/mongodb";

type InvoicePageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoiceDetailPage({ params }: InvoicePageProps) {
  await connectToDatabase();
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f1e8_0%,#efe6d9_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Printable invoice
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/invoices"
              className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm text-ink-soft transition hover:bg-white"
            >
              Back to invoices
            </Link>
            <PrintButton />
          </div>
        </div>

        <section className="card-shadow rounded-[32px] border border-border bg-white/85 p-6 print:shadow-none">
          <div className="rounded-[28px] border border-[rgba(67,56,51,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,241,232,0.94))] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Gee Project invoice
                </p>
                <h1 className="mt-3 font-serif text-4xl text-ink-soft">
                  {invoice.invoiceNumber}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted">
                  This is the current printable invoice layout. Once you share your
                  preferred branding details, we can upgrade the design and final formatting.
                </p>
              </div>

              <div className="min-w-[240px] rounded-[24px] border border-border bg-white/80 px-5 py-4">
                <p className="text-sm text-muted">Issue date</p>
                <p className="font-semibold text-ink-soft">{formatDate(invoice.issueDate)}</p>
                <p className="mt-3 text-sm text-muted">Due date</p>
                <p className="font-semibold text-ink-soft">{formatDate(invoice.dueDate)}</p>
                <p className="mt-3 text-sm text-muted">Total</p>
                <p className="font-serif text-4xl text-ink-soft">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] border border-border bg-white/80 px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Bill to
                </p>
                <p className="mt-3 font-serif text-3xl text-ink-soft">
                  {invoice.client?.companyName || invoice.client?.name || "Unknown client"}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {invoice.client?.email || "No email on file"}
                </p>
                <p className="text-sm text-muted">
                  {invoice.client?.phone || "No phone on file"}
                </p>
              </div>

              <div className="rounded-[24px] border border-border bg-[rgba(255,250,244,0.8)] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Payment summary
                </p>
                <div className="mt-4 space-y-2 text-sm text-ink-soft">
                  <p>Status: {invoice.status}</p>
                  <p>Jobs billed: {invoice.jobs.length}</p>
                  <p>Amount due: {formatCurrency(invoice.totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-[24px] border border-border">
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4 bg-[rgba(67,56,51,0.04)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                <span>Apartment</span>
                <span>Cleaning date</span>
                <span>Amount</span>
              </div>
              {invoice.jobs.map((job) => (
                <div
                  key={job._id}
                  className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4 border-t border-border px-4 py-4 text-sm text-ink-soft first:border-t-0"
                >
                  <div>
                    <p className="font-semibold">{job.apartmentName}</p>
                    <p className="text-xs text-muted">{job.apartmentAddress || "No address yet"}</p>
                  </div>
                  <div>{formatDate(job.cleaningDate)}</div>
                  <div>{formatCurrency(job.amountCharged)}</div>
                </div>
              ))}
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4 border-t border-border bg-[rgba(255,250,244,0.72)] px-4 py-4 text-sm font-semibold text-ink-soft">
                <span>Total</span>
                <span />
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>

            {invoice.notes ? (
              <div className="mt-6 rounded-2xl border border-border bg-white/80 px-4 py-4 text-sm leading-6 text-muted">
                {invoice.notes}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
