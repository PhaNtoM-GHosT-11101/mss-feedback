"use client";

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: props.strokeWidth ?? 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
    "aria-hidden": true,
  };
}

export function IconHome(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
      <circle cx="12" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconStats(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20h16" />
      <path d="M6.5 20v-6" />
      <path d="M12 20V6.5" />
      <path d="M17.5 20v-8.5" />
      <path d="M12 6.5 15.5 4l2 2.5" />
    </svg>
  );
}

export function IconComplaint(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 11.5h3l4.5-4.5v10l-4.5-4.5h-3z" />
      <path d="M14 9.5c.7.7 1.2 1.6 1.2 2.5s-.5 1.8-1.2 2.5" />
      <path d="M16.5 7.5c1.4 1.1 2.3 2.7 2.3 4.5s-.9 3.4-2.3 4.5" />
    </svg>
  );
}

export function IconPraise(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 4.5l1.7 3.5 3.8.6-2.8 2.7.7 3.9L12 13.5l-3.4 1.7.7-3.9-2.8-2.7 3.8-.6z" />
      <path d="M18.5 15.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="currentColor" stroke="none" />
      <path d="M5.5 16l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconProfile(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 4.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
      <path d="M4.5 20c1.2-3.2 4-5 7.5-5s6.3 1.8 7.5 5" />
    </svg>
  );
}

export function IconBell(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.2 5.5 1.5 6.5H4.5C4.8 15 6 13.5 6 9.5z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

export function IconSun(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" />
    </svg>
  );
}

export function IconMoon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" />
      <path d="M15.5 6.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconStar(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={p.className}>
      <path
        d="M12 2.8l2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.4l6.3-.9z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function IconPlate(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 4.5v2" />
      <path d="M8.5 5.5v2" />
      <path d="M15.5 5.5v2" />
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13h16v1.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    </svg>
  );
}

export function IconPin(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3.5a6 6 0 0 1 6 6c0 4-6 11-6 11s-6-7-6-11a6 6 0 0 1 6-6z" />
      <circle cx="12" cy="9.5" r="2" />
    </svg>
  );
}

export function IconFlag(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.5h11l-2.2 3 2.2 3h-11" />
    </svg>
  );
}

export function IconArrowUp(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 19V5.5" />
      <path d="M6.5 11 12 5.5 17.5 11" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function IconX(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9 5.5l6.5 6.5L9 18.5" />
    </svg>
  );
}

export function IconChevronDown(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5.5 9l6.5 6.5L18.5 9" />
    </svg>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.5l3.5 2" />
    </svg>
  );
}

export function IconFilter(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 5.5h16l-6 7v5l-4 2v-7z" />
    </svg>
  );
}

export function IconShare(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 15.5V4.5" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 13.5v5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-5" />
    </svg>
  );
}

export function IconWhatsApp(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z" />
      <path d="M9 8.5c-.4 2.6 2 6.2 6 7l1-1.7-2.2-1.1-.9 1.1c-1.3-.5-2.5-1.7-3-3l1.1-.9-1.1-2.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTrash(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4.5 6.5h15" />
      <path d="M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7" />
      <path d="M6.5 6.5l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </svg>
  );
}

export function IconEdit(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20h4L20.5 7.5a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconLogout(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3.5" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function IconTrophy(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 5.5H5a0 0 0 0 0 0 0v.5a3.5 3.5 0 0 0 3.5 3.5M16 5.5h3v.5a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 13v4M8.5 20.5h7M10 20.5V17h4v3.5" />
    </svg>
  );
}

export function IconFlame(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3.5c1.5 2.6 5 4.4 5 8a5 5 0 0 1-10 0c0-1.5.6-2.8 1.4-3.9-.2 1.6.4 2.8 1.5 3.5C9.6 7.9 10.4 5.6 12 3.5z" />
    </svg>
  );
}

export function IconTrendingUp(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 17l6-6 3.5 3.5 7-7.5" />
      <path d="M14 7h6v6" />
    </svg>
  );
}

export function IconTrendingDown(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 7l6 6 3.5-3.5 7 7.5" />
      <path d="M14 17h6v-6" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3.5l7 2.5v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function IconNote(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 3.5h9l3.5 3.5v13.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14.5 3.5V7.5h4" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  );
}

export function IconZap(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M13 3 5 13.5h6l-1 7.5 8-10.5h-6z" />
    </svg>
  );
}

export function IconMapPin(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
