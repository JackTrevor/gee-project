import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { approveJobCompletion, rejectJobCompletion } from "@/app/actions";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceNav } from "@/components/workspace-nav";
import { getSessionCookieName, getSessionUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { connectToDatabase } from "@/lib/mongodb";
import { Job } from "@/models/Job";

async function getReviewQueueData() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const sessionUser = await getSessionUser(cookieStore.get(getSessionCookieName())?.value);

  if (!sessionUser || sessionUser.role !== "admin") {
    redirect("/jobs");
  }

  const jobs = await Job.find({ completionReviewStatus: "requested" })
    .sort({ completionRequestedAt: 1, cleaningDate: 1 })
    .populate("clientId", "name companyName")
    .populate("cleanerId", "name")
    .lean();

  return (jobs as unknown as Array<{
    _id: { toString(): string };
    apartmentName: string;
    apartmentAddress?: string;
    cleaningDate: string | Date;
    cleanerPayout: number;
    amountCharged: number;
    completionRequestedAt?: string | Date;
    completionRequestNote?: string;
    clientId?: { companyName?: string; name: string } | null;
    cleanerId?: { name: string } | null;
  }>).map((job) => ({
    _id: job._id.toString(),
    apartmentName: job.apartmentName,
    apartmentAddress: job.apartmentAddress,
    cleaningDate: job.cleaningDate,
    cleanerPayout: job.cleanerPayout,
    amountCharged: job.amountCharged,
    completionRequestedAt: job.completionRequestedAt,
    completionRequestNote: job.completionRequestNote,
    clientName: job.clientId?.companyName || job.clientId?.name || "Unknown client",
    cleanerName: job.cleanerId?.name || "Unknown cleaner",
  }));
}

export default async function ReviewsPage() {
  const jobs = await getReviewQueueData();

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <WorkspaceNav currentPath="/reviews" />
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                    Admin review queue
                  </div>
                  <LogoutButton />
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  Review cleaner completion requests
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  This queue lets admins approve or reject completion requests before the
                  official job status changes to completed.
                </p>
              </div>

            </div>
          </div>
        </section>

        <section className="space-y-4">
          {jobs.length === 0 ? (
            <div className="card-shadow rounded-[32px] border border-border bg-surface px-6 py-8 text-sm leading-7 text-muted">
              No completion requests are waiting for review right now.
            </div>
          ) : (
            jobs.map((job) => (
              <article
                key={job._id}
                className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <h2 className="font-serif text-3xl text-ink-soft">{job.apartmentName}</h2>
                    <p className="text-sm text-muted">{job.apartmentAddress || "No address yet"}</p>
                    <p className="text-sm leading-6 text-ink-soft">
                      Client: <span className="font-semibold">{job.clientName}</span>
                      {" · "}
                      Cleaner: <span className="font-semibold">{job.cleanerName}</span>
                      {" · "}
                      Cleaning date: <span className="font-semibold">{formatDate(job.cleaningDate)}</span>
                    </p>
                    <p className="text-sm leading-6 text-ink-soft">
                      Charged: <span className="font-semibold">{formatCurrency(job.amountCharged)}</span>
                      {" · "}
                      Payout: <span className="font-semibold">{formatCurrency(job.cleanerPayout)}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[rgba(201,111,59,0.10)] px-4 py-3 text-sm text-ink-soft">
                    Requested{" "}
                    <span className="font-semibold">
                      {job.completionRequestedAt ? formatDate(job.completionRequestedAt) : "today"}
                    </span>
                  </div>
                </div>

                {job.completionRequestNote ? (
                  <div className="mt-4 rounded-2xl border border-border bg-white/70 px-4 py-4 text-sm leading-6 text-muted">
                    Cleaner note: {job.completionRequestNote}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <form action={approveJobCompletion} className="space-y-3 rounded-[24px] border border-border bg-white/70 p-4">
                    <input type="hidden" name="jobId" value={job._id} />
                    <textarea
                      name="reviewNote"
                      rows={3}
                      placeholder="Optional approval note"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                    />
                    <button className="rounded-full bg-[#215940] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#184330]">
                      Approve and mark completed
                    </button>
                  </form>

                  <form action={rejectJobCompletion} className="space-y-3 rounded-[24px] border border-border bg-white/70 p-4">
                    <input type="hidden" name="jobId" value={job._id} />
                    <textarea
                      name="reviewNote"
                      rows={3}
                      placeholder="Tell the cleaner what still needs attention"
                      className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                    />
                    <button className="rounded-full bg-[#8a2f2f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6f2424]">
                      Reject and send back
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
