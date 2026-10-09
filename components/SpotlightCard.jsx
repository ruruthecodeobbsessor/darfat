import Link from "next/link";
import { ArrowLeft, Briefcase, Calendar, Code2, Leaf, Lightbulb, MapPin, Sparkles, Trophy, Users } from "lucide-react";
import { getOpportunityType } from "@/lib/constants";

const TYPE_ICONS = { hackathon: Code2, volunteer: Leaf, competition: Trophy, workshop: Lightbulb, club: Users };

function Meta({ icon: Icon, children }) {
  return (
    <li className="flex min-w-0 items-center gap-2 text-[13px] text-slate-500">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </li>
  );
}

// Opportunity card (name kept for existing imports). The whole card is one link to the details page.
export function SpotlightCard({ item }) {
  const type = getOpportunityType(item.type);
  const TypeIcon = TYPE_ICONS[item.type] ?? Sparkles;
  // Same date format as the details page; the database returns deadlines as Date objects.
  const date = item.date || (item.deadline ? new Date(item.deadline).toLocaleDateString("ku-IQ") : null);

  return (
    <Link
      href={`/opportunities/${item.id || ""}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-[border-color,box-shadow,translate,scale] duration-[1000ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] will-change-transform hover:-translate-y-1.5 hover:border-orange-400/80 hover:shadow-[0_0_0_3px_rgba(239,106,31,0.08),0_0_24px_-4px_rgba(239,106,31,0.28),0_18px_40px_-12px_rgba(0,0,0,0.14)] focus-visible:-translate-y-1.5 active:scale-[0.99] focus-ring sm:p-6 motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${type.tileClass}`}>
            <TypeIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          {type.label}
        </span>
        {item.matchScore > 0 && (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800" aria-label={`${item.matchScore}٪ گونجاوە`}>
            {item.matchScore}٪ گونجاوە
          </span>
        )}
      </div>

      <h3 className="mt-4 line-clamp-2 text-[17px] font-semibold leading-7 text-slate-900">{item.title}</h3>

      <ul className="mt-3 space-y-1.5">
        {item.organizer && <Meta icon={Briefcase}>{item.organizer}</Meta>}
        {item.location && <Meta icon={MapPin}>{item.location}</Meta>}
        {date && (
          <Meta icon={Calendar}>
            <span suppressHydrationWarning>{date}</span>
          </Meta>
        )}
      </ul>

      {item.skills?.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="توانا داواکراوەکان">
          {item.skills.map((skill) => (
            <li key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {skill}
            </li>
          ))}
        </ul>
      )}

      {item.aiReason && (
        <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-[13px] leading-6 text-slate-600">
          <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden="true" />
          <span>{item.aiReason}</span>
        </p>
      )}

      <span className="mt-auto flex items-center gap-1.5 pt-5 text-[13px] font-semibold text-orange-700">
        بینینی وردەکاری
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
