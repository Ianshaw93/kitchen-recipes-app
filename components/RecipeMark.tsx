import type { Recipe } from "@/lib/recipes";

export function RecipeMark({
  accent,
  className = "h-16 w-16",
}: {
  accent: Recipe["accent"];
  className?: string;
}) {
  const fill = {
    brick: "#a83214",
    leaf: "#245428",
    gold: "#c98914",
    ocean: "#1d4f5c",
    ginger: "#d4893a",
    chili: "#c43c22",
  }[accent];

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="32" cy="32" r="30" fill={fill} opacity="0.14" />
      {accent === "brick" && (
        <>
          <ellipse cx="32" cy="42" rx="18" ry="8" stroke={fill} strokeWidth="2.4" />
          <path
            d="M16 42c0-12 7-22 16-22s16 10 16 22"
            stroke={fill}
            strokeWidth="2.4"
          />
          <path d="M24 28c3 2 13 2 16 0" stroke={fill} strokeWidth="2" />
        </>
      )}
      {accent === "ginger" && (
        <>
          <path
            d="M18 40c6-12 8-20 14-20s8 8 14 20"
            stroke={fill}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="24" cy="22" r="3" fill={fill} />
          <circle cx="40" cy="20" r="2.4" fill={fill} />
          <path d="M20 44h24" stroke={fill} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {accent === "ocean" && (
        <>
          <path
            d="M14 36c6 6 12 6 18 0s12-6 18 0"
            stroke={fill}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M14 44c6 6 12 6 18 0s12-6 18 0"
            stroke={fill}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M28 18c8 2 12 10 8 16-6 2-12-2-10-8 4-2 8 0 8 0"
            stroke={fill}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      )}
      {accent === "chili" && (
        <>
          <path
            d="M22 40c0-8 6-18 14-20 2 8-2 16-8 22-4 2-6 0-6-2z"
            stroke={fill}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M34 18c4-4 10-4 12-2"
            stroke={fill}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      )}
      {accent === "leaf" && (
        <>
          <path
            d="M18 42c12-18 22-22 28-22-2 14-10 24-26 26"
            stroke={fill}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M22 40c8-6 16-8 22-8"
            stroke={fill}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {accent === "gold" && (
        <>
          <path
            d="M20 40c0-10 5-20 12-20s12 10 12 20"
            stroke={fill}
            strokeWidth="2.4"
          />
          <ellipse cx="32" cy="40" rx="12" ry="6" stroke={fill} strokeWidth="2.4" />
          <path
            d="M28 18c2 4 8 4 10 0"
            stroke={fill}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
