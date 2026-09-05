import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6">
      <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-brick">
        Missing plate
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold">That recipe is not here.</h1>
      <Link
        href="/"
        className="tap mt-8 inline-flex items-center justify-center rounded-2xl bg-brick px-5 text-lg font-extrabold text-cream"
      >
        Back to Kusina
      </Link>
    </main>
  );
}
