import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { formatCurrency, formatDateForInput } from "@/lib/format";
import { getInvoiceById } from "@/lib/invoices";
import { connectToDatabase } from "@/lib/mongodb";

type InvoicePageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

const COMPANY_NAME = "L&G FLOORING AND CLEANING";
const COMPANY_EMAIL = "geefonseca@outlook.com";
const COMPANY_PHONE = "650-678-4442";
const COMPANY_ADDRESS = "2212 Seneca ridge drive   Myrtle Beach  SC";

function InvoiceMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 text-sm">
      <span className="font-semibold text-[#6e7a73]">{label}</span>
      <span className="text-[#143326]">{value}</span>
    </div>
  );
}

export default async function InvoiceDetailPage({ params }: InvoicePageProps) {
  await connectToDatabase();
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  const subtotal = invoice.jobs.reduce((sum, job) => sum + job.amountCharged, 0);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f7f2_0%,#e7f0e8_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-10 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="inline-flex items-center rounded-full border border-[rgba(20,82,56,0.14)] bg-[rgba(255,255,255,0.74)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Printable invoice
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/invoices"
              className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm text-ink-soft transition hover:bg-white"
            >
              Back to invoices
            </Link>
            <PrintButton />
          </div>
        </div>

        <section className="card-shadow rounded-[32px] border border-border bg-white/92 p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <div className="rounded-[28px] border border-[rgba(20,82,56,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,250,246,0.96))] p-6 print:rounded-none print:border-0 print:bg-white print:p-0">
            <div className="flex flex-col gap-6 border-b border-[rgba(20,82,56,0.14)] pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[420px]">
                <h1 className="text-[28px] font-semibold leading-tight text-[#143326]">
                  {COMPANY_NAME}
                </h1>
                <div className="mt-4 space-y-2">
                  <InvoiceMetaRow label="Email:" value={COMPANY_EMAIL} />
                  <InvoiceMetaRow label="Phone:" value={COMPANY_PHONE} />
                  <InvoiceMetaRow label="Address:" value={COMPANY_ADDRESS} />
                </div>
              </div>

              <div className="min-w-[280px] rounded-[24px] border border-[rgba(20,82,56,0.14)] bg-[rgba(243,248,244,0.82)] px-5 py-4">
                <div className="space-y-2">
                  <InvoiceMetaRow label="Invoice No." value={invoice.invoiceNumber} />
                  <InvoiceMetaRow label="Date:" value={formatDateForInput(invoice.issueDate)} />
                  <InvoiceMetaRow label="Due Date:" value={formatDateForInput(invoice.dueDate)} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 border-b border-[rgba(20,82,56,0.14)] pb-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6e7a73]">
                  Bill To
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-2xl font-semibold text-[#143326]">
                    {invoice.client?.companyName || invoice.client?.name || "Unknown client"}
                  </p>
                  <InvoiceMetaRow
                    label="Email:"
                    value={invoice.client?.email || "No email on file"}
                  />
                  <InvoiceMetaRow
                    label="Phone:"
                    value={invoice.client?.phone || "No phone on file"}
                  />
                  <InvoiceMetaRow label="Address:" value="Address not yet stored in Gee Project" />
                </div>
              </div>

              <div className="rounded-[24px] border border-[rgba(20,82,56,0.14)] bg-[rgba(243,248,244,0.82)] px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6e7a73]">
                  Invoice Summary
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#6e7a73]">Status</span>
                    <span className="font-semibold capitalize text-[#143326]">{invoice.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#6e7a73]">Jobs billed</span>
                    <span className="font-semibold text-[#143326]">{invoice.jobs.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#6e7a73]">Balance due</span>
                    <span className="font-semibold text-[#143326]">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-[rgba(20,82,56,0.16)]">
              <div className="grid grid-cols-[1.8fr_0.8fr_0.65fr_0.7fr_0.55fr_0.8fr] gap-4 bg-[rgba(31,122,82,0.08)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f6f66]">
                <span>Description</span>
                <span>Price</span>
                <span>Qty</span>
                <span>Discount</span>
                <span>Tax</span>
                <span>Amount</span>
              </div>

              {invoice.jobs.map((job) => (
                <div
                  key={job._id}
                  className="grid grid-cols-[1.8fr_0.8fr_0.65fr_0.7fr_0.55fr_0.8fr] gap-4 border-t border-[rgba(20,82,56,0.12)] px-4 py-4 text-sm text-[#143326] first:border-t-0"
                >
                  <div>
                    <p className="font-semibold">
                      {formatDateForInput(job.cleaningDate).slice(5)}
                      {"  "}
                      {job.apartmentName}
                    </p>
                    <p className="mt-1 text-xs text-[#6e7a73]">
                      {job.apartmentAddress || "No address yet"}
                    </p>
                  </div>
                  <div>{formatCurrency(job.amountCharged)}</div>
                  <div>1</div>
                  <div>0.00</div>
                  <div>0%</div>
                  <div>{formatCurrency(job.amountCharged)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 ml-auto flex w-full max-w-[340px] flex-col gap-3">
              <div className="flex items-center justify-between gap-4 border-b border-[rgba(20,82,56,0.14)] pb-2 text-sm">
                <span className="font-semibold text-[#6e7a73]">Subtotal</span>
                <span className="font-semibold text-[#143326]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[rgba(20,82,56,0.14)] pb-2 text-sm">
                <span className="font-semibold text-[#6e7a73]">Total</span>
                <span className="font-semibold text-[#143326]">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-[18px] bg-[rgba(31,122,82,0.10)] px-4 py-3 text-sm">
                <span className="font-semibold text-[#145238]">Balance Due</span>
                <span className="text-lg font-semibold text-[#145238]">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>

            {invoice.notes ? (
              <div className="mt-6 rounded-[20px] border border-[rgba(20,82,56,0.14)] bg-[rgba(243,248,244,0.72)] px-4 py-4 text-sm leading-6 text-[#5f6f66]">
                {invoice.notes}
              </div>
            ) : null}

            <div className="mt-8 border-t border-[rgba(20,82,56,0.14)] pt-4 text-xs leading-6 text-[#6e7a73]">
              <p>Thank you for your business.</p>
              <p>This invoice template is shaped from your current company example and filled with Gee Project invoice data.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
