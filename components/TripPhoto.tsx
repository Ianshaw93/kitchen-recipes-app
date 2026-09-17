import Image from "next/image";

export function TripPhoto({
  src,
  alt,
  credit,
  priority = false,
  className = "relative aspect-[16/10] overflow-hidden bg-paper-deep",
}: {
  src: string;
  alt: string;
  credit?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className="relative h-full min-h-0">
      <div className={className}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 36rem) 100vw, 36rem"
          className="object-cover"
          priority={priority}
        />
      </div>
      {credit ? <figcaption className="sr-only">{credit}</figcaption> : null}
    </figure>
  );
}
