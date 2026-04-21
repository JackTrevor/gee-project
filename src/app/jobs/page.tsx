import {
  createCleaner,
  createClient,
  createJob,
  deleteCleaner,
  deleteClient,
  deleteJob,
  updateCleaner,
  updateClient,
  updateJob,
} from "@/app/actions";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceNav } from "@/components/workspace-nav";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";

async function getJobsPageData() {
  await connectToDatabase();
  return getDashboardData();
}

const statusClassNames: Record<string, string> = {
  scheduled: "bg-[rgba(31,122,82,0.10)] text-[#1f7a52]",
  completed: "bg-[rgba(20,82,56,0.12)] text-[#145238]",
  cancelled: "bg-[rgba(137,48,48,0.10)] text-[#8a2f2f]",
  pending: "bg-[rgba(213,155,61,0.14)] text-[#8b5a12]",
  invoiced: "bg-[rgba(31,122,82,0.10)] text-[#145238]",
  paid: "bg-[rgba(20,82,56,0.12)] text-[#145238]",
  requested: "bg-[rgba(213,155,61,0.14)] text-[#8b5a12]",
  approved: "bg-[rgba(20,82,56,0.12)] text-[#145238]",
  rejected: "bg-[rgba(137,48,48,0.10)] text-[#8a2f2f]",
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

function JobStatusCard({
  title,
  subtitle,
  value,
  tone,
}: {
  title: string;
  subtitle: string;
  value: string;
  tone: string;
}) {
  return (
    <article className="rounded-[28px] border border-border bg-white/72 p-5">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>
        {title}
      </div>
      <p className="mt-4 font-serif text-4xl text-ink-soft">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
    </article>
  );
}

function JobCard({
  job,
  emphasis,
}: {
  job: Awaited<ReturnType<typeof getJobsPageData>>["jobs"][number];
  emphasis: "current" | "completed";
}) {
  const profit = job.amountCharged - job.cleanerPayout;

  return (
    <article
      className={`rounded-[28px] border border-border p-5 ${
        emphasis === "completed"
          ? "bg-[linear-gradient(180deg,rgba(243,250,245,0.98),rgba(231,244,236,0.96))]"
          : "bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,249,245,0.92))]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl text-ink-soft">{job.apartmentName}</p>
          <p className="mt-1 text-sm text-muted">{job.apartmentAddress || "No address yet"}</p>
        </div>
        <Pill value={job.jobStatus} />
      </div>
      <div className="mt-4 grid gap-3 text-sm text-ink-soft sm:grid-cols-2">
        <div className="rounded-2xl bg-[rgba(255,255,255,0.72)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Client</p>
          <p className="mt-2 font-semibold">
            {job.clientId?.companyName || job.clientId?.name || "Unknown client"}
          </p>
        </div>
        <div className="rounded-2xl bg-[rgba(255,255,255,0.72)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Cleaner</p>
          <p className="mt-2 font-semibold">{job.cleanerId?.name || "Unknown cleaner"}</p>
        </div>
        <div className="rounded-2xl bg-[rgba(255,255,255,0.72)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Cleaning date</p>
          <p className="mt-2 font-semibold">{formatDate(job.cleaningDate)}</p>
        </div>
        <div className="rounded-2xl bg-[rgba(255,255,255,0.72)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Profit</p>
          <p className="mt-2 font-semibold">{formatCurrency(profit)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill value={job.clientPaymentStatus} />
        <Pill value={job.cleanerPaymentStatus} />
        {job.completionReviewStatus !== "none" ? <Pill value={job.completionReviewStatus} /> : null}
      </div>
      {job.notes ? (
        <p className="mt-4 rounded-2xl bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm leading-6 text-muted">
          {job.notes}
        </p>
      ) : null}
    </article>
  );
}

export default async function JobsPage() {
  const { clients, cleaners, jobs, totals } = await getJobsPageData();

  const canCreateJob = clients.length > 0 && cleaners.some((cleaner) => cleaner.active);
  const scheduledJobs = jobs.filter((job) => job.jobStatus === "scheduled");
  const completedJobs = jobs.filter((job) => job.jobStatus === "completed");
  const cancelledJobs = jobs.filter((job) => job.jobStatus === "cancelled");
  const reviewRequestedJobs = jobs.filter((job) => job.completionReviewStatus === "requested");
  const unpaidCompletedJobs = completedJobs.filter(
    (job) => job.clientPaymentStatus !== "paid" || job.cleanerPaymentStatus !== "paid",
  );
  const currentJobs = [...scheduledJobs].sort(
    (left, right) => new Date(left.cleaningDate).getTime() - new Date(right.cleaningDate).getTime(),
  );
  const latestCompletedJobs = [...completedJobs]
    .sort(
      (left, right) => new Date(right.cleaningDate).getTime() - new Date(left.cleaningDate).getTime(),
    )
    .slice(0, 8);
  const clientJobCounts = jobs.reduce<Record<string, number>>((counts, job) => {
    const id = job.clientId?._id;
    if (id) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, {});
  const cleanerJobCounts = jobs.reduce<Record<string, number>>((counts, job) => {
    const id = job.cleanerId?._id;
    if (id) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, {});

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <WorkspaceNav currentPath="/jobs" />
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-[linear-gradient(135deg,rgba(250,255,251,0.92),rgba(237,246,239,0.92))] text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(20,82,56,0.14)] bg-[rgba(255,255,255,0.72)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                    Operations workspace
                  </div>
                  <LogoutButton />
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  A clearer jobs dashboard for the day-to-day operation.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  This workspace now acts more like a command center. You can
                  see what is active, what is complete, and what still needs
                  payment attention before jumping into editing records.
                </p>
              </div>

            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "Total jobs", value: jobs.length.toString() },
                { label: "Scheduled", value: scheduledJobs.length.toString() },
                { label: "Completed", value: completedJobs.length.toString() },
                { label: "Awaiting review", value: reviewRequestedJobs.length.toString() },
                {
                  label: "Cancelled",
                  value: cancelledJobs.length.toString(),
                },
              ].map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[26px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,246,0.9))] p-5"
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

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <JobStatusCard
            title="Live pipeline"
            value={currentJobs.length.toString()}
            subtitle="Jobs still active and moving through the schedule."
            tone="bg-[rgba(31,122,82,0.12)] text-[#1f7a52]"
          />
          <JobStatusCard
            title="Recently finished"
            value={latestCompletedJobs.length.toString()}
            subtitle="Most recent completed jobs ready for quick follow-up."
            tone="bg-[rgba(20,82,56,0.12)] text-[#145238]"
          />
          <JobStatusCard
            title="Unpaid completed"
            value={unpaidCompletedJobs.length.toString()}
            subtitle="Finished work that still needs client or cleaner settlement."
            tone="bg-[rgba(213,155,61,0.14)] text-[#8b5a12]"
          />
          <JobStatusCard
            title="Profit tracked"
            value={formatCurrency(totals.profit)}
            subtitle="Gross profit across every job currently recorded."
            tone="bg-[rgba(31,122,82,0.10)] text-[#145238]"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  Current pipeline
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Active apartment jobs
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(31,122,82,0.12)] px-3 py-1 text-sm text-[#1f7a52]">
                {currentJobs.length} active
              </div>
            </div>

            {currentJobs.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                No active jobs right now. New scheduled work will appear here first.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {currentJobs.slice(0, 6).map((job) => (
                  <JobCard key={job._id} job={job} emphasis="current" />
                ))}
              </div>
            )}
          </article>

          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  Completed jobs
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Recently finished work
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(20,82,56,0.12)] px-3 py-1 text-sm text-[#145238]">
                {completedJobs.length} complete
              </div>
            </div>

            {latestCompletedJobs.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-border bg-white/50 px-5 py-8 text-sm leading-7 text-muted">
                Completed jobs will collect here as soon as work starts being finished.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {latestCompletedJobs.map((job) => (
                  <JobCard key={job._id} job={job} emphasis="completed" />
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  All job records
                </p>
                <h2 className="mt-2 font-serif text-3xl text-ink-soft">
                  Edit and manage every apartment job
                </h2>
              </div>
              <div className="rounded-full bg-[rgba(31,122,82,0.12)] px-3 py-1 text-sm text-[#1f7a52]">
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
                              {job.completionReviewStatus !== "none" ? (
                                <Pill value={job.completionReviewStatus} />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      {job.notes ? (
                        <p className="mt-4 rounded-2xl bg-[rgba(255,250,244,0.7)] px-4 py-3 text-sm leading-6 text-muted">
                          {job.notes}
                        </p>
                      ) : null}

                      <details
                        key={`${job._id}-${job.updatedAt ? new Date(job.updatedAt).toISOString() : "initial"}`}
                        className="mt-4 rounded-[24px] border border-border bg-[rgba(255,255,255,0.65)]"
                      >
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink-soft">
                          Edit job details
                        </summary>
                        <div className="border-t border-border px-4 py-4">
                          <form action={updateJob} className="space-y-3">
                            <input type="hidden" name="id" value={job._id} />
                            <input
                              name="apartmentName"
                              defaultValue={job.apartmentName}
                              placeholder="Apartment name or short label"
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              required
                            />
                            <input
                              name="apartmentAddress"
                              defaultValue={job.apartmentAddress}
                              placeholder="Apartment address"
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <select
                                name="clientId"
                                defaultValue={job.clientId?._id ?? ""}
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                                required
                              >
                                {clients.map((client) => (
                                  <option key={client._id} value={client._id}>
                                    {client.companyName || client.name}
                                  </option>
                                ))}
                              </select>
                              <select
                                name="cleanerId"
                                defaultValue={job.cleanerId?._id ?? ""}
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                                required
                              >
                                {cleaners.map((cleaner) => (
                                  <option key={cleaner._id} value={cleaner._id}>
                                    {cleaner.name}
                                    {cleaner.active ? "" : " (inactive)"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <input
                                name="cleaningDate"
                                type="date"
                                defaultValue={new Date(job.cleaningDate).toISOString().split("T")[0]}
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                                required
                              />
                              <input
                                name="amountCharged"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={job.amountCharged}
                                placeholder="Amount charged"
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                                required
                              />
                              <input
                                name="cleanerPayout"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={job.cleanerPayout}
                                placeholder="Cleaner payout"
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                                required
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <select
                                name="jobStatus"
                                defaultValue={job.jobStatus}
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <select
                                name="clientPaymentStatus"
                                defaultValue={job.clientPaymentStatus}
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              >
                                <option value="pending">Client payment pending</option>
                                <option value="invoiced">Client invoiced</option>
                                <option value="paid">Client paid</option>
                              </select>
                              <select
                                name="cleanerPaymentStatus"
                                defaultValue={job.cleanerPaymentStatus}
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              >
                                <option value="pending">Cleaner unpaid</option>
                                <option value="paid">Cleaner paid</option>
                              </select>
                            </div>
                            <textarea
                              name="notes"
                              defaultValue={job.notes}
                              placeholder="Special instructions, invoice notes, unit condition, or payout comments"
                              rows={4}
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                            />
                            <div className="flex flex-wrap gap-3">
                              <button className="rounded-full bg-[#215940] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#184330]">
                                Save changes
                              </button>
                            </div>
                          </form>
                          <form action={deleteJob} className="mt-3">
                            <input type="hidden" name="id" value={job._id} />
                            <button className="rounded-full border border-[rgba(137,48,48,0.22)] bg-[rgba(137,48,48,0.10)] px-5 py-3 text-sm font-semibold text-[#8a2f2f] transition hover:bg-[rgba(137,48,48,0.16)]">
                              Delete job
                            </button>
                          </form>
                        </div>
                      </details>
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

              <div className="mt-6 space-y-3">
                {clients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white/60 px-4 py-4 text-sm text-muted">
                    No clients added yet.
                  </div>
                ) : (
                  clients.map((client) => {
                    const linkedJobs = clientJobCounts[client._id] ?? 0;

                    return (
                      <details
                        key={`${client._id}-${client.updatedAt ? new Date(client.updatedAt).toISOString() : "initial"}`}
                        className="rounded-[24px] border border-border bg-white/70"
                      >
                        <summary className="cursor-pointer list-none px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-ink-soft">
                                {client.companyName || client.name}
                              </p>
                              <p className="text-sm text-muted">
                                {linkedJobs} linked {linkedJobs === 1 ? "job" : "jobs"}
                              </p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Manage
                            </span>
                          </div>
                        </summary>
                        <div className="border-t border-border px-4 py-4">
                          <form action={updateClient} className="space-y-3">
                            <input type="hidden" name="id" value={client._id} />
                            <input
                              name="name"
                              defaultValue={client.name}
                              placeholder="Client name"
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              required
                            />
                            <input
                              name="companyName"
                              defaultValue={client.companyName}
                              placeholder="Company name"
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                name="phone"
                                defaultValue={client.phone}
                                placeholder="Phone"
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              />
                              <input
                                name="email"
                                defaultValue={client.email}
                                placeholder="Email"
                                type="email"
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              />
                            </div>
                            <textarea
                              name="notes"
                              defaultValue={client.notes}
                              placeholder="Notes"
                              rows={3}
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                            />
                            <button className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                              Update client
                            </button>
                          </form>
                          {linkedJobs === 0 ? (
                            <form action={deleteClient} className="mt-3">
                              <input type="hidden" name="id" value={client._id} />
                              <button className="rounded-full border border-[rgba(137,48,48,0.22)] bg-[rgba(137,48,48,0.10)] px-5 py-3 text-sm font-semibold text-[#8a2f2f] transition hover:bg-[rgba(137,48,48,0.16)]">
                                Delete client
                              </button>
                            </form>
                          ) : (
                            <p className="mt-3 text-sm text-muted">
                              Remove or reassign linked jobs before deleting this client.
                            </p>
                          )}
                        </div>
                      </details>
                    );
                  })
                )}
              </div>
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

              <div className="mt-6 space-y-3">
                {cleaners.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white/60 px-4 py-4 text-sm text-muted">
                    No cleaners added yet.
                  </div>
                ) : (
                  cleaners.map((cleaner) => {
                    const linkedJobs = cleanerJobCounts[cleaner._id] ?? 0;

                    return (
                      <details
                        key={`${cleaner._id}-${cleaner.updatedAt ? new Date(cleaner.updatedAt).toISOString() : "initial"}`}
                        className="rounded-[24px] border border-border bg-white/70"
                      >
                        <summary className="cursor-pointer list-none px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-ink-soft">{cleaner.name}</p>
                              <p className="text-sm text-muted">
                                {cleaner.active ? "Active" : "Inactive"}
                                {" · "}
                                {linkedJobs} linked {linkedJobs === 1 ? "job" : "jobs"}
                              </p>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Manage
                            </span>
                          </div>
                        </summary>
                        <div className="border-t border-border px-4 py-4">
                          <form action={updateCleaner} className="space-y-3">
                            <input type="hidden" name="id" value={cleaner._id} />
                            <input
                              name="name"
                              defaultValue={cleaner.name}
                              placeholder="Cleaner name"
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              required
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <input
                                name="phone"
                                defaultValue={cleaner.phone}
                                placeholder="Phone"
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              />
                              <input
                                name="email"
                                defaultValue={cleaner.email}
                                placeholder="Email"
                                type="email"
                                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                              />
                            </div>
                            <textarea
                              name="notes"
                              defaultValue={cleaner.notes}
                              placeholder="Notes"
                              rows={3}
                              className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                            />
                            <label className="flex items-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-ink-soft">
                              <input type="checkbox" name="active" defaultChecked={cleaner.active} />
                              Active cleaner
                            </label>
                            <button className="rounded-full bg-[#375d81] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b4a66]">
                              Update cleaner
                            </button>
                          </form>
                          {linkedJobs === 0 ? (
                            <form action={deleteCleaner} className="mt-3">
                              <input type="hidden" name="id" value={cleaner._id} />
                              <button className="rounded-full border border-[rgba(137,48,48,0.22)] bg-[rgba(137,48,48,0.10)] px-5 py-3 text-sm font-semibold text-[#8a2f2f] transition hover:bg-[rgba(137,48,48,0.16)]">
                                Delete cleaner
                              </button>
                            </form>
                          ) : (
                            <p className="mt-3 text-sm text-muted">
                              Remove or reassign linked jobs before deleting this cleaner.
                            </p>
                          )}
                        </div>
                      </details>
                    );
                  })
                )}
              </div>
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
