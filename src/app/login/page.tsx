import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await connectToDatabase();

  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/jobs";
  const userCount = await User.countDocuments();
  const showSetup = userCount === 0;
  const hasLoginError = params.error === "invalid";
  const hasSetupValidationError = params.error === "setup-invalid";
  const setupClosed = params.error === "setup-closed";

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <section className="card-shadow w-full max-w-xl rounded-[32px] border border-border bg-surface p-6 backdrop-blur sm:p-8">
          <div className="inline-flex items-center rounded-full border border-[rgba(94,82,64,0.18)] bg-[rgba(255,255,255,0.55)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">
            Private workspace
          </div>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-ink-soft sm:text-5xl">
            Sign in to Gee Project
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            {showSetup
              ? "Create the first admin account for Gee Project. This first user will have admin access and can later manage the rest of the workspace."
              : "Use your email and password to enter the workspace. Role-based access is now ready so we can safely add admin-only features next."}
          </p>

          {showSetup ? (
            <form action="/api/auth/setup" method="post" className="mt-8 space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  Admin name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter the admin name"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  Admin email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter the admin email"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  Admin password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Use at least 8 characters"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  required
                  minLength={8}
                />
              </div>

              {hasSetupValidationError ? (
                <div className="rounded-2xl border border-[rgba(137,48,48,0.18)] bg-[rgba(137,48,48,0.08)] px-4 py-3 text-sm text-[#8a2f2f]">
                  Please fill every field and use a password with at least 8 characters.
                </div>
              ) : null}

              {setupClosed ? (
                <div className="rounded-2xl border border-[rgba(137,48,48,0.18)] bg-[rgba(137,48,48,0.08)] px-4 py-3 text-sm text-[#8a2f2f]">
                  Setup is already complete. Sign in with an existing user account.
                </div>
              ) : null}

              <button className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                Create admin account
              </button>
            </form>
          ) : (
            <form action="/api/auth/login" method="post" className="mt-8 space-y-4">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                  required
                />
              </div>

              {hasLoginError ? (
                <div className="rounded-2xl border border-[rgba(137,48,48,0.18)] bg-[rgba(137,48,48,0.08)] px-4 py-3 text-sm text-[#8a2f2f]">
                  That email/password combination was not correct. Please try again.
                </div>
              ) : null}

              <button className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
                Enter workspace
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
