import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { formatCurrency, formatDateForInput } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";
import { getCleanerPaymentById } from "@/lib/payments";

type PaymentPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

const COMPANY_NAME = "Gee Project Cleaning";
const COMPANY_ADDRESS_LINES = ["131 Village Center Blvd", "Unit 3312", "Myrtle Beach, SC 29579"];
const BANK_LABEL = "Wells Fargo";
const BANK_CITY = "Conway, South Carolina 29526";

function formatCheckDate(value: string | Date) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function formatNumericAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function numberToWordsUnderThousand(value: number): string {
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (value < 20) {
    return ones[value];
  }

  if (value < 100) {
    const remainder = value % 10;
    return `${tens[Math.floor(value / 10)]}${remainder ? `-${ones[remainder]}` : ""}`;
  }

  const remainder = value % 100;
  return `${ones[Math.floor(value / 100)]} Hundred${remainder ? ` ${numberToWordsUnderThousand(remainder)}` : ""}`;
}

function numberToWords(value: number): string {
  if (value === 0) {
    return "Zero";
  }

  const scales = [
    { value: 1_000_000_000, label: "Billion" },
    { value: 1_000_000, label: "Million" },
    { value: 1_000, label: "Thousand" },
  ];

  let remaining = Math.floor(value);
  const parts: string[] = [];

  for (const scale of scales) {
    if (remaining >= scale.value) {
      const scaled = Math.floor(remaining / scale.value);
      parts.push(`${numberToWordsUnderThousand(scaled)} ${scale.label}`);
      remaining %= scale.value;
    }
  }

  if (remaining > 0) {
    parts.push(numberToWordsUnderThousand(remaining));
  }

  return parts.join(" ");
}

function formatAmountInWords(value: number) {
  const dollars = Math.floor(value);
  const cents = Math.round((value - dollars) * 100);
  return `${numberToWords(dollars)} and ${cents.toString().padStart(2, "0")}/100 Dollars`;
}

function getPayeeLines(payment: NonNullable<Awaited<ReturnType<typeof getCleanerPaymentById>>>) {
  const lines = [payment.cleaner?.name || "Unknown cleaner"];

  if (payment.cleaner?.phone) {
    lines.push(payment.cleaner.phone);
  }

  if (payment.cleaner?.email) {
    lines.push(payment.cleaner.email);
  }

  return lines.slice(0, 3);
}

function CheckFace({
  checkNumber,
  paymentDate,
  totalAmount,
  payeeLines,
  memo,
  copyLabel,
}: {
  checkNumber: string;
  paymentDate: string | Date;
  totalAmount: number;
  payeeLines: string[];
  memo?: string;
  copyLabel?: string;
}) {
  return (
    <section className="rounded-[16px] border border-[rgba(20,82,56,0.24)] bg-[linear-gradient(180deg,rgba(235,245,239,0.82),rgba(226,240,231,0.78))] px-5 py-4 text-[11px] text-[#143326]">
      <div className="grid grid-cols-[1.45fr_0.9fr_0.7fr] items-start gap-4">
        <div>
          <p className="text-[18px] font-semibold leading-none">{COMPANY_NAME}</p>
          {COMPANY_ADDRESS_LINES.map((line) => (
            <p key={line} className="mt-0.5 leading-tight">
              {line}
            </p>
          ))}
        </div>
        <div className="pt-1 text-center">
          <p className="font-semibold">{BANK_LABEL}</p>
          <p className="mt-0.5 text-[10px]">{BANK_CITY}</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-semibold leading-none">{checkNumber}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em]">Date</p>
          <p className="mt-0.5">{formatCheckDate(paymentDate)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <p className="font-semibold uppercase tracking-[0.14em]">Pay</p>
        <div className="border-b border-[rgba(20,82,56,0.35)] pb-1 text-[13px]">
          {formatAmountInWords(totalAmount)}
        </div>
        <div className="min-w-[120px] text-right">
          <p className="text-[10px] uppercase tracking-[0.12em]">$</p>
          <p className="text-[22px] font-semibold leading-none">{formatNumericAmount(totalAmount)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[56px_1fr] gap-3">
        <div className="space-y-1 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4b6257]">
          <p>To the</p>
          <p>order</p>
          <p>of</p>
        </div>
        <div className="space-y-1 border-b border-[rgba(20,82,56,0.35)] pb-3 text-[13px]">
          {payeeLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_0.7fr] items-end gap-4">
        <div className="text-[10px] tracking-[0.22em] text-[#4b6257]">
          #00163* 05320778636328813263*
        </div>
        <div className="space-y-1">
          <div className="border-b border-[rgba(20,82,56,0.35)]" />
          <div className="flex items-center justify-between text-[10px]">
            <span>{memo || "Cleaning payout"}</span>
            {copyLabel ? <span className="text-[18px] font-semibold tracking-[0.12em]">{copyLabel}</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function CleanerPaymentDetailPage({ params }: PaymentPageProps) {
  await connectToDatabase();
  const { paymentId } = await params;
  const payment = await getCleanerPaymentById(paymentId);

  if (!payment) {
    notFound();
  }

  const payeeLines = getPayeeLines(payment);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f7f2_0%,#e7f0e8_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="inline-flex items-center rounded-full border border-[rgba(20,82,56,0.14)] bg-[rgba(255,255,255,0.74)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Printable check
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/payments"
              className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm text-ink-soft transition hover:bg-white"
            >
              Back to payments
            </Link>
            <PrintButton />
          </div>
        </div>

        <section className="card-shadow rounded-[32px] border border-border bg-white/88 p-5 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <div className="space-y-4 print:space-y-3">
            <div className="print:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
                First alignment draft
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                This version follows the same overall structure as your sample:
                top live check, middle stub, and lower copy. After Gee reviews it,
                we can tighten the field positions for your real check stock.
              </p>
            </div>

            <CheckFace
              checkNumber={payment.checkNumber}
              paymentDate={payment.paymentDate}
              totalAmount={payment.totalAmount}
              payeeLines={payeeLines}
              memo={payment.memo}
            />

            <section className="rounded-[16px] border border-[rgba(20,82,56,0.24)] bg-white px-5 py-4 text-[11px] text-[#143326]">
              <div className="flex items-start justify-between gap-4 border-b border-[rgba(20,82,56,0.22)] pb-2">
                <div>
                  <p className="text-[18px] font-semibold leading-none">{COMPANY_NAME}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#4b6257]">
                    Name
                  </p>
                  <p className="mt-0.5 text-[12px]">{payment.cleaner?.name || "Unknown cleaner"}</p>
                </div>
                <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4b6257]">
                    Check Date
                  </p>
                  <p>{formatCheckDate(payment.paymentDate)}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4b6257]">
                    Amount
                  </p>
                  <p>{formatNumericAmount(payment.totalAmount)}</p>
                </div>
              </div>

              <div className="mt-3 min-h-[220px] rounded-[12px] border border-[rgba(20,82,56,0.18)] px-4 py-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-[rgba(243,248,244,0.92)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4b6257]">
                      Check no.
                    </p>
                    <p className="mt-1 text-[12px]">{payment.checkNumber}</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(243,248,244,0.92)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4b6257]">
                      Memo
                    </p>
                    <p className="mt-1 text-[12px]">{payment.memo || "Cleaning payout"}</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(243,248,244,0.92)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4b6257]">
                      Total
                    </p>
                    <p className="mt-1 text-[12px]">{formatCurrency(payment.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[12px] border border-[rgba(20,82,56,0.18)]">
                  <div className="grid grid-cols-[1.5fr_0.9fr_0.8fr] gap-4 bg-[rgba(31,122,82,0.08)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4b6257]">
                    <span>Apartment</span>
                    <span>Cleaning date</span>
                    <span>Payout</span>
                  </div>
                  {payment.jobs.map((job) => (
                    <div
                      key={job._id}
                      className="grid grid-cols-[1.5fr_0.9fr_0.8fr] gap-4 border-t border-[rgba(20,82,56,0.12)] px-3 py-3 text-[12px] first:border-t-0"
                    >
                      <div>
                        <p className="font-semibold">{job.apartmentName}</p>
                        <p className="text-[10px] text-[#68776f]">{job.apartmentAddress || "No address yet"}</p>
                      </div>
                      <div>{formatDateForInput(job.cleaningDate)}</div>
                      <div>{formatCurrency(job.cleanerPayout)}</div>
                    </div>
                  ))}
                </div>

                {payment.notes ? (
                  <div className="mt-4 rounded-xl bg-[rgba(243,248,244,0.92)] px-3 py-3 text-[12px] leading-6 text-[#68776f]">
                    {payment.notes}
                  </div>
                ) : null}
              </div>
            </section>

            <CheckFace
              checkNumber={payment.checkNumber}
              paymentDate={payment.paymentDate}
              totalAmount={payment.totalAmount}
              payeeLines={payeeLines}
              memo={payment.memo}
              copyLabel="COPY"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
