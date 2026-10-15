export function NewDot({ corner = false }: { corner?: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full bg-brick ring-2 ring-brick/20 ${
          corner ? "absolute top-2 right-1.5" : "ml-1 inline-block"
        }`}
      />
      <span className="sr-only">, new</span>
    </>
  );
}
