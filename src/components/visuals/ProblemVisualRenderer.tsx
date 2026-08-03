"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { ProblemVisual, ShapeKind, PatternItem } from "@/lib/types";

// Dispatch component: renders a ProblemVisual payload with a friendly SVG/CSS visual.
export function ProblemVisualRenderer({ visual }: { visual: ProblemVisual }) {
  switch (visual.kind) {
    case "equal-groups":
      return <EqualGroups groups={visual.groups} perGroup={visual.perGroup} emoji={visual.emoji} label={visual.label} />;
    case "sharing-baskets":
      return <SharingBaskets total={visual.total} perGroup={visual.perGroup} emoji={visual.emoji} label={visual.label} />;
    case "array":
      return <ArrayVisual rows={visual.rows} cols={visual.cols} emoji={visual.emoji} />;
    case "fraction-pie":
      return <FractionPie numerator={visual.numerator} denominator={visual.denominator} />;
    case "fraction-bar":
      return <FractionBar numerator={visual.numerator} denominator={visual.denominator} />;
    case "clock":
      return <AnalogClock hour={visual.hour} minute={visual.minute} />;
    case "area-grid":
      return <AreaGrid rows={visual.rows} cols={visual.cols} shaded={visual.shaded ?? true} />;
    case "perimeter":
      return <PerimeterVisual width={visual.width} height={visual.height} unit={visual.unit} />;
    case "shape":
      return <ShapeVisual shape={visual.shape} />;
    case "number-line":
      return (
        <NumberLineVisual
          start={visual.start}
          end={visual.end}
          numerator={visual.numerator}
          denominator={visual.denominator}
          ticks={visual.ticks}
        />
      );
    case "number-blocks":
      return <NumberBlocks value={visual.value} />;
    case "count-row":
      return <CountRow emoji={visual.emoji} count={visual.count} />;
    case "compare-rows":
      return <CompareRows leftEmoji={visual.leftEmoji} leftCount={visual.leftCount} rightEmoji={visual.rightEmoji} rightCount={visual.rightCount} />;
    case "pattern":
      return <PatternVisual items={visual.items} missingIndex={visual.missingIndex} />;
    case "color-shape":
      return <ColorShape shape={visual.shape} color={visual.color} />;
    case "number-card":
      return <NumberCard value={visual.value} />;
    case "size-shapes":
      return <SizeShapes shapes={visual.shapes} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Sharing baskets: shows the known total and basket size without revealing
// how many baskets are needed.
// ---------------------------------------------------------------------------
function SharingBaskets({
  total,
  perGroup,
  emoji,
  label,
}: {
  total: number;
  perGroup: number;
  emoji: string;
  label?: string;
}) {
  return (
    <div
      className="w-full"
      role="img"
      aria-label={`${total} ${label ?? "items"}, with ${perGroup} in each basket; find the unknown number of baskets`}
    >
      <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
        <div className="flex min-w-[150px] flex-col items-center rounded-3xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-center dark:border-amber-900 dark:bg-amber-950/25">
          <span className="text-4xl" aria-hidden="true">{emoji}</span>
          <span className="mt-1 font-display text-3xl font-bold text-amber-900 dark:text-amber-100">{total}</span>
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">{label ?? "items"} to share</span>
        </div>

        <span className="font-display text-3xl font-bold text-[#b35b3d]" aria-hidden="true">÷</span>

        <div className="flex w-[150px] flex-col items-center">
          <span className="mb-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {perGroup} in each
          </span>
          <div className="relative h-[145px] w-full">
            <Image src="/lesson-basket.webp" alt="" fill sizes="150px" className="z-10 object-contain" aria-hidden="true" />
            <BasketContents count={perGroup} emoji={emoji} />
          </div>
        </div>

        <span className="font-display text-3xl font-bold text-[#b35b3d]" aria-hidden="true">=</span>

        <div className="flex h-28 min-w-[150px] items-center justify-center rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50/70 px-5 text-center dark:border-violet-800 dark:bg-violet-950/25">
          <span className="font-display text-xl font-bold text-violet-800 dark:text-violet-200">How many<br />baskets?</span>
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-muted-foreground">
        Make equal baskets with {perGroup} in each. Stop when all {total} are shared.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equal groups: real baskets with countable items placed inside them.
// ---------------------------------------------------------------------------
function EqualGroups({
  groups,
  perGroup,
  emoji,
  label,
}: {
  groups: number;
  perGroup: number;
  emoji: string;
  label?: string;
}) {
  return (
    <div
      className="w-full"
      role="img"
      aria-label={`${groups} baskets with ${perGroup} ${label ?? "items"} in each basket`}
    >
      <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-5 sm:gap-x-4">
        {Array.from({ length: groups }).map((_, g) => (
          <div key={g} className="flex w-[112px] flex-col items-center sm:w-[132px]">
            <span className="mb-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              Basket {g + 1}
            </span>
            <div className="relative h-[125px] w-full sm:h-[148px]">
              <Image
                src="/lesson-basket.webp"
                alt=""
                fill
                sizes="132px"
                className="z-10 object-contain"
                aria-hidden="true"
              />
              <BasketContents count={perGroup} emoji={emoji} />
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-2 font-display text-base font-bold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100 sm:text-lg">
        <span>{groups} groups of {perGroup}</span>
        <span aria-hidden="true">=</span>
        <span>{groups} × {perGroup}</span>
      </div>
    </div>
  );
}

function BasketContents({ count, emoji }: { count: number; emoji: string }) {
  const columns = count <= 2 ? count : count === 3 ? 3 : count === 4 ? 2 : 3;
  const sizeClass = count <= 4
    ? "text-[23px] sm:text-[26px]"
    : count <= 6
      ? "text-[19px] sm:text-[22px]"
      : "text-[16px] sm:text-[19px]";

  return (
    <div
      className="absolute left-1/2 top-[55%] z-20 grid w-[68%] -translate-x-1/2 -translate-y-1/2 place-items-center gap-x-0.5 gap-y-0.5 px-1 leading-none"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className={`${sizeClass} drop-shadow-sm`}>{emoji}</span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Array visual (rows x cols of emoji)
// ---------------------------------------------------------------------------
function ArrayVisual({ rows, cols, emoji }: { rows: number; cols: number; emoji: string }) {
  return (
    <div
      className="inline-grid gap-1 rounded-2xl bg-amber-50/70 p-3 dark:bg-amber-950/20"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => (
        <span key={i} className="text-2xl leading-none">
          {emoji}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fraction pie (circle split into equal slices, some shaded)
// ---------------------------------------------------------------------------
function FractionPie({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) {
  const radius = 70;
  const cx = 80;
  const cy = 80;
  const slices = Array.from({ length: denominator }).map((_, i) => {
    const startAngle = (i / denominator) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const shaded = i < numerator;
    return { d, shaded, i };
  });
  return (
    <svg viewBox="0 0 160 160" className="h-44 w-44">
      <circle cx={cx} cy={cy} r={radius + 2} className="fill-none stroke-foreground/30" strokeWidth={2} />
      {slices.map((s) => (
        <path
          key={s.i}
          d={s.d}
          className={
            s.shaded
              ? "fill-rose-400 stroke-white"
              : "fill-rose-100/60 stroke-white dark:fill-rose-950/40"
          }
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Fraction bar (rectangle split into equal columns, some shaded)
// ---------------------------------------------------------------------------
function FractionBar({ numerator, denominator }: { numerator: number; denominator: number }) {
  return (
    <div className="flex h-12 w-72 overflow-hidden rounded-xl border-2 border-foreground/20">
      {Array.from({ length: denominator }).map((_, i) => (
        <div
          key={i}
          className={
            i < numerator
              ? "flex-1 bg-rose-400"
              : "flex-1 bg-rose-100/70 dark:bg-rose-950/30"
          }
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analog clock
// ---------------------------------------------------------------------------
function AnalogClock({ hour, minute }: { hour: number; minute: number }) {
  const cx = 80;
  const cy = 80;
  const r = 68;
  // hour hand: 360deg / 12 hours, plus minutes contribution
  const hourAngle = ((hour % 12) + minute / 60) * 30 - 90;
  const minuteAngle = (minute / 60) * 360 - 90;
  const hourLen = 38;
  const minLen = 56;
  const hx = cx + hourLen * Math.cos((hourAngle * Math.PI) / 180);
  const hy = cy + hourLen * Math.sin((hourAngle * Math.PI) / 180);
  const mx = cx + minLen * Math.cos((minuteAngle * Math.PI) / 180);
  const my = cy + minLen * Math.sin((minuteAngle * Math.PI) / 180);

  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const outer = r - 4;
    const inner = r - 12;
    return {
      x1: cx + outer * Math.cos(a),
      y1: cy + outer * Math.sin(a),
      x2: cx + inner * Math.cos(a),
      y2: cy + inner * Math.sin(a),
      label: i === 0 ? 12 : i,
      lx: cx + (r - 22) * Math.cos(a),
      ly: cy + (r - 22) * Math.sin(a) + 4,
    };
  });

  return (
    <svg viewBox="0 0 160 160" className="h-48 w-48">
      <circle cx={cx} cy={cy} r={r} className="fill-card stroke-foreground/30" strokeWidth={3} />
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            className="stroke-foreground/50"
            strokeWidth={2}
          />
          <text
            x={t.lx}
            y={t.ly}
            textAnchor="middle"
            className="fill-foreground font-display text-[11px] font-semibold"
          >
            {t.label}
          </text>
        </g>
      ))}
      {/* hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={hx}
        y2={hy}
        className="stroke-primary"
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={mx}
        y2={my}
        className="stroke-rose-500"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} className="fill-primary" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Area grid (rows x cols of unit squares, shaded)
// ---------------------------------------------------------------------------
function AreaGrid({ rows, cols, shaded }: { rows: number; cols: number; shaded: boolean }) {
  const cell = 22;
  const pad = 8;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full max-w-[320px]">
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={pad + c * cell}
            y={pad + r * cell}
            width={cell}
            height={cell}
            className={
              shaded
                ? "fill-teal-300 stroke-white dark:fill-teal-700"
                : "fill-none stroke-foreground/40"
            }
            strokeWidth={2}
          />
        ))
      )}
      {/* outer border */}
      <rect
        x={pad}
        y={pad}
        width={cols * cell}
        height={rows * cell}
        className="fill-none stroke-foreground/70"
        strokeWidth={3}
        rx={4}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Perimeter rectangle with labelled sides
// ---------------------------------------------------------------------------
function PerimeterVisual({
  width,
  height,
  unit,
}: {
  width: number;
  height: number;
  unit?: string;
}) {
  // scale so it fits
  const maxSide = 150;
  const scale = Math.min(maxSide / Math.max(width, 1), maxSide / Math.max(height, 1));
  const w = Math.max(60, width * scale);
  const h = Math.max(50, height * scale);
  const pad = 26;
  return (
    <svg viewBox={`0 0 ${w + pad * 2} ${h + pad * 2}`} className="h-auto w-full max-w-[300px]">
      <rect
        x={pad}
        y={pad}
        width={w}
        height={h}
        className="fill-emerald-100/70 stroke-emerald-500 dark:fill-emerald-950/30"
        strokeWidth={4}
        rx={6}
      />
      <text x={pad + w / 2} y={pad - 8} textAnchor="middle" className="fill-emerald-700 font-display text-sm font-semibold dark:fill-emerald-300">
        {width} {unit ?? ""}
      </text>
      <text x={pad + w / 2} y={pad + h + 18} textAnchor="middle" className="fill-emerald-700 font-display text-sm font-semibold dark:fill-emerald-300">
        {width} {unit ?? ""}
      </text>
      <text
        x={pad - 8}
        y={pad + h / 2}
        textAnchor="middle"
        className="fill-emerald-700 font-display text-sm font-semibold dark:fill-emerald-300"
        transform={`rotate(-90 ${pad - 8} ${pad + h / 2})`}
      >
        {height} {unit ?? ""}
      </text>
      <text
        x={pad + w + 16}
        y={pad + h / 2}
        textAnchor="middle"
        className="fill-emerald-700 font-display text-sm font-semibold dark:fill-emerald-300"
        transform={`rotate(90 ${pad + w + 16} ${pad + h / 2})`}
      >
        {height} {unit ?? ""}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Shape visual — polygons drawn from their side count
// ---------------------------------------------------------------------------
function shapeSides(shape: ShapeKind): number {
  switch (shape) {
    case "triangle":
      return 3;
    case "square":
    case "rectangle":
    case "rhombus":
    case "parallelogram":
    case "trapezoid":
    case "quadrilateral":
      return 4;
    case "pentagon":
      return 5;
    case "hexagon":
      return 6;
    case "circle":
      return 0;
  }
}

function ShapeVisual({ shape }: { shape: ShapeKind }) {
  const cx = 80;
  const cy = 80;
  const r = 60;
  const sides = shapeSides(shape);

  if (shape === "circle") {
    return (
      <svg viewBox="0 0 160 160" className="h-44 w-44">
        <circle cx={cx} cy={cy} r={r} className="fill-sky-200 stroke-sky-500" strokeWidth={4} />
      </svg>
    );
  }

  // Special-case rectangles/squares/rhombus for clearer look
  if (shape === "rectangle") {
    return (
      <svg viewBox="0 0 160 160" className="h-44 w-44">
        <rect x={26} y={48} width={108} height={64} rx={3} className="fill-violet-200 stroke-violet-500" strokeWidth={4} />
      </svg>
    );
  }
  if (shape === "square") {
    return (
      <svg viewBox="0 0 160 160" className="h-44 w-44">
        <rect x={38} y={38} width={84} height={84} rx={3} className="fill-amber-200 stroke-amber-500" strokeWidth={4} />
      </svg>
    );
  }
  if (shape === "rhombus") {
    const pts = `${cx},28 132,${cy} ${cx},132 28,${cy}`;
    return (
      <svg viewBox="0 0 160 160" className="h-44 w-44">
        <polygon points={pts} className="fill-rose-200 stroke-rose-500" strokeWidth={4} strokeLinejoin="round" />
      </svg>
    );
  }
  if (shape === "parallelogram") {
    const pts = `40,116 70,44 132,44 102,116`;
    return (
      <svg viewBox="0 0 160 160" className="h-44 w-44">
        <polygon points={pts} className="fill-teal-200 stroke-teal-500" strokeWidth={4} strokeLinejoin="round" />
      </svg>
    );
  }
  if (shape === "trapezoid") {
    const pts = `32,116 56,44 120,44 128,116`;
    return (
      <svg viewBox="0 0 160 160" className="h-44 w-44">
        <polygon points={pts} className="fill-emerald-200 stroke-emerald-500" strokeWidth={4} strokeLinejoin="round" />
      </svg>
    );
  }

  // Generic regular polygon
  const pts = Array.from({ length: sides })
    .map((_, i) => {
      const a = (i / sides) * 2 * Math.PI - Math.PI / 2;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 160 160" className="h-44 w-44">
      <polygon points={pts} className="fill-fuchsia-200 stroke-fuchsia-500" strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Number line with fractions
// ---------------------------------------------------------------------------
function NumberLineVisual({
  start,
  end,
  numerator,
  denominator,
  ticks,
}: {
  start: number;
  end: number;
  numerator: number;
  denominator: number;
  ticks: number;
}) {
  const pad = 30;
  const w = 320;
  const h = 70;
  const lineY = 42;
  const usableW = w - pad * 2;
  const span = end - start;
  const xFor = (frac: number) => pad + (frac / span) * usableW;
  const dotFrac = numerator / denominator;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full max-w-[340px]">
      <line x1={pad} y1={lineY} x2={w - pad} y2={lineY} className="stroke-foreground/70" strokeWidth={2} />
      {/* endpoints */}
      {[0, 1].map((f) => (
        <g key={f}>
          <line x1={xFor(f)} y1={lineY - 7} x2={xFor(f)} y2={lineY + 7} className="stroke-foreground/70" strokeWidth={2} />
          <text x={xFor(f)} y={lineY + 24} textAnchor="middle" className="fill-foreground font-display text-xs font-semibold">
            {start + f * span}
          </text>
        </g>
      ))}
      {/* tick marks for subdivisions */}
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const frac = i / ticks;
        if (frac === 0 || frac === 1) return null;
        return (
          <line
            key={i}
            x1={xFor(frac)}
            y1={lineY - 5}
            x2={xFor(frac)}
            y2={lineY + 5}
            className="stroke-foreground/40"
            strokeWidth={1.5}
          />
        );
      })}
      {/* the dot */}
      <circle cx={xFor(dotFrac)} cy={lineY} r={8} className="fill-rose-500 stroke-white" strokeWidth={2} />
      <text x={xFor(dotFrac)} y={lineY - 16} textAnchor="middle" className="fill-rose-600 font-display text-sm font-bold dark:fill-rose-300">
        ?
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Number blocks (base-ten style) — simplified
// ---------------------------------------------------------------------------
function NumberBlocks({ value }: { value: number }) {
  const thousands = Math.floor(value / 1000);
  const hundreds = Math.floor((value % 1000) / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;
  return (
    <div className="flex flex-wrap items-end justify-center gap-4 text-center">
      {thousands > 0 && (
        <div>
          <div className="grid h-16 w-16 grid-cols-10 grid-rows-10 gap-px overflow-hidden rounded bg-violet-300 dark:bg-violet-700">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="bg-violet-400/70 dark:bg-violet-600/70" />
            ))}
          </div>
          <div className="mt-1 text-xs font-semibold text-violet-600">× {thousands}</div>
          <div className="text-[10px] text-muted-foreground">thousands</div>
        </div>
      )}
      {hundreds > 0 && (
        <div>
          <div className="grid h-16 w-16 grid-cols-10 grid-rows-10 gap-px overflow-hidden rounded bg-emerald-300 dark:bg-emerald-700">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="bg-emerald-400/70 dark:bg-emerald-600/70" />
            ))}
          </div>
          <div className="mt-1 text-xs font-semibold text-emerald-600">× {hundreds}</div>
          <div className="text-[10px] text-muted-foreground">hundreds</div>
        </div>
      )}
      {tens > 0 && (
        <div>
          <div className="flex h-16 w-16 flex-col justify-between gap-1 rounded bg-amber-300 p-1 dark:bg-amber-700">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-1 w-full rounded bg-amber-500/80" />
            ))}
          </div>
          <div className="mt-1 text-xs font-semibold text-amber-600">× {tens}</div>
          <div className="text-[10px] text-muted-foreground">tens</div>
        </div>
      )}
      {ones > 0 && (
        <div>
          <div className="flex h-16 w-16 flex-wrap content-start gap-1 rounded bg-rose-300 p-1 dark:bg-rose-700">
            {Array.from({ length: ones }).map((_, i) => (
              <div key={i} className="h-3 w-3 rounded-full bg-rose-500" />
            ))}
          </div>
          <div className="mt-1 text-xs font-semibold text-rose-600">× {ones}</div>
          <div className="text-[10px] text-muted-foreground">ones</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preschool visuals
// ---------------------------------------------------------------------------

// A big row of countable emoji for "how many?"
function CountRow({ emoji, count }: { emoji: string; count: number }) {
  return (
    <div className="flex max-w-md flex-wrap justify-center gap-2 rounded-3xl bg-amber-50 p-5 dark:bg-amber-950/20">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
          className="text-5xl leading-none drop-shadow-sm sm:text-6xl"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

// Two rows side-by-side for comparing quantities.
function CompareRows({
  leftEmoji,
  leftCount,
  rightEmoji,
  rightCount,
}: {
  leftEmoji: string;
  leftCount: number;
  rightEmoji: string;
  rightCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="rounded-3xl bg-sky-50 p-4 dark:bg-sky-950/20">
        <div className="mb-1 text-center text-xs font-bold text-sky-600">LEFT</div>
        <div className="flex max-w-[200px] flex-wrap justify-center gap-1.5 text-4xl">
          {Array.from({ length: leftCount }).map((_, i) => (
            <span key={i}>{leftEmoji}</span>
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-rose-50 p-4 dark:bg-rose-950/20">
        <div className="mb-1 text-center text-xs font-bold text-rose-600">RIGHT</div>
        <div className="flex max-w-[200px] flex-wrap justify-center gap-1.5 text-4xl">
          {Array.from({ length: rightCount }).map((_, i) => (
            <span key={i}>{rightEmoji}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// A pattern row with an optional "?" at the missing position.
function PatternVisual({ items, missingIndex }: { items: PatternItem[]; missingIndex: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-violet-50 p-5 dark:bg-violet-950/20">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          {i === missingIndex ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-dashed border-violet-400 font-display text-3xl font-bold text-violet-500">
              ?
            </div>
          ) : (
            <PatternItemView item={item} size={56} />
          )}
        </div>
      ))}
      {missingIndex >= 0 && (
        <div className="ml-1 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-dashed border-violet-300 font-display text-2xl text-violet-400">
          →
        </div>
      )}
    </div>
  );
}

function PatternItemView({ item, size }: { item: PatternItem; size: number }) {
  if (item.type === "emoji") {
    return <span style={{ fontSize: size * 0.7 }}>{item.value}</span>;
  }
  return <ColoredShape shape={item.shape} color={item.color} size={size} />;
}

// A single colored shape (for color ID questions).
function ColorShape({ shape, color }: { shape: ShapeKind; color: string }) {
  return (
    <div className="flex justify-center">
      <ColoredShape shape={shape} color={color} size={120} />
    </div>
  );
}

// A big number card for "what number is this?"
function NumberCard({ value }: { value: number }) {
  return (
    <div className="flex justify-center">
      <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 font-display text-7xl font-bold text-white shadow-lg sm:h-40 sm:w-40 sm:text-8xl">
        {value}
      </div>
    </div>
  );
}

// Two shapes of different sizes for big/small comparison.
function SizeShapes({ shapes }: { shapes: Array<{ shape: ShapeKind; color: string; size: number }> }) {
  return (
    <div className="flex items-end justify-center gap-8 rounded-3xl bg-teal-50 p-6 dark:bg-teal-950/20">
      {shapes.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <ColoredShape shape={s.shape} color={s.color} size={s.size * 1.6} />
          <span className="text-xs font-bold text-muted-foreground">{i === 0 ? "LEFT" : "RIGHT"}</span>
        </div>
      ))}
    </div>
  );
}

// Render a filled colored shape (circle/square/triangle/rectangle) at a given size.
function ColoredShape({ shape, color, size }: { shape: ShapeKind; color: string; size: number }) {
  const w = size;
  const h = size;
  if (shape === "circle") {
    return (
      <svg width={w} height={h} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill={color} stroke="white" strokeWidth="3" />
      </svg>
    );
  }
  if (shape === "square") {
    return (
      <svg width={w} height={h} viewBox="0 0 100 100">
        <rect x="8" y="8" width="84" height="84" rx="6" fill={color} stroke="white" strokeWidth="3" />
      </svg>
    );
  }
  if (shape === "triangle") {
    return (
      <svg width={w} height={h} viewBox="0 0 100 100">
        <polygon points="50,10 92,88 8,88" fill={color} stroke="white" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    );
  }
  if (shape === "rectangle") {
    return (
      <svg width={w * 1.3} height={h} viewBox="0 0 130 100">
        <rect x="6" y="14" width="118" height="72" rx="5" fill={color} stroke="white" strokeWidth="3" />
      </svg>
    );
  }
  // fallback generic polygon
  return (
    <svg width={w} height={h} viewBox="0 0 100 100">
      <polygon points="50,8 92,38 76,90 24,90 8,38" fill={color} stroke="white" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

// motion import moved to top of file
