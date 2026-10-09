"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import Link from "next/link";
import { ArrowLeft, Award, BookOpen, Briefcase, Calendar, Check, Compass, GraduationCap, HandHeart, Lightbulb, MapPin, Terminal, Trophy, Users2 } from "lucide-react";
import { getOpportunityType } from "@/lib/constants";

const TYPE_ICONS = {
  hackathon: Terminal,
  volunteer: HandHeart,
  competition: Trophy,
  workshop: GraduationCap,
  club: Users2,
  course: BookOpen,
  training: GraduationCap,
  internship: Briefcase,
  scholarship: Award,
  job: Briefcase,
  event: Calendar,
};

function Meta({ icon: Icon, children }) {
  const { t: localize } = useI18n();
  return (
    <li className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="truncate">{localize(children)}</span>
    </li>
  );
}

function MatchPercentageMeter({ score, formatNumber }) {
  if (!score || score <= 0) return null;

  const size = 32;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, score) / 100) * circumference;

  const ringColor =
    score >= 80
      ? "text-emerald-500 stroke-emerald-500"
      : score >= 65
      ? "text-orange-500 stroke-orange-500"
      : "text-amber-500 stroke-amber-500";

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={`${formatNumber(score)}٪ گونجان`}
      aria-label={`${formatNumber(score)}٪ گونجان`}
    >
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${ringColor} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-bold text-slate-800 tabular-nums">
        {formatNumber(score)}
      </span>
    </div>
  );
}

// Opportunity card with minimalist aesthetic and skill match indicators
export function SpotlightCard({ item, isTopRecommended = false, userSkills = [] }) {
  const { t: localize, formatDate, formatNumber } = useI18n();
  const type = getOpportunityType(item.type);
  const TypeIcon = TYPE_ICONS[item.type] ?? Compass;
  const date = item.date || (item.deadline ? formatDate(item.deadline) : null);
  const isRecommended = isTopRecommended || item.isTopRecommended || item.matchScore >= 50;

  return (
    <Link
      href={`/opportunities/${item.id || ""}`}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition-[border-color,box-shadow,translate,scale] duration-[800ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] will-change-transform hover:-translate-y-1.5 hover:border-orange-400/80 hover:shadow-[0_0_0_3px_rgba(239,106,31,0.08),0_0_24px_-4px_rgba(239,106,31,0.28),0_18px_40px_-12px_rgba(0,0,0,0.14)] focus-visible:-translate-y-1.5 active:scale-[0.99] focus-ring sm:p-6 motion-reduce:hover:translate-y-0 ${
        isRecommended ? "border-slate-200/90" : "border-slate-200/80"
      }`}
    >
      {/* Top primary accent for recommended cards — kept strictly within the card's rounded border lines */}
      {isRecommended && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"
        />
      )}

      {/* Header with Type & Sleek Percentage Meter */}
      <div className="flex items-center justify-between gap-3">
        <span title={localize(type.label)} className="inline-flex text-slate-400">
          <TypeIcon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">{localize(type.label)}</span>
        </span>

        {item.matchScore > 0 && (
          <MatchPercentageMeter score={item.matchScore} formatNumber={formatNumber} />
        )}
      </div>

      <h3 className="mt-3.5 line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-orange-700 transition-colors">
        {item.example ? localize(item.title) : item.title}
      </h3>

      <ul className="mt-3 space-y-1.5">
        {item.organizer && <Meta icon={Briefcase}>{item.organizer}</Meta>}
        {item.location && <Meta icon={MapPin}>{item.location}</Meta>}
        {date && (
          <Meta icon={Calendar}>
            <span suppressHydrationWarning>{date}</span>
          </Meta>
        )}
      </ul>

      {/* Matched & Required Skills */}
      {item.skills?.length > 0 && (
        <div className="mt-3.5">
          <ul className="flex flex-wrap items-center gap-1.5" aria-label={localize("لێهاتووییە داواکراوەکان")}>
            {item.skills.map((skill) => {
              const cleanSkill = String(skill).toLowerCase().trim();
              const isMatched = (userSkills || []).some(
                (u) => u && (cleanSkill.includes(u) || u.includes(cleanSkill))
              );
              return (
                <li
                  key={skill}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    isMatched
                      ? "border border-emerald-200/80 bg-emerald-50/90 text-emerald-800 font-semibold"
                      : "border border-slate-200/60 bg-slate-50/70 text-slate-600"
                  }`}
                >
                  {isMatched && <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />}
                  <span>{localize(skill)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Minimalist AI Reason Callout */}
      {item.aiReason && (
        <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-600">
          <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
          <span className="line-clamp-2">{localize(item.aiReason)}</span>
        </div>
      )}

      {/* Footer link */}
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-orange-700">
        {localize("بینینی وردەکاری")}
        <ArrowLeft className="directional-arrow h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
