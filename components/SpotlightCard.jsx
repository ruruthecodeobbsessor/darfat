"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, Calendar, Sparkles, ArrowLeft, Tag, Code2, Leaf, Trophy, Lightbulb, Users } from "lucide-react";
import { OPPORTUNITY_TYPES } from "@/lib/constants";

const getCategoryIcon = (type, className) => {
  switch (type) {
    case "hackathon": return <Code2 className={className} />;
    case "volunteer": return <Leaf className={className} />;
    case "competition": return <Trophy className={className} />;
    case "workshop": return <Lightbulb className={className} />;
    case "club": return <Users className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const getCategorySolidBg = (type) => {
  switch (type) {
    case "hackathon": return "bg-[#FF8B45]";
    case "volunteer": return "bg-[#A5D4A3]";
    case "competition": return "bg-[#E2B4FF]";
    case "workshop": return "bg-[#8ABAF4]";
    case "club": return "bg-[#FCD34D]";
    default: return "bg-slate-200";
  }
};

export function SpotlightCard({ item }) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden bg-white/40 backdrop-blur-[40px] border border-white/50 shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] hover:-translate-y-1 hover:bg-white/50 hover:border-white/80 rounded-[28px] transition-all duration-500 ease-out flex flex-col h-full"
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 rounded-[28px] z-0"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(249,115,22,0.1), transparent 40%)`,
        }}
      />
      
      {/* Cover Section */}
      <div className={`relative w-full h-48 flex items-center justify-center shrink-0 transition-colors duration-300 ${getCategorySolidBg(item.type)}`}>
        {item.matchScore > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-white/90 text-slate-900 shadow-sm backdrop-blur-sm">
              {item.matchScore}% گونجاوە
            </span>
          </div>
        )}
        
        {/* Large Centered Icon matching the mockup */}
        {getCategoryIcon(item.type, "w-20 h-20 text-slate-900 group-hover:scale-110 transition-transform duration-500")}
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 pt-5">
        <div className="mb-6 flex-1">
          <h3 className="text-[20px] font-extrabold text-slate-900 leading-snug mb-5 transition-colors duration-300 line-clamp-2">
            {item.title}
          </h3>
          
          <div className="flex flex-wrap gap-2 text-[12px] font-semibold text-slate-600">
            {item.type && OPPORTUNITY_TYPES[item.type] && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm border ${OPPORTUNITY_TYPES[item.type].badgeClass}`}>
                {getCategoryIcon(item.type, "w-3.5 h-3.5")}
                <span className="line-clamp-1">{OPPORTUNITY_TYPES[item.type].label}</span>
              </div>
            )}
            {item.organizer && (
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-100 px-3 py-2 rounded-xl shadow-sm transition-colors">
                <Briefcase className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="line-clamp-1">{item.organizer}</span>
              </div>
            )}
            {item.location && (
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-100 px-3 py-2 rounded-xl shadow-sm transition-colors">
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="line-clamp-1">{item.location}</span>
              </div>
            )}
            {(item.date || item.deadline) && (
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-100 px-3 py-2 rounded-xl shadow-sm transition-colors">
                <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span suppressHydrationWarning>{item.date || String(item.deadline).split('T')[0]}</span>
              </div>
            )}
          </div>

          {item.skills && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {item.skills.map((skill) => (
                <span key={skill} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-500">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {item.aiReason && (
          <div className="mb-7 bg-white/40 backdrop-blur-2xl rounded-[20px] p-4 border border-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group-hover:border-white transition-colors duration-500">
            <div className="flex items-start gap-3 relative z-10">
              <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-white shrink-0">
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-[13px] text-slate-700 leading-relaxed font-medium mt-0.5">
                {item.aiReason}
              </p>
            </div>
          </div>
        )}

        <Link 
          href={`/opportunities/${item.id || ''}`} 
          className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between text-[13.5px] font-extrabold text-slate-800 transition-colors"
        >
          <span>بینینی وردەکاری زیاتر</span>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 group-hover:shadow-sm transition-all duration-300">
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-300" />
          </div>
        </Link>
      </div>
    </div>
  );
}
