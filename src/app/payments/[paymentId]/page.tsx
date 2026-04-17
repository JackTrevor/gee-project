import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";
import { getCleanerPaymentById } from "@/lib/payments";

type PaymentPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export default async function CleanerPaymentDetailPage({ params }: PaymentPageProps) {
  await connectToDatabase();
  const { paymentId } = await params;
  const payment = await getCleanerPaymentById(paymentId);

  if (!payment) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f1e8_0%,#efe6d9_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Printable check
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/payments"
              className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm text-ink-soft transition hover:bg-white"
            >
              Back to payments
            </Link>
            <PrintButton />
          </div>
        </div>

        <section className="card-shadow rounded-[32px] border border-border bg-white/85 p-6 print:shadow-none">
          <div className="rounded-[28px] border border-[rgba(67,56,51,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,241,232,0.94))] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Placeholder check stock
                </p>
                <h1 className="mt-3 font-serif text-3xl text-ink-soft">
                  Gee Project Cleaning
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  This is the temporary printable check layout. Once you share the
                  real check template, we can align the fields to the exact print
                  positions.
                </p>
              </div>
              <div className="rounded-[24px] border border-border bg-white/80 px-5 py-4 text-sm text-ink-soft">
                <p>Check No. {payment.checkNumber}</p>
                <p className="mt-1">Date {formatDate(payment.paymentDate)}</p>
                <p className="mt-1 font-semibold">{formatCurrency(payment.totalAmount)}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-[rgba(67,56,51,0.14)] bg-white/80 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Pay to the order of
                  </p>
                  <p className="font-serif text-3xl text-ink-soft">
                    {payment.cleaner?.name || "Unknown cleaner"}
                  </p>
                  <p className="text-sm text-muted">
                    {payment.cleaner?.email || "No email on file"}
                  </p>
                </div>
                <div className="min-w-[220px] rounded-[24px] bg-[rgba(201,111,59,0.12)] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Amount
                  </p>
                  <p className="mt-3 font-serif text-4xl text-ink-soft">
                    {formatCurrency(payment.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.75fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Memo
                  </p>
                  <div className="mt-2 rounded-2xl border border-border bg-[rgba(255,250,244,0.8)] px-4 py-3 text-sm text-ink-soft">
                    {payment.memo || "Apartment cleaning payout"}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Authorized signature
                  </p>
                  <div className="mt-2 flex h-[62px] items-end rounded-2xl border border-dashed border-border px-4 py-3 font-serif text-2xl italic text-ink-soft">
                    Gee Project
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-border bg-[rgba(255,250,244,0.72)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                Payment stub
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white/75 px-4 py-3 text-sm text-ink-soft">
                  Cleaner: {payment.cleaner?.name || "Unknown cleaner"}
                </div>
                <div className="rounded-2xl border border-border bg-white/75 px-4 py-3 text-sm text-ink-soft">
                  Check no.: {payment.checkNumber}
                </div>
                <div className="rounded-2xl border border-border bg-white/75 px-4 py-3 text-sm text-ink-soft">
                  Payment date: {formatDate(payment.paymentDate)}
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-[24px] border border-border">
                <div className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4 bg-[rgba(67,56,51,0.04)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  <span>Apartment</span>
                  <span>Cleaning date</span>
                  <span>Payout</span>
                </div>
                {payment.jobs.map((job) => (
                  <div
                    key={job._id}
                    className="grid grid-cols-[1.4fr_1fr_0.8fr] gap-4 border-t border-border px-4 py-4 text-sm text-ink-soft first:border-t-0"
                  >
                    <div>
                      <p className="font-semibold">{job.apartmentName}</p>
                      <p className="text-xs text-muted">{job.apartmentAddress || "No address yet"}</p>
                    </div>
                    <div>{formatDate(job.cleaningDate)}</div>
                    <div>{formatCurrency(job.cleanerPayout)}</div>
                  </div>
                ))}
              </div>
              {payment.notes ? (
                <div className="mt-4 rounded-2xl border border-border bg-white/75 px-4 py-4 text-sm leading-6 text-muted">
                  {payment.notes}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
