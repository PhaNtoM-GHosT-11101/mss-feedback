"use client";

import { useState } from "react";
import { Home, Megaphone, PartyPopper, User } from "lucide-react";

type Scheme = {
  letter: string;
  name: string;
  vibe: string;
  font: string;
  copy: string[];
  token: {
    bg: string;
    surface: string;
    surface2: string;
    ink: string;
    muted: string;
    accent: string;
    accentText: string;
    chipBg: string;
    chipText: string;
    border: string;
    dot: string;
  };
  radius: string;
  menuEmoji: string[];
};

const SCHEMES: Scheme[] = [
  {
    letter: "A",
    name: "Warm Canteen",
    vibe: "Playful food-blog energy · rounded · amber + tomato",
    font: "pg-font-bricolage",
    copy: ["How was lunch today?", "Every dish has a story — tell us yours."],
    token: {
      bg: "#FFF6E9",
      surface: "#FFFFFF",
      surface2: "#FFF0D6",
      ink: "#3B2A14",
      muted: "#A0835C",
      accent: "#EF5A2A",
      accentText: "#FFFFFF",
      chipBg: "#FFE4CC",
      chipText: "#B23A10",
      border: "#F0DDBB",
      dot: "#F4B942",
    },
    radius: "rounded-2xl",
    menuEmoji: ["🥞", "🍚", "🍲", "🍜"],
  },
  {
    letter: "B",
    name: "Editorial Noir",
    vibe: "Bold newspaper style · sharp corners · red + black",
    font: "pg-font-space",
    copy: ["THE DAY'S PLATE", "Voted by the mess, broken down for you."],
    token: {
      bg: "#F3F1EA",
      surface: "#FFFFFF",
      surface2: "#ECEAE2",
      ink: "#16130E",
      muted: "#8B8374",
      accent: "#D7263D",
      accentText: "#FFFFFF",
      chipBg: "#16130E",
      chipText: "#F3F1EA",
      border: "#DCD8CA",
      dot: "#16130E",
    },
    radius: "rounded-none",
    menuEmoji: ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"],
  },
  {
    letter: "C",
    name: "Quiet Sage",
    vibe: "Minimal calm · lots of air · deep green on cream",
    font: "pg-font-fraunces",
    copy: ["Good morning, Aditya.", "A calm place to rate your meals."],
    token: {
      bg: "#FBF9F4",
      surface: "#FFFFFF",
      surface2: "#F3EFE4",
      ink: "#232C24",
      muted: "#8FA08E",
      accent: "#3E6B4F",
      accentText: "#FFFFFF",
      chipBg: "#E8EFE4",
      chipText: "#3E6B4F",
      border: "#E5E1D6",
      dot: "#7FA98B",
    },
    radius: "rounded-xl",
    menuEmoji: ["🥣", "🥗", "🍵", "🍲"],
  },
  {
    letter: "D",
    name: "Midnight Mess",
    vibe: "Dark + moody · neon accent · street-food glow",
    font: "pg-font-bricolage",
    copy: ["Night mess tonight?", "The kitchen never sleeps."],
    token: {
      bg: "#151013",
      surface: "#1F181C",
      surface2: "#2A2025",
      ink: "#F4E9DE",
      muted: "#9B8574",
      accent: "#FF4D6D",
      accentText: "#171012",
      chipBg: "#331B22",
      chipText: "#FF8BA1",
      border: "#33262C",
      dot: "#FF4D6D",
    },
    radius: "rounded-2xl",
    menuEmoji: ["🔥", "🌶️", "🥡", "🍢"],
  },
  {
    letter: "E",
    name: "Chalk Menu",
    vibe: "Handwritten chalkboard · whiteboard menu · crayon",
    font: "pg-font-shantell",
    copy: ["What's cookin' good lookin'?", "Today's menu, hand-cooked with love."],
    token: {
      bg: "#1E2A24",
      surface: "#28362E",
      surface2: "#34453B",
      ink: "#EDF5E9",
      muted: "#9DB39A",
      accent: "#F2C14E",
      accentText: "#1E2A24",
      chipBg: "#3A4A3F",
      chipText: "#D9E8C9",
      border: "#45584C",
      dot: "#F2C14E",
    },
    radius: "rounded-xl",
    menuEmoji: ["🍞", "🥘", "🍚", "☕"],
  },
  {
    letter: "F",
    name: "Sunset Diner",
    vibe: "Retro diner · cream + cherry · big type welcome",
    font: "pg-font-fraunces",
    copy: ["Open all day, rated all night.", "Good food deserves good words."],
    token: {
      bg: "#FBEEDA",
      surface: "#FFF8EC",
      surface2: "#F6DFC0",
      ink: "#32261A",
      muted: "#A98A63",
      accent: "#C84B31",
      accentText: "#FFF8EC",
      chipBg: "#F3DBB8",
      chipText: "#8B4A1E",
      border: "#EFD9B5",
      dot: "#C84B31",
    },
    radius: "rounded-2xl",
    menuEmoji: ["🍳", "🌭", "🍟", "🍩"],
  },
];

const MEALS = [
  { e: "🍞", n: "Breakfast", avg: 4.2, count: 38, items: "Puri & aloo, Poha, Tea" },
  { e: "🍛", n: "Lunch", avg: 3.6, count: 52, items: "Rajma chawal, Salad, Curd" },
  { e: "🍜", n: "Dinner", avg: 4.0, count: 44, items: "Paneer curry, Roti, Sweet" },
];

const ISSUES = [
  { t: "Fan broken in the dining hall", up: 17, s: "In review" },
  { t: "Water cooler empty since morning", up: 9, s: "Resolved" },
];

const PRAISE = { text: "Dosa today was perfect — thanks chef!", by: "Riya · 2h" };

function MockHome({ s }: { s: Scheme }) {
  const t = s.token;
  return (
    <div className="flex h-[620px] w-[320px] shrink-0 flex-col overflow-hidden rounded-[40px] border-[6px] border-[#0e0e0e] bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]">
      <div className="no-scrollbar flex-1 overflow-y-auto" style={{ background: t.bg, color: t.ink }}>
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 items-center justify-center text-[10px] font-black tracking-tight ${s.radius}`}
              style={{ background: t.accent, color: t.accentText }}
            >
              CF
            </span>
            <span className={`${s.font} text-[15px] font-bold tracking-tight`}>Campus Feedback</span>
          </div>
          <span
            className={`flex h-8 w-8 items-center justify-center ${s.radius} text-[11px] font-bold`}
            style={{ background: t.surface2, color: t.muted }}
          >
            A
          </span>
        </div>

        {/* greeting */}
        <div className="px-5 pt-5">
          <p className={`${s.font} text-[22px] font-black leading-tight tracking-tight`}>
            {s.copy[0]}
          </p>
          <p className="mt-1 text-[12px]" style={{ color: t.muted }}>
            {s.copy[1]}
          </p>
        </div>

        {/* ratings */}
        <p
          className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: t.muted }}
        >
          Today&apos;s ratings
        </p>
        <div className="space-y-2.5 px-4">
          {MEALS.map((m) => (
            <div
              key={m.n}
              className={`p-4 ${s.radius}`}
              style={{ background: t.surface, border: `1px solid ${t.border}` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center text-xl ${s.radius}`} style={{ background: t.surface2 }}>
                    {m.e}
                  </span>
                  <div>
                    <p className={`${s.font} text-[14px] font-bold`}>{m.n}</p>
                    <p className="text-[11px]" style={{ color: t.muted }}>
                      <span style={{ color: t.dot }}>★</span> {m.avg.toFixed(1)} · {m.count} rated
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.radius === "rounded-none" ? "rounded" : ""}`}
                  style={{ background: t.chipBg, color: t.chipText }}
                >
                  Open
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-0.5 text-[15px]" aria-hidden>
                  <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
                </span>
                <span
                  className={`px-3.5 py-1.5 text-[12px] font-bold ${s.radius} ${s.radius === "rounded-none" ? "rounded" : ""}`}
                  style={{ background: t.accent, color: t.accentText }}
                >
                  Rate
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* menu */}
        <p
          className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: t.muted }}
        >
          Today&apos;s menu
        </p>
        <div className="space-y-2 px-4">
          <div className={`p-4 ${s.radius}`} style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            {MEALS.map((m, i) => (
              <div key={m.n} className={`flex items-center gap-3 ${i > 0 ? "pt-2.5" : ""}`} style={i > 0 ? { borderTop: `1px solid ${t.border}`, marginTop: "10px" } : {}}>
                <span className="w-6 text-center text-[16px]">{s.menuEmoji[i]}</span>
                <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                  <span className={`${s.font} text-[13px] font-bold`}>{m.n}</span>
                  <span className="truncate text-right text-[12px]" style={{ color: t.muted }}>
                    {m.items}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2.5 px-4 pt-6">
          <span
            className={`flex flex-1 items-center justify-center py-2.5 text-[13px] font-bold ${s.radius} ${s.radius === "rounded-none" ? "rounded" : ""}`}
            style={{ background: t.ink, color: t.bg }}
          >
            + File complaint
          </span>
          <span
            className={`flex flex-1 items-center justify-center py-2.5 text-[13px] font-bold ${s.radius} ${s.radius === "rounded-none" ? "rounded" : ""}`}
            style={{ background: t.surface, color: t.ink, border: `1px solid ${t.border}` }}
          >
            👏 Give praise
          </span>
        </div>

        {/* issues */}
        <p className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: t.muted }}>
          Top issues
        </p>
        <div className="space-y-2 px-4">
          {ISSUES.map((c) => (
            <div key={c.t} className={`flex items-start gap-3 p-3.5 ${s.radius}`} style={{ background: t.surface, border: `1px solid ${t.border}` }}>
              <span className={`flex flex-col items-center px-1.5 py-1 ${s.radius} ${s.radius === "rounded-none" ? "rounded" : ""}`} style={{ background: t.surface2 }}>
                <span className={`${s.font} text-[14px] font-black`}>{c.up}</span>
                <span className="text-[8px]" style={{ color: t.muted }}>▲</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className={`${s.font} text-[13px] font-bold leading-snug`}>{c.t}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: t.muted }}>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold`} style={{ background: t.chipBg, color: t.chipText }}>
                    {c.s}
                  </span>
                  <span className="truncate">Aditi · 1h ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* praise */}
        <p className="px-5 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: t.muted }}>
          Recent praise
        </p>
        <div className="px-4 pb-6">
          <div className={`p-4 ${s.radius}`} style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <p className={`${s.font} text-[13px] font-medium leading-snug`}>“{PRAISE.text}”</p>
            <p className="mt-1.5 text-[11px]" style={{ color: t.muted }}>
              {PRAISE.by} · Anonymous
            </p>
          </div>
        </div>
      </div>

      {/* bottom nav */}
      <div className="flex items-center justify-around border-t px-3 py-2" style={{ background: t.surface, borderColor: t.border }}>
        {[
          { I: Home, l: "Home", on: true },
          { I: Megaphone, l: "Complaints", on: false },
          { I: PartyPopper, l: "Praise", on: false },
          { I: User, l: "Profile", on: false },
        ].map(({ I, l, on }) => (
          <span key={l} className="flex flex-col items-center gap-0.5">
            <span
              className={`flex h-6 w-12 items-center justify-center ${s.radius} ${s.radius === "rounded-none" ? "rounded" : ""}`}
              style={on ? { background: t.accent, color: t.accentText } : { color: t.muted }}
            >
              <I className="h-[16px] w-[16px]" />
            </span>
            <span className={`text-[9px] font-bold ${on ? "" : "font-medium"}`} style={{ color: on ? t.ink : t.muted }}>
              {l}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Playground() {
  const [picked, setPicked] = useState<string[]>([]);

  function togglePick(l: string) {
    setPicked((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-16 text-zinc-100">
      <div className="mx-auto max-w-7xl px-5 pt-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Campus Feedback · Design playground
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Pick the looks you like<span className="text-emerald-400">.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          These are <b className="text-zinc-200">six completely different designs</b> of the SAME home screen
          (mock data, nothing real). Tap the circle to mark a favorite — combine letters or mark several. Then
          tell me <b className="text-zinc-200">the letters</b> in chat, e.g. <b className="text-zinc-200">&quot;A and D&quot;</b>.
          I&apos;ll build the real app as a blend of your picks.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-zinc-300">
          {picked.length === 0 ? (
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-500">No picks yet — tap a design</span>
          ) : (
            <>
              <span className="rounded-full bg-zinc-800 px-3 py-1">Your picks:</span>
              {picked.map((l) => (
                <button
                  key={l}
                  onClick={() => togglePick(l)}
                  className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-zinc-900"
                >
                  ✕ {l}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="mt-12 grid gap-10 xl:grid-cols-3 lg:grid-cols-2">
          {SCHEMES.map((s) => {
            const sel = picked.includes(s.letter);
            return (
              <div key={s.letter} className="flex flex-col items-center gap-4">
                <button
                  onClick={() => togglePick(s.letter)}
                  className={`w-[320px] rounded-3xl border-2 p-2 transition ${
                    sel ? "border-emerald-400 bg-emerald-400/5" : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div className={`w-[308px] ${s.radius === "rounded-none" ? "rounded-none overflow-hidden" : `overflow-hidden ${s.radius}`}`}>
                    <MockHome s={s} />
                  </div>
                </button>
                <div className="flex w-full flex-col items-center gap-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[13px] font-black ${
                        sel ? "border-emerald-400 bg-emerald-400 text-zinc-950" : "border-zinc-600 text-zinc-400"
                      }`}
                    >
                      {s.letter}
                    </span>
                    <span className={`${s.font} text-lg font-black`}>{s.name}</span>
                  </div>
                  <p className="text-center text-[11px] text-zinc-500">{s.vibe}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm font-bold">Mix &amp; match tip</p>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
            You don&apos;t have to pick one whole design. Love A&apos;s food-y warmth but D&apos;s dark theme? Say{" "}
            <b className="text-zinc-200">&quot;A, but dark like D&quot;</b> or <b className="text-zinc-200">&quot;C&apos;s calm with A&apos;s
            colors&quot;</b>. Every element — layout, buttons, fonts, colors, dark mode — can be blended however you like.
          </p>
        </div>
      </div>
    </main>
  );
}