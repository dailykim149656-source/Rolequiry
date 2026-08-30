import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "bell"
  | "briefcase"
  | "building"
  | "check"
  | "code"
  | "compass"
  | "dollar"
  | "flag"
  | "lightbulb"
  | "message"
  | "path"
  | "people"
  | "plane"
  | "question"
  | "scales"
  | "spark"
  | "tension";

export function Icon({
  className,
  name,
}: {
  readonly className?: string;
  readonly name: IconName;
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="m9 5 7 7-7 7M4 12h12" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    briefcase: (
      <>
        <rect height="15" rx="2" width="18" x="3" y="6" />
        <path d="M8 6V4h8v2M3 12h18M10 12v2h4v-2" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1M2 21h20" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    code: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    dollar: (
      <>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    flag: <path d="M5 22V4m0 0h11l-1.5 3L16 10H5" />,
    lightbulb: (
      <>
        <path d="M9 18h6M10 22h4" />
        <path d="M8.5 15.5A7 7 0 1 1 15.5 15.5c-.9.6-1.5 1.4-1.5 2.5h-4c0-1.1-.6-1.9-1.5-2.5Z" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 11h.01M12 11h.01M16 11h.01" />
      </>
    ),
    path: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M6 7v9a2 2 0 0 0 2 2h8M8 10h7a3 3 0 0 0 3-3" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1M15 14.5a5 5 0 0 1 6 4.5v1" />
      </>
    ),
    plane: <path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l5-5" />,
    question: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.5 2.5 0 1 1 4.2 1.8c-1.2.9-2 1.4-2 3.2M12 18h.01" />
      </>
    ),
    scales: (
      <>
        <path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7ZM17 7l-4 7h8l-4-7ZM8 21h8" />
      </>
    ),
    spark: (
      <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3ZM5 3v4M3 5h4M19 17v4M17 19h4" />
    ),
    tension: <path d="m13 2-2 8h6L9 22l2-8H5l8-12Z" />,
  };
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
