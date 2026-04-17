import Link from "next/link";

import { createCleaner, createClient, createJob } from "@/app/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";
import { Cleaner } from "@/models/Cleaner";
import { Client } from "@/models/Client";
import { Job } from "@/models/Job";

type ClientOption = {
  _id: string;
  name: string;
  companyName?: string;
  quickbooksCustomerId?: string;
};

type CleanerOption = {
  _id: string;
  name: string;
  active: boolean;
  quickbooksVendorId?: string;
};

type JobView = {
  _id: string;
  apartmentName: string;
  apartmentAddress?: string;
  cleaningDate: string | Date;
  amountCharged: number;
  cleanerPayout: number;
  jobStatus: string;
  clientPaymentStatus: string;
  cleanerPaymentStatus: string;
  notes?: string;
  clientId: ClientOption | null;
  cleanerId: CleanerOption | null;
};

async function getJobsPageData() {
  await connectToDatabase();

  const [clientsRaw, cleanersRaw, jobsRaw] = await Promise.all([
    Client.find().sort({ name: 1 }).lean(),
    Cleaner.find().sort({ active: -1, name: 1 }).lean(),
    Job.find()
      .sort({ cleaningDate: -1, createdAt: -1 })
      .populate("clientId", "name companyName quickbooksCustomerId")
      .populate("cleanerId", "name active quickbooksVendorId")
      .lean(),
  ]);

  const clients = clientsRaw as Array<{
    _id: { toString(): string };
    name: string;
    companyName?: string;
    quickbooksCustomerId?: string;
  }>;

  const cleaners = cleanersRaw as Array<{
    _id: { toString(): string };
    name: string;
    active: boolean;
    quickbooksVendorId?: string;
  }>;

  const jobs = jobsRaw as unknown as Array<{
    _id: { toString(): string };
    apartmentName: string;
    apartmentAddress?: string;
    cleaningDate: string | Date;
    amountCharged: number;
    cleanerPayout: number;
    jobStatus: string;
    clientPaymentStatus: string;
    cleanerPaymentStatus: string;
    notes?: string;
    clientId?: {
      _id: { toString(): string };
      name: string;
      companyName?: string;
      quickbooksCustomerId?: string;
    } | null;
    cleanerId?: {
      _id: { toString(): string };
      name: string;
      active: boolean;
      quickbooksVendorId?: string;
    } | null;
  }>;

  const normalizedClients: ClientOption[] = clients.map((client) => ({
    _id: client._id.toString(),
    name: client.name,
    companyName: client.companyName,
    quickbooksCustomerId: client.quickbooksCustomerId,
  }));

  const normalizedCleaners: CleanerOption[] = cleaners.map((cleaner) => ({
    _id: cleaner._id.toString(),
    name: cleaner.name,
    active: cleaner.active,
    quickbooksVendorId: cleaner.quickbooksVendorId,
  }));

  const normalizedJobs: JobView[] = jobs.map((job) => ({
    _id: job._id.toString(),
    apartmentName: job.apartmentName,
    apartmentAddress: job.apartmentAddress,
    cleaningDate: job.cleaningDate,
    amountCharged: job.amountCharged,
    cleanerPayout: job.cleanerPayout,
    jobStatus: job.jobStatus,
    clientPaymentStatus: job.clientPaymentStatus,
    cleanerPaymentStatus: job.cleanerPaymentStatus,
    notes: job.notes,
    clientId: job.clientId
      ? {
          _id: job.clientId._id.toString(),
          name: job.clientId.name,
          companyName: job.clientId.companyName,
          quickbooksCustomerId: job.clientId.quickbooksCustomerId,
        }
      : null,
    cleanerId: job.cleanerId
      ? {
          _id: job.cleanerId._id.toString(),
          name: job.cleanerId.name,
          active: job.cleanerId.active,
          quickbooksVendorId: job.cleanerId.quickbooksVendorId,
        }
      : null,
  }));

  const totals = normalizedJobs.reduce(
    (accumulator, job) => {
      accumulator.revenue += job.amountCharged;
      accumulator.payouts += job.cleanerPayout;
      accumulator.profit += job.amountCharged - job.cleanerPayout;

      if (job.clientPaymentStatus !== "paid") {
        accumulator.outstandingClientBalance += job.amountCharged;
      }

      if (job.cleanerPaymentStatus !== "paid") {
        accumulator.outstandingCleanerBalance += job.cleanerPayout;
      }

      return accumulator;
    },
    {
      revenue: 0,
      payouts: 0,
      profit: 0,
      outstandingClientBalance: 0,
      outstandingCleanerBalance: 0,
    },
  );

  return {
    clients: normalizedClients,
    cleaners: normalizedCleaners,
    jobs: normalizedJobs,
    totals,
  };
}

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

export default async function JobsPage() {
  const { clients, cleaners, jobs, totals } = await getJobsPageData();

  const canCreateJob = clients.length > 0 && cleaners.some((cleaner) => cleaner.active);

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                  Operations workspace
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  Jobs, clients, and cleaners in one working view.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  This is the first real workflow for Gee Project. Add your
                  clients and cleaners, create apartment jobs, and start
                  building the data we will later turn into invoices, reports,
                  and QuickBooks sync.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Back to overview
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Total jobs", value: jobs.length.toString() },
                { label: "Revenue", value: formatCurrency(totals.revenue) },
                { label: "Cleaner payouts", value: formatCurrency(totals.payouts) },
                { label: "Profit", value: formatCurrency(totals.profit) },
                {
                  label: "Outstanding client balance",
                  value: formatCurrency(totals.outstandingClientBalance),
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

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  Job board
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Current apartment jobs
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-sm text-accent-strong">
                {jobs.length} recorded
              </div>
            </div>

            {jobs.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                No jobs yet. Start by adding at least one client and one cleaner,
                then create the first apartment job.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {jobs.map((job) => {
                  const profit = job.amountCharged - job.cleanerPayout;

                  return (
                    <article
                      key={job._id}
                      className="rounded-[24px] border border-border bg-white/70 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-2xl text-ink-soft">
                              {job.apartmentName}
                            </h3>
                            <Pill value={job.jobStatus} />
                          </div>
                          <p className="text-sm text-muted">
                            {job.apartmentAddress || "Address not added yet"}
                          </p>
                          <p className="text-sm leading-6 text-ink-soft">
                            Client:{" "}
                            <span className="font-semibold">
                              {job.clientId?.companyName || job.clientId?.name || "Unknown client"}
                            </span>
                            {" · "}
                            Cleaner:{" "}
                            <span className="font-semibold">
                              {job.cleanerId?.name || "Unknown cleaner"}
                            </span>
                            {" · "}
                            Cleaning date:{" "}
                            <span className="font-semibold">
                              {formatDate(job.cleaningDate)}
                            </span>
                          </p>
                        </div>

                        <div className="grid min-w-[240px] grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-[rgba(201,111,59,0.10)] px-4 py-3">
                            <p className="uppercase tracking-[0.16em] text-muted">
                              Charged
                            </p>
                            <p className="mt-2 font-semibold text-ink-soft">
                              {formatCurrency(job.amountCharged)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[rgba(54,94,129,0.10)] px-4 py-3">
                            <p className="uppercase tracking-[0.16em] text-muted">
                              Payout
                            </p>
                            <p className="mt-2 font-semibold text-ink-soft">
                              {formatCurrency(job.cleanerPayout)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[rgba(34,94,67,0.10)] px-4 py-3">
                            <p className="uppercase tracking-[0.16em] text-muted">
                              Profit
                            </p>
                            <p className="mt-2 font-semibold text-ink-soft">
                              {formatCurrency(profit)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[rgba(67,56,51,0.06)] px-4 py-3">
                            <p className="uppercase tracking-[0.16em] text-muted">
                              Payments
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Pill value={job.clientPaymentStatus} />
                              <Pill value={job.cleanerPaymentStatus} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {job.notes ? (
                        <p className="mt-4 rounded-2xl bg-[rgba(255,250,244,0.7)] px-4 py-3 text-sm leading-6 text-muted">
                          {job.notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </article>

          <div className="grid gap-6">
            <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                Add client
              </p>
              <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                Who gives you the jobs?
              </h2>
              <form action={createClient} className="mt-6 space-y-3">
                <input
                  name="name"
                  placeholder="Client name"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  required
                />
                <input
                  name="companyName"
                  placeholder="Company name"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    name="phone"
                    placeholder="Phone"
                    className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                  <input
                    name="email"
                    placeholder="Email"
                    type="email"
                    className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                </div>
                <textarea
                  name="notes"
                  placeholder="Notes"
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                />
                <button className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                  Save client
                </button>
              </form>
            </article>

            <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                Add cleaner
              </p>
              <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                Who does the cleaning?
              </h2>
              <form action={createCleaner} className="mt-6 space-y-3">
                <input
                  name="name"
                  placeholder="Cleaner name"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  required
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    name="phone"
                    placeholder="Phone"
                    className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                  <input
                    name="email"
                    placeholder="Email"
                    type="email"
                    className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                </div>
                <textarea
                  name="notes"
                  placeholder="Notes"
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                />
                <label className="flex items-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-ink-soft">
                  <input type="checkbox" name="active" defaultChecked />
                  Active cleaner
                </label>
                <button className="w-full rounded-full bg-[#375d81] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b4a66]">
                  Save cleaner
                </button>
              </form>
            </article>

            <article className="card-shadow rounded-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,250,244,0.96),rgba(247,241,232,0.92))] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                Add job
              </p>
              <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                Record the apartment work
              </h2>

              {canCreateJob ? (
                <form action={createJob} className="mt-6 space-y-3">
                  <input
                    name="apartmentName"
                    placeholder="Apartment name or short label"
                    className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                    required
                  />
                  <input
                    name="apartmentAddress"
                    placeholder="Apartment address"
                    className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      name="clientId"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select client
                      </option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.companyName || client.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="cleanerId"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select cleaner
                      </option>
                      {cleaners
                        .filter((cleaner) => cleaner.active)
                        .map((cleaner) => (
                          <option key={cleaner._id} value={cleaner._id}>
                            {cleaner.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      name="cleaningDate"
                      type="date"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                      required
                    />
                    <input
                      name="amountCharged"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount charged"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                      required
                    />
                    <input
                      name="cleanerPayout"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cleaner payout"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                      required
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <select
                      name="jobStatus"
                      defaultValue="scheduled"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      name="clientPaymentStatus"
                      defaultValue="pending"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                    >
                      <option value="pending">Client payment pending</option>
                      <option value="invoiced">Client invoiced</option>
                      <option value="paid">Client paid</option>
                    </select>
                    <select
                      name="cleanerPaymentStatus"
                      defaultValue="pending"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                    >
                      <option value="pending">Cleaner unpaid</option>
                      <option value="paid">Cleaner paid</option>
                    </select>
                  </div>
                  <textarea
                    name="notes"
                    placeholder="Special instructions, invoice notes, unit condition, or payout comments"
                    rows={4}
                    className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  />
                  <button className="w-full rounded-full bg-[#215940] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#184330]">
                    Save job
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/60 px-5 py-6 text-sm leading-7 text-muted">
                  Add at least one client and one active cleaner first. Then
                  the job form will unlock.
                </div>
              )}
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
