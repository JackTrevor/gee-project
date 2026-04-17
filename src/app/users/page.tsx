import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createUserAccount } from "@/app/actions";
import { LogoutButton } from "@/components/logout-button";
import { getSessionCookieName, getSessionUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

async function getUsersPageData() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const sessionUser = await getSessionUser(cookieStore.get(getSessionCookieName())?.value);

  if (!sessionUser || sessionUser.role !== "admin") {
    redirect("/jobs");
  }

  const users = await User.find().sort({ role: 1, name: 1 }).lean();

  return {
    sessionUser,
    users: users.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    })),
  };
}

export default async function UsersPage() {
  const { sessionUser, users } = await getUsersPageData();

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="card-shadow overflow-hidden rounded-[32px] border border-border bg-surface text-foreground backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
                    Admin users
                  </div>
                  <LogoutButton />
                </div>
                <h1 className="font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
                  Manage who can enter Gee Project.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  Signed in as {sessionUser.name}. This page is reserved for admins,
                  and it lets you create staff or additional admin accounts for the workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Overview
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-full border border-border bg-white/70 px-4 py-2 text-ink-soft transition hover:bg-white"
                >
                  Jobs
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Add user
            </p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Create a new login
            </h2>
            <form action={createUserAccount} className="mt-6 space-y-3">
              <input
                name="name"
                placeholder="Full name"
                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Temporary password"
                minLength={8}
                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                required
              />
              <select
                name="role"
                defaultValue="staff"
                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <button className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                Create user
              </button>
            </form>
          </article>

          <article className="card-shadow rounded-[32px] border border-border bg-surface p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Current users
            </p>
            <h2 className="mt-2 font-serif text-3xl text-ink-soft">
              Workspace access
            </h2>
            <div className="mt-6 space-y-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="rounded-[24px] border border-border bg-white/70 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink-soft">{user.name}</p>
                      <p className="text-sm text-muted">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-[rgba(201,111,59,0.12)] px-3 py-1 text-accent-strong">
                        {user.role}
                      </span>
                      <span className="rounded-full bg-[rgba(34,94,67,0.10)] px-3 py-1 text-[#215940]">
                        {user.active ? "active" : "inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
