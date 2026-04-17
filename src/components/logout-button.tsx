export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm text-ink-soft transition hover:bg-white">
        Log out
      </button>
    </form>
  );
}
