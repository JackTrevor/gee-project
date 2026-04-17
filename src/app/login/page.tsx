type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/jobs";
  const hasError = params.error === "invalid";

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
            This app now requires a shared password before anyone can see jobs,
            clients, cleaners, or future invoices.
          </p>

          <form action="/api/auth/login" method="post" className="mt-8 space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-muted"
              >
                App password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter the shared password"
                className="w-full rounded-2xl border border-border bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
                required
              />
            </div>

            {hasError ? (
              <div className="rounded-2xl border border-[rgba(137,48,48,0.18)] bg-[rgba(137,48,48,0.08)] px-4 py-3 text-sm text-[#8a2f2f]">
                That password was not correct. Please try again.
              </div>
            ) : null}

            <button className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">
              Enter workspace
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
