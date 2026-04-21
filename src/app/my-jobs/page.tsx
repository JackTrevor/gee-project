import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requestJobCompletion } from "@/app/actions";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceNav } from "@/components/workspace-nav";
import { getSessionCookieName, getSessionUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";
import { Job } from "@/models/Job";

async function getCleanerJobsPageData() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const sessionUser = await getSessionUser(cookieStore.get(getSessionCookieName())?.value);

  if (!sessionUser || sessionUser.role !== "cleaner" || !sessionUser.cleanerId) {
    redirect("/jobs");
  }

  const jobs = await Job.find({ cleanerId: sessionUser.cleanerId })
    .sort({ cleaningDate: 1, createdAt: -1 })
    .populate("clientId", "name companyName")
    .lean();

  return {
    sessionUser,
    jobs: (jobs as unknown as Array<{
      _id: { toString(): string };
      apartmentName: string;
      apartmentAddress?: string;
      cleaningDate: string | Date;
      amountCharged: number;
      cleanerPayout: number;
      jobStatus: string;
      completionReviewStatus?: string;
      completionRequestNote?: string;
      completionReviewNote?: string;
      clientId?: {
        _id: { toString(): string };
        name: string;
        companyName?: string;
      } | null;
    }>).map((job) => ({
      _id: job._id.toString(),
      apartmentName: job.apartmentName,
      apartmentAddress: job.apartmentAddress,
      cleaningDate: job.cleaningDate,
      amountCharged: job.amountCharged,
      cleanerPayout: job.cleanerPayout,
      jobStatus: job.jobStatus,
      completionReviewStatus: job.completionReviewStatus ?? "none",
      completionRequestNote: job.completionRequestNote,
      completionReviewNote: job.completionReviewNote,
      clientName: job.clientId?.companyName || job.clientId?.name || "Unknown client",
    })),
  };
}

function ReviewPill({ value }: { value: string }) {
  const className =
    value === "requested"
      ? "bg-[rgba(201,111,59,0.12)] text-accent-strong"
      : value === "approved"
        ? "bg-[rgba(34,94,67,0.10)] text-[#215940]"
        : value === "rejected"
          ? "bg-[rgba(137,48,48,0.10)] text-[#8a2f2f]"
          : "bg-[rgba(67,56,51,0.08)] text-ink-soft";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${className}`}>
      {value}
    </span>
  );
}

type CleanerJobView = Awaited<ReturnType<typeof getCleanerJobsPageData>>["jobs"][number];

function CleanerJobCard({ job }: { job: CleanerJobView }) {
  const canRequestCompletion =
    job.jobStatus !== "completed" && job.completionReviewStatus !== "requested";

  return (
    <article
      key={job._id}
      className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-3xl text-ink-soft">{job.apartmentName}</h2>
            <ReviewPill value={job.completionReviewStatus} />
          </div>
          <p className="text-sm text-muted">{job.apartmentAddress || "No address yet"}</p>
          <p className="text-sm leading-6 text-ink-soft">
            Client: <span className="font-semibold">{job.clientName}</span>
            {" · "}
            Date: <span className="font-semibold">{formatDate(job.cleaningDate)}</span>
            {" · "}
            Payout: <span className="font-semibold">{formatCurrency(job.cleanerPayout)}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-[rgba(201,111,59,0.10)] px-4 py-3 text-sm text-ink-soft">
          Job status: <span className="font-semibold capitalize">{job.jobStatus}</span>
        </div>
      </div>

      {job.completionReviewStatus === "rejected" && job.completionReviewNote ? (
        <div className="mt-4 rounded-2xl border border-[rgba(137,48,48,0.18)] bg-[rgba(137,48,48,0.08)] px-4 py-4 text-sm leading-6 text-[#8a2f2f]">
          Admin note: {job.completionReviewNote}
        </div>
      ) : null}

      {job.completionReviewStatus === "requested" ? (
        <div className="mt-4 rounded-2xl border border-[rgba(201,111,59,0.18)] bg-[rgba(201,111,59,0.08)] px-4 py-4 text-sm leading-6 text-accent-strong">
          Completion request sent. Waiting for admin approval.
        </div>
      ) : null}

      {job.completionReviewStatus === "approved" ? (
        <div className="mt-4 rounded-2xl border border-[rgba(20,82,56,0.18)] bg-[rgba(20,82,56,0.08)] px-4 py-4 text-sm leading-6 text-[#145238]">
          This job has been approved and marked completed.
        </div>
      ) : null}

      {canRequestCompletion ? (
        <details className="mt-4 rounded-[24px] border border-border bg-white/70">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink-soft">
            Request completion review
          </summary>
          <div className="border-t border-border px-4 py-4">
            <form action={requestJobCompletion} className="space-y-3">
              <input type="hidden" name="jobId" value={job._id} />
              <textarea
                name="requestNote"
                rows={3}
                placeholder="Optional note for admin, such as finish time or anything to review"
                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
              />
              <button className="rounded-full bg-[#215940] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#184330]">
                Send completion request
              </button>
            </form>
          </div>
        </details>
      ) : null}
    </article>
  );
}

function JobsSection({
  title,
  subtitle,
  countLabel,
  emptyMessage,
  jobsForSection,
  toneClassName,
}: {
  title: string;
  subtitle: string;
  countLabel: string;
  emptyMessage: string;
  jobsForSection: CleanerJobView[];
  toneClassName: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">{subtitle}</p>
          <h2 className="mt-1 font-serif text-3xl text-ink-soft">{title}</h2>
        </div>
        <div className={`rounded-full px-3 py-1 text-sm ${toneClassName}`}>
          {jobsForSection.length} {countLabel}
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {jobsForSection.length === 0 ? (
          <div className="card-shadow rounded-[32px] border border-dashed border-border bg-surface px-6 py-6 text-sm leading-7 text-muted">
            {emptyMessage}
          </div>
        ) : (
          jobsForSection.map((job) => <CleanerJobCard key={job._id} job={job} />)
        )}
      </div>
    </section>
  );
}

export default async function MyJobsPage() {
  const { sessionUser, jobs } = await getCleanerJobsPageData();
  const activeJobs = jobs.filter(
    (job) => job.jobStatus !== "completed" && job.completionReviewStatus === "none",
  );
  const requestedJobs = jobs.filter((job) => job.completionReviewStatus === "requested");
  const rejectedJobs = jobs.filter((job) => job.completionReviewStatus === "rejected");
  const completedJobs = jobs.filter(
    (job) => job.jobStatus === "completed" || job.completionReviewStatus === "approved",
  );

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <WorkspaceNav currentPath="/my-jobs" />
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                    Cleaner workspace
                  </div>
                  <LogoutButton />
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  My assigned apartment jobs
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  Signed in as {sessionUser.name}. Use this page to review your assigned
                  jobs and request completion once the work is finished.
                </p>
              </div>

            </div>
          </div>
	        </section>

	        {jobs.length === 0 ? (
	          <section className="space-y-4">
	            <div className="card-shadow rounded-[32px] border border-border bg-surface px-6 py-8 text-sm leading-7 text-muted">
	              No jobs are assigned to this cleaner account yet.
	            </div>
	          </section>
	        ) : (
	          <section className="space-y-6">
	            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
	              <div className="rounded-[24px] border border-border bg-[rgba(31,122,82,0.08)] px-4 py-4">
	                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#145238]">
	                  Ready to work
	                </p>
	                <p className="mt-2 font-serif text-4xl text-ink-soft">{activeJobs.length}</p>
	              </div>
	              <div className="rounded-[24px] border border-border bg-[rgba(213,155,61,0.12)] px-4 py-4">
	                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b5a12]">
	                  Waiting review
	                </p>
	                <p className="mt-2 font-serif text-4xl text-ink-soft">{requestedJobs.length}</p>
	              </div>
	              <div className="rounded-[24px] border border-border bg-[rgba(137,48,48,0.08)] px-4 py-4">
	                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a2f2f]">
	                  Needs attention
	                </p>
	                <p className="mt-2 font-serif text-4xl text-ink-soft">{rejectedJobs.length}</p>
	              </div>
	              <div className="rounded-[24px] border border-border bg-[rgba(20,82,56,0.08)] px-4 py-4">
	                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#145238]">
	                  Completed
	                </p>
	                <p className="mt-2 font-serif text-4xl text-ink-soft">{completedJobs.length}</p>
	              </div>
	            </div>

	            <JobsSection
	              title="Jobs ready for action"
	              subtitle="Ready to work"
	              countLabel="open"
	              emptyMessage="No active jobs are waiting for action right now."
	              jobsForSection={activeJobs}
	              toneClassName="bg-[rgba(31,122,82,0.10)] text-[#145238]"
	            />

	            <JobsSection
	              title="Waiting for admin approval"
	              subtitle="Review queue"
	              countLabel="pending"
	              emptyMessage="No completion requests are waiting right now."
	              jobsForSection={requestedJobs}
	              toneClassName="bg-[rgba(213,155,61,0.12)] text-[#8b5a12]"
	            />

	            <JobsSection
	              title="Sent back for attention"
	              subtitle="Needs changes"
	              countLabel="returned"
	              emptyMessage="No jobs have been sent back by admin."
	              jobsForSection={rejectedJobs}
	              toneClassName="bg-[rgba(137,48,48,0.10)] text-[#8a2f2f]"
	            />

	            <JobsSection
	              title="Completed jobs"
	              subtitle="History"
	              countLabel="done"
	              emptyMessage="Completed jobs will appear here after approval."
	              jobsForSection={completedJobs}
	              toneClassName="bg-[rgba(20,82,56,0.10)] text-[#145238]"
	            />
	          </section>
	        )}
	      </div>
	    </main>
  );
}
