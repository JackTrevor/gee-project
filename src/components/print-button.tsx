"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-[#215940] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#184330]"
    >
      Print check
    </button>
  );
}
