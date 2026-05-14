import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { connectToDatabase } from "@/lib/mongodb";
import { getCleanerPaymentById } from "@/lib/payments";

type PaymentPageProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

const COMPANY_NAME = "LG Flooring Corporation";
const COMPANY_ADDRESS_LINES = [
  "131 Village Center Boulevard",
  "Myrtle Beach SC 29579",
];
const BANK_LABEL = "WELLS FARGO BANK";

function formatCheckDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCompactDate(value: string | Date) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function formatNumericAmount(value: number) {
  return `**${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
  return `${numberToWords(dollars)} and ${cents.toString().padStart(2, "0")}/100*****`;
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

function MicrLine({ checkNumber }: { checkNumber: string }) {
  const firstChunk = `"${checkNumber.slice(-8)}"`;
  const secondChunk = '":053207766:"';
  const thirdChunk = '6328813263"';

  return (
    <div className="mt-4 flex items-center justify-center border-t border-[rgba(0,0,0,0.18)] pt-3 font-mono text-[18px] tracking-[0.12em] text-[#202020]">
      <span>{firstChunk}</span>
      <span className="ml-4">{secondChunk}</span>
      <span className="ml-4">{thirdChunk}</span>
    </div>
  );
}

function CheckFace({
  payment,
  payeeLines,
}: {
  payment: NonNullable<Awaited<ReturnType<typeof getCleanerPaymentById>>>;
  payeeLines: string[];
}) {
  return (
    <section className="rounded-[10px] border border-[rgba(0,0,0,0.28)] bg-white px-7 py-6 text-black">
      <div className="grid grid-cols-[1.35fr_1fr_0.8fr] items-start gap-4">
        <div>
          <p className="font-mono text-[18px] font-semibold uppercase tracking-[0.04em]">
            {COMPANY_NAME}
          </p>
          {COMPANY_ADDRESS_LINES.map((line) => (
            <p key={line} className="mt-1 font-mono text-[14px] font-semibold leading-tight text-[#454545]">
              {line}
            </p>
          ))}
        </div>
        <div className="pt-1 text-center font-mono text-[18px] font-semibold tracking-[0.08em]">
          {BANK_LABEL}
        </div>
        <div className="text-right">
          <p className="font-mono text-[18px] font-semibold tracking-[0.08em]">
            {payment.checkNumber.padStart(8, "0")}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        <span className="font-mono text-[18px] font-semibold tracking-[0.08em]">DATE:</span>
        <span className="font-sans text-[18px] text-[#3d3d3d]">{formatCheckDate(payment.paymentDate)}</span>
      </div>

      <div className="mt-10 grid grid-cols-[110px_1fr_250px] items-start gap-5">
        <div className="space-y-10 pt-1 font-mono text-[18px] font-semibold">
          <p>Amount :</p>
          <p>Pay To :</p>
        </div>
        <div>
          <p className="font-sans text-[18px] text-[#111]">{formatAmountInWords(payment.totalAmount)}</p>
          <div className="mt-8 space-y-1 font-mono text-[18px] font-semibold tracking-[0.02em] text-[#4a4a4a]">
            {payeeLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className="pt-8 text-right">
          <p className="font-mono text-[28px] font-semibold tracking-[0.08em]">
            $ {formatNumericAmount(payment.totalAmount)}
          </p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-[1fr_270px] items-end gap-10">
        <div>
          <p className="font-mono text-[16px] font-semibold tracking-[0.06em] text-[#5a5a5a]">
            MEMO :
          </p>
          <p className="mt-2 min-h-[22px] text-[14px] text-[#444]">{payment.memo || ""}</p>
        </div>
        <div>
          <div className="h-[58px] border-[4px] border-[#1b1b1b]" />
          <p className="mt-1 text-center font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7a7a7a]">
            Authorized Signature
          </p>
        </div>
      </div>

      <MicrLine checkNumber={payment.checkNumber.padStart(8, "0")} />
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f7f2_0%,#e7f0e8_100%)] px-4 py-6 text-foreground print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 print-sheet-a4-checks print:max-w-none print:gap-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="inline-flex items-center rounded-full border border-[rgba(20,82,56,0.14)] bg-[rgba(255,255,255,0.74)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Printable checks
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

        <section className="card-shadow rounded-[24px] border border-border bg-white/92 p-4 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
          <div className="space-y-4 print:space-y-2">
            <div className="print:hidden">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
                A4 three-check layout
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                This page now prints as three stacked checks on one A4 sheet. The numbering flow has been moved to numeric checks starting at 500.
              </p>
              <p className="mt-1 text-sm text-muted">
                Payment date stored in Gee Project: {formatCompactDate(payment.paymentDate)}
              </p>
            </div>

            {[0, 1, 2].map((copyIndex) => (
              <div key={copyIndex} className="pb-2 print:pb-0">
                <CheckFace payment={payment} payeeLines={payeeLines} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
