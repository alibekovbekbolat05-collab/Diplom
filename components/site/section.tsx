export function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-20">
      {eyebrow && (
        <p className="mb-4 text-xs uppercase tracking-[.25em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mb-8 font-display text-2xl tracking-tight sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
export function PageHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="mx-auto max-w-6xl px-5 pb-4 pt-14">
      <p className="mb-5 text-xs uppercase tracking-[.25em] text-accent">
        Aspan Security / SecureOps
      </p>
      <h1 className="max-w-4xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">{sub}</p>
    </header>
  );
}
